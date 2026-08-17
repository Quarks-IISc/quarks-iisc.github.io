# Converts an Instagram reel into a short autoplaying preview clip + poster
# image for assets/reels/, using yt-dlp + ffmpeg.
#
# This is NOT a Jekyll plugin/hook — it's a manual CLI tool that just
# happens to live in _plugins/. Jekyll `require`s every .rb file here on
# every `jekyll build`/`serve`, which would otherwise try to shell out to
# yt-dlp/ffmpeg (not installed in CI) on every single build. The
# `if __FILE__ == $0` guard below keeps this inert when Jekyll loads it,
# and only runs the conversion when you invoke the file directly:
#
#   ruby _plugins/convert_reel.rb <instagram_reel_url> <name> [start_s] [duration_s]
#
# e.g. `... campus-aura 5 20` takes the 20 seconds starting 5s in.
#
# Writes two files per reel: <name>.webm (VP9) and <name>-poster.jpg.
#
# Requires `uv` (for `uvx yt-dlp`, https://docs.astral.sh/uv/) and ffmpeg on PATH.

require 'fileutils'
require 'tmpdir'

DURATION = 18
FPS      = 30   # some reels are shot at 60; that doubles the file for no gain here

# Encode at the card's own 4:3 crop rather than shipping the full frame: the
# CSS crops to 4:3 via object-fit anyway, so any pixels outside that are bytes
# nobody ever sees. Cards render ~700px wide, so 960x720 still has headroom on
# a retina screen.
OUT_W = 960
OUT_H = 720

VP9_CRF = 32  # lower = better/bigger

# Instagram serves the real 1080p as separate DASH streams and only a small
# (~560px) muxed file as the default "best". Ask for the best video-only
# stream explicitly — without this every clip is a blurry upscale.
FORMAT = 'bv*[height<=1080]/bv*/b'

def convert_reel(url, name, start = 0, duration = DURATION)
  assets_dir = File.expand_path('../assets/reels', __dir__)
  FileUtils.mkdir_p(assets_dir)

  Dir.mktmpdir do |tmp|
    puts "Downloading #{url}..."
    system('uvx', 'yt-dlp', '-f', FORMAT, url, '-o', File.join(tmp, 'source.%(ext)s')) or
      abort("yt-dlp failed for #{url}")

    downloaded = Dir.glob(File.join(tmp, 'source.*')).first
    abort('Could not find downloaded file') unless downloaded

    webm_out   = File.join(assets_dir, "#{name}.webm")
    poster_out = File.join(assets_dir, "#{name}-poster.jpg")

    # Centre-crop to 4:3 whatever the source orientation, then scale.
    vf = "crop='min(iw,ih*4/3)':'min(ih,iw*3/4)',scale=#{OUT_W}:#{OUT_H},fps=#{FPS}"

    # -ss before -i seeks fast (keyframe-accurate); fine for picking a nicer
    # starting moment than the reel's first frame.
    seek = ['-ss', start.to_s, '-i', downloaded, '-t', duration.to_s]

    puts 'Encoding VP9...'
    system(
      'ffmpeg', '-y', *seek, '-vf', vf,
      '-an', '-c:v', 'libvpx-vp9',
      '-crf', VP9_CRF.to_s, '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2',
      webm_out
    ) or abort('ffmpeg (webm) failed')

    # Poster is taken a few seconds in, not from frame 1 — reels often open on
    # a fade or a near-black frame, and since the markup uses preload="none"
    # this image is all a visitor sees until they scroll to the clip.
    system('ffmpeg', '-y', '-ss', '3', '-i', webm_out, '-vframes', '1', '-update', '1', '-q:v', '3', poster_out) or
      abort('ffmpeg (poster) failed')

    [webm_out, poster_out].each do |f|
      puts "Wrote #{f} (#{(File.size(f) / 1024.0).round}KB)"
    end
  end
end

if __FILE__ == $0
  url, name, start, duration = ARGV
  if url.nil? || name.nil?
    abort 'Usage: ruby _plugins/convert_reel.rb <instagram_reel_url> <name> [start_s] [duration_s]'
  end
  convert_reel(url, name, (start || 0).to_i, (duration || DURATION).to_i)
end
