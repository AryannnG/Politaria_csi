# City world performance notes

The city uses React Three Fiber / Three.js. Repeated neighborhood buildings, windows, trees, lane markings, pedestrians and animals use instanced meshes; generated plaster/asphalt textures are shared; the world route lazy-loads the renderer and offers Low / Medium / High pixel-ratio and shadow settings.

The working targets remain 60 FPS on a mid-range desktop at 1080p and 30 FPS on a recent phone. Those rates have not been measured in this run because a representative browser session on desktop and phone hardware was not available. Before release, profile the default city and a crisis-heavy city at 1280×720, 1920×1080 and 390×844, then record average and 1% low frame rates here. Use Low quality on mobile during that check.
