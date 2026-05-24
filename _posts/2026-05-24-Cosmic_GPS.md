---
layout: post
title: Cosmic GPS
author: Anonymous
categories: [stories]
image: "/assets/images/Stories/Cosmic_GPS.jpg"
excerpt: "The Global Positioning System relies on billion-light-year-distant quasars to keep your phone's location honest. Discover the unlikely connection between black holes and Google Maps."
all: true
---

**Cosmic GPS**

**Abstract**

The Global Positioning System is something most of us take for granted. Open an app, and there you are. But making GPS accurate enough to place you on the right side of a narrow alley requires solving surprisingly deep problems: the Earth moves, satellites drift, and clocks lie. This article traces how GPS works, starting from the fundamentals of trilateration, through the relativistic quirks that complicate timing, and finally to the unexpected hero of the story...quasars. These supermassive black-hole-powered galactic nuclei, billions of light-years away, serve as perfectly stationary anchors that allow astronomers to detect even the subtlest shifts in Earth’s orientation and keep GPS honest.

**Introduction**

Imagine being stranded somewhere without Google Maps to pinpoint your location. Scary, right? Well, this is just one of the many reasons the Global Positioning System (GPS) is vital to us. But how did we come up with such an idea? How do they work? More importantly, how do they work so precisely? After all, I can spot myself in even the narrowest alley. This idea was realized through a connecting-the-dots process, which is why we will first discuss different and quite unrelated “dots” and finally connect them to see how they give us this powerful navigation tool.

**Dots: The Motivation**

**Dot-1:** So we had this technique known as Very-Long-Baseline Interferometry (VLBI), which captures radio images in the sky. The important thing to note is that there isn’t just one telescope, but many. Combining their data to get higher resolutions is what “Interferometry” in the name means. Now, here’s the fun part. Two telescopes separated by some distance won’t receive the data “simultaneously”. But there will always be a slight delay. Say the telescopes captured the image of an object. By comparing the data and using the time difference, the distance between the two telescopes and the angle at which the Earth is inclined relative to that object can be estimated. This means that if we had two telescopes across the globe imaging the same object within a small time interval, we can estimate the distance between them, and hence the size of the Earth. And this is what was done as well! Imaging via VLBI started as early as the 1950s, and various radio sources, including quasars, were being captured. [1]

**Dot-2:** A quasar (quasi-stellar radio source) is an extremely luminous and distant active galactic nucleus powered by a supermassive black hole accreting matter. Quasars emit energy across the electromagnetic spectrum and often outshine their host galaxies [2]. One key point here is that these quasars are so far away that effectively they are stationary, i.e., if there is a quasar at a declination of 0.5◦ below Sirius today, it would be there even after 5 years.

Alright, now say that at one point of time we know the position of a lot of these Quasars. We can use the concept of the Celestial Sphere to establish an instantaneous one-to-one mapping between these astrophysical structures and a particular location on Earth. This is the motivation behind using VLBI for GPS. But knowing where you are relative to the cosmos solves only half the problem; you also need a way to calculate your exact position on the ground. That’s where our third dot comes in.

**Dot-3:** The final dot is Trilateration [3]. Think of it this way: if someone tells you they are 5 km from a coffee shop, you know they’re somewhere on a circle of radius 5 km around it. Add a second landmark, say, 3 km from a park, and now you’re at one of two intersection points. A third landmark pins you to a single point. In 3D, each distance measurement defines a sphere instead of a circle, and three spheres are enough to narrow you down to (at most) two points, one of which is usually underground and can be discarded. But we actually need a fourth satellite because of the bias term, which we’ll get to in a moment.

**The Connection**

So, there are three components involved. The satellites, the Ground Stations, and the Receiver, like your phone. Imagine the satellites orbiting Earth like a spherical shell. The satellites constantly broadcast signals, like lighthouses. The receiver catches these signals and solves the following equation:

$(x - x_s)^2 + (y - y_s)^2 + (z - z_s)^2 = c^2 * (\Delta t - t_b)^2$

where $x, y, z$ are the receiver coordinates, $x_s, y_s, z_s$ are the satellite coordinates (which, by our assumption, we already know), $\Delta t$ is the time delay in the signal, $c$ is the speed of light, and $t_b$ is the ‘bias’. Imagine your wristwatch running slightly slow; every time you check it, your sense of “now” is off by a tiny amount. Something similar happens here. The receiver’s clock is far less precise than the atomic clocks on satellites, and even a microsecond of error translates to ~ 300 meters of positional error. On top of that, gravity is slightly weaker at the satellite’s altitude, which causes its clock to tick marginally faster than one on the ground (yes, General Relativity is very much at play here!). The bias term $t_b$ accounts for all of this accumulated clock mismatch. Since $t_b$ is an extra unknown, we need a fourth equation, hence, four satellites instead of three [4].

But it turns out that our assumption isn’t good enough for such precise calculations. Practically, even the tiniest movements of Earth with respect to the satellites, like precession (which, mind you, is a 26,000-year cycle) or shifting of the tectonic plates or the movements of satellites with respect to the Earth, like the solar radiation pressure, can cause this positioning system to fall apart. It won’t provide the accurate locations it was meant to. So we need a way to fix this, and this is exactly where quasars come into the picture.

Notice that $x_s, y_s,$ and $z_s$ are in the Earth’s own reference frame. To resolve the above issue, we need to shift to an inertial frame. The VLBI helps us construct this frame, called ‘The International Celestial Reference Frame (ICRF)’, which helps us in the following way. Theoretically, the Celestial Sphere, consisting of only the 212 quasars, should only rotate about the Earth’s spin axis at a constant rate. If the axis changes even slightly, or the rate of rotation changes, or some observatories see the quasars at a different angle than they were a few days ago, we know that the Earth moved with respect to the satellites. The data for this motion (which goes by the name of Earth Orientation Parameters, EOP) is calculated using the VLBI, the new satellite coordinates are estimated in the Earth’s frame and sent to the satellites, which broadcast these new coordinates. In case the satellites move, we do the reverse process to again get the precise satellite coordinates, the task of which is handled by the U.S. Space Force.

Also, notice that the quasars themselves must not move, otherwise there is no ICRF. But they make good anchor points, and this is precisely the reason we chose extremely radio-bright objects like these and not just any star. Even though they are invisible to the human eye, they are such strong radio sources that astronomers identify and track them with radio telescopes [5].

The marriage of VLBI and GPS didn’t happen overnight. In the early 1980s, as GPS satellites were being launched, NASA’s Jet Propulsion Laboratory began building a dedicated ground tracking network, deliberately placing the first stations alongside existing VLBI sites. The logic was simple: those sites already had precise location data and the communications infrastructure needed to anchor the GPS reference frame to the celestial one. That chain has grown steadily ever since, and today it spans more than 80 receivers worldwide, making it the largest centrally managed geodetic GPS tracking network on the planet [7].

In short, every time your phone drops a pin on a map, it is quietly relying on a chain that runs all the way back to radio telescopes staring at billion-light-year-distant black holes.

**Summary**

So there you have it, the unlikely chain that makes GPS work. A technique invented to image distant radio sources is used to measure the Earth’s own wobbles. Objects so far away they appear frozen in the sky become the most reliable fixed points we have. A system designed for military navigation ends up guiding you to the nearest coffee shop.

The next time your phone tells you to turn left in 200 meters, take a moment to appreciate that the instruction quietly traces back to a supermassive black hole, billions of light-years away, doing its small part to keep you from getting lost!

**References**

[1] Chris Smith. NASA Scientific Visualization Studio —Using Quasars to Measure the Earth: A Brief History of VLBI — svs.gsfc.nasa.gov. https://svs.gsfc.nasa.gov/10964/.

[2] Quasar- geodesy.science - IAG website — geodesy.science. https://geodesy.science/glossary/quasar/.

[3] Trilateration - Wikipedia — en.wikipedia.org. https://en.wikipedia.org/wiki/{T}rilateration.

[4] GISGeography. How GPS Receivers Work - Tri-lateration vs Triangulation - GIS Geography — gis-geography.com. https://gisgeography.com/trilateration-triangulation-gps/.

[5] NASA Brings Accuracy to World's Global Positioning Systems — NASA Spinoff — spinoff.nasa.gov. https://spinoff.nasa.gov/{S}pinoff2019/ps_1.html.

[6] How Does GPS Work? — NASA Space Place –NASA Science for Kids — spaceplace.nasa.gov. https://spaceplace.nasa.gov/gps/en/.

[7] GPS uses Quasars - Star In A Star — stari-nastar.com. https://starinastar.com/gps-uses-quasars/.

[8] wikipediaCelestialSphere – https://en.wikipedia.org/wiki/Celestial_sphere
