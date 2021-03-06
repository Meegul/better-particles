# better-particles
A simple, better particles library for web use. It includes simulated gravity between particles, some basic user-interaction, a lattice-looking default, amongst other things.

## Why better-particles?
better-particles performs really, really well. In testing on a 2015 MacBook Pro, better-particles could simulate 1000 particles *with gravitational forces between each one* at 60fps. Additionally, the non-minified file is only 14.2kB, ensuring quick load times. 

## Basic setup
1. Include `better-particles.js` or the minified version ran through babel, `better-particles.min.js`, both from the `out` folder in this repository:

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

You can start with one of the default configs and change some of it's settings, as well. For example, if we wanted to make the snow config interactive and have the mouse repel particles, we could just do the following:
```javascript
const mySnow = Particles.configs().snow;
mySnow.interactive = true;
mySnow.repel = true;
const myParticleObject = new Particles(mySnow, canvas);
```

Take a look at some of the different parameters below to see what kind of changes you can make.

## Advanced setup
If you'd like to pass your own parameters, you can pass any/all of the following in an object:
* `gravity` - `true` or `false` - Whether particles should be attracted to one another, based on their mass and distance.
* `falling` - `true` or `false` - Makes particles act as if they're on earth; they fall to the ground.
* `walled` - `true` or `false` - Whether particles should be bound by the canvas, bouncing off the walls.
* `teleportWalls` - `true` or `false` - Whether particles should just teleport to the other side of the canvas when they collide with a wall and `walled` is set to `true`.
* `connected` - `true` or `false` - Whether lines should be drawn between particles near one-another.
* `latticeDistance` - Any number > 0 - The maximum distance for a line to be drawn between particles.
* `latticeWidth` - Any number > 0 - The width of lines drawn between particles.
* `terminalVelocity` - Any number > 0 - The fastest speed particles can travel.
* `particleColor` - A valid CSS color string (`rgb(255,255,255)`, `#FFF`, etc) - The color of any new particles.
* `domObject` - A canvas DOM object- The canvas on which the particle simulation should take place. This can either be passed in your parameters object here, or as another parameter to the constructor.
* `random` - An object containing any/all of the parameters below - Used to create some random particles on construction.
  * `number` - Any number > 0 - The number of particles to be created.
  * `minMass` - Any number > 0 - The minimum mass of a created particle.
  * `maxMass` - Any number > 0 - The maximum mass of a created particle.
  * `minDx` - Any number - The minimum velocity in the x direction of a created particle.
  * `maxDx` - Any number - The maximum velocity in the x direction a created particle.
  * `minDy` - Any number - The minimum velocity in the y direction created particle.
  * `maxDx` - Any number - The maximum velocity in the y direction a created particle.
  * `color` - Any valid CSS color string - The color of new particles generated. Defaults to `object.particleColor`, or a random color if that is not provided either.
* `particles` - An array containing any amount of `Particle` objects - The particles which will be added on construction, whether or not random particles are also being generated.
* `debug` - `true` or `false` - Shows extra information about particle location and mouse location.
* `frameTime` - `true` or `false` - Adds an overlay to the top left that shows the time it takes to complete the physics and rendering operations for each frame.
* `interactive` - `true` or `false` - Enables the ability for the user to click, hold, and drag in order to create new particles.
* `repel` - `true` or `false` - Makes the mouse repel particles away from it, if interactivity is enabled.
* `clickToAdd` - `true` or `false` - Allows the user to create new particles by clicking and dragging, if interactivity is enabled.
