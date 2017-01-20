# better-particles
A simple, better particles library for web use. It includes simulated gravity between particles, some basic user-interaction, a lattice-looking default, amongst other things.

## Why better-particles?
better-particles performs really, really well. In testing on a 2015 MacBook Pro, better-particles could simulate 1000 particles *with gravitational forces between each one* at 60fps. Additionally, the non-minified file is only 14.2kB, ensuring quick load times. 

## Basic setup
1. Include `better-particles.js`:

  ```html
  <script src="js/better-particles.js"></script>
  ```
2. Create a canvas to use:

  ```html
  <canvas id="my-canvas">
  ```
3. Initialize your object with some parameters, or one of the defaults:
  
  ```javascript
  const canvas = document.getElementById("my-canvas");
  const myParticleObject = new Particles(Particles.configs().snow, canvas);
  ```
4. Start!
  
  ```javascript
  myParticleObject.start();
  ```

better-particles will then start working with your supplied configuration, after it automatically adjusts the canvas's width and height to be the same as found in the DOM. Additionally, the device's DPI is taken into account to ensure the particles are nice and smooth.

##Default configs
All default configs can be accessed by doing `Particles.configs().name`, where `name` is the config you'd like.

The following configs are currently available:
* `snow` - A simple snow overlay, in which white particles slowly travel downwards.
* `lattice` - Particles slowly move around, with a lattice-like overlay being between particles near one-another.
* `solarSystem` - A mock solar system in which planets orbit a sun.
* `blackHole` - A more extreme gravitational example; a planet orbits a very dense particle.

## Advanced setup
If you'd like to pass your own parameters, you can pass any/all of the following in an object:
* `gravity` - `true` or `false` - Whether particles should be attracted to one another, based on their mass and distance.
* `falling` - `true` or `false` - Makes particles act as if they're on earth; they fall to the ground.
* `walled` - `true` or `false` - Whether particles should be bound by the canvas, bouncing off the walls.
* `teleportWalls` - `true` or `false` - Whether particles should just teleport to the other side of the canvas when they collide with a wall and `walled` is set to `true`.
* `connected` - `true` or `false` - Whether lines should be drawn between particles near one-another.
* `terminalVelocity` - Any number > 0 - The fastest speed particles can travel.
* `particleColor` - A valid CSS color string (`rgb(255,255,255)`, `#FFF`, etc) - The color of any new particles.
* `domObject` - A canvas DOM object- The canvas on which the particle simulation should take place. This can either be passed in your parameters object here, or as another parameter to the constructor.
* `random` - An object containing any/all of the parameters below - Used to create some random particles on construction.
  * `number` - Any number > 0 - The number of particles to be created.
  * `minMass` - Any number > 0 - The minimum mass of a created particle.
  * `maxMass` - Any number > 0 - The maximum mass of a created particle.
* `particles` - An array containing any amount of `Particle` objects - The particles which will be added on construction, whether or not random particles are also being generated.
* `debug` - `true` or `false` - Shows extra information about particle location and mouse location.
* `frameTime` - `true` or `false` - Adds an overlay to the top left that shows the time it takes to complete the physics and rendering operations for each frame.
* `interactive` - `true` or `false` - Enables the ability for the user to click, hold, and drag in order to create new particles.
