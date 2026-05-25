require 'fileutils'

clubs_dir = File.join('assets', 'clubs')
edition_dir = File.join('PreviousEditions')
newsletter_dir = File.join('PreviousEditions', 'newsletters')

[clubs_dir, edition_dir, newsletter_dir].each do |base_dir|
  Dir.glob(File.join(base_dir, '**', '*.pdf')).each do |pdf_path|
    thumb_path = pdf_path.sub(/\.pdf$/i, '.webp')
    next if File.exist?(thumb_path) && File.mtime(thumb_path) >= File.mtime(pdf_path)

    success = system("magick", "-density", "150", "#{pdf_path}[0]", "-thumbnail", "600x",
                     "-background", "white", "-alpha", "remove", "-quality", "85", thumb_path)
    puts success ? "  ✓ #{File.basename(pdf_path)}" : "  ✗ #{File.basename(pdf_path)}"
  end
end

