/*MIT License

Copyright (c) 2017 Michael Bilstein (https://github.com/Meegul)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.*/

class Particle {
  constructor(x = 0, y = 0, dx = 0, dy = 0, mass = 1, color = "#FFFFFF", density = 1, terminalVelocity = 100000) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.mass = mass;
    this.color = color;
    this.density = density;
    this.terminalVelocity = terminalVelocity;
  }
  //Apply a force to this particle, given a unit vector <x,y> and a force
  applyForce(x, y, force) {
    this.dx += x * force / this.mass;
    this.dy += y * force / this.mass;
    if (this.dx > this.terminalVelocity)
      this.dx = this.terminalVelocity;
    if (this.dy > this.terminalVelocity)
      this.dy = this.terminalVelocity;
    if (this.dx < -this.terminalVelocity)
      this.dx = -this.terminalVelocity;
    if (this.dy < -this.terminalVelocity)
      this.dy = -this.terminalVelocity;
  }
  //Update the location of the particle, based on the current velocity vector
  move() {
    this.x += this.dx;
    this.y += this.dy;
  }
}

class Particles {
  //The constructor. Must receive an object with parameters.
  //A canvas object must be supplied either in the object or as a second parameter.
  constructor(paramsObject, domObject) {
    //Make sure we got a domObject
    if (!paramsObject.domObject)
      paramsObject.domObject = domObject;
    if (!paramsObject.domObject) {
      throw new Error("Missing dom object");
    }
    this.domObject = paramsObject.domObject; //The canvas
    this.debug = paramsObject.debug || false; //Debug mode
    this.frameTime = paramsObject.frameTime || false; //Frame-time overlay
    this.interactive = paramsObject.interactive || false; //Whether to track mouse interactions
    this.repel = paramsObject.repel || false; //Whether to have the mouse repel particles
    if (this.repel && !this.interactive) {
      console.log("You specified to have particles replled by the mouse without interactivity");
    }
    this.clickToAdd = paramsObject.clickToAdd || false;
    if (this.clickToAdd && !this.interactive) {
      console.log("You specified to be able to click to add particles, but without interactivity enabled");
    }
    this.gravity = paramsObject.gravity || false; //Whether particles attract one another
    this.falling = paramsObject.falling || false; //Whether particles should fall downards
    this.walled = paramsObject.walled || false; //Whether there are walls
    this.teleportWalls = paramsObject.teleportWalls || false; //Whether walls teleport particles to the opposite side
    if (this.teleportWalls && !this.walled) {
      console.log("You specified to have teleportWalls but without walls; therefore, particles will never teleport");
    }
    this.terminalVelocity = (paramsObject.terminalVelocity) ? paramsObject.terminalVelocity : 10000;
    this.particleColor = (paramsObject.particleColor) ? paramsObject.particleColor : undefined;
    this.particles = (paramsObject.particles) ? paramsObject.particles : [];
    this.connected = paramsObject.connected || false;
    this.clickPos = undefined;
    this.mousePos = {
      x: 0,
      y: 0,
    };
    this.clicked = false;
    this.timeClicked = undefined;
    //Initialize the canvas dimensions, adjusting for dpi
    this.domObject.width = this.domObject.offsetWidth * window.devicePixelRatio;
    this.domObject.height = this.domObject.offsetHeight * window.devicePixelRatio;

    this.domObject.style.background = (paramsObject.backgroundColor) ? paramsObject.backgroundColor : "rgb(255,255,255)";
    this.domObject.addEventListener("mousedown", this.handleMouseDown.bind(this));
    this.domObject.addEventListener("mousemove", this.handleMouseMove.bind(this));
    this.domObject.addEventListener("mouseup", this.handleMouseUp.bind(this));
    //If the user specified to create some random particles
    if (paramsObject.random)
      this.randomize(paramsObject.random);
  }
  //Handle physics, including gravity interactions
  doPhysics() {
    if (this.gravity) {
      const G = 0.1; //Gravitational Constant
      //Gravity
      for (var indexA = 0; indexA < this.particles.length; indexA++) {
        for (var indexB = indexA + 1; indexB < this.particles.length; indexB++) {
          var particleA = this.particles[indexA];
          var particleB = this.particles[indexB];
          var distance = distanceBetween(particleA, particleB);
          if (distance < 0.5)
            continue;
          var unitABx = (particleB.x - particleA.x) / distance;
          var unitABy = (particleB.y - particleA.y) / distance;
          var force = (G * particleA.mass * particleB.mass) / distance;
          particleA.applyForce(unitABx, unitABy, force);
          particleB.applyForce(unitABx * -1, unitABy * -1, force);
        }
      }
    }
    //Apply falling force
    if (this.falling) {
      let particle;
      for (var index = 0; index < this.particles.length; index++) {
        particle = this.particles[index];
        particle.applyForce(0, 1, particle.mass);
      }
    }
    //Repel, if necessary
    if (this.interactive && this.repel) {
      this.repelParticles();
    }
    //Make the moves
    this.particles.forEach((on) => on.move());
    //Bounce off walls
    if (this.walled) {
      let particle;
      let radius;
      for (var index = 0; index < this.particles.length; index++) {
        particle = this.particles[index];
        //If we should go through the walls to the other side
        if (this.teleportWalls) {
          if (particle.y < 0) {
            particle.y = this.domObject.height;
          }
          if (particle.x < 0) {
            particle.x = this.domObject.width;
          }
          if (particle.y > this.domObject.height) {
            particle.y = 0;
          }
          if (particle.x > this.domObject.width) {
            particle.x = 0;
          }
        } else { //Else just bounce off the walls
          radius = particle.mass * 10 / particle.density;
          if (particle.y - radius < 0) {
            particle.y = radius;
            particle.dy = -particle.dy;
          }
          if (particle.x - radius < 0) {
            particle.x = radius;
            particle.dx = -particle.dx;
          }
          if (particle.x + radius > this.domObject.width) {
            particle.x = this.domObject.width - radius;
            particle.dx = -particle.dx;
          }
          if (particle.y + radius > this.domObject.height) {
            particle.y = this.domObject.height - radius;
            particle.dy = -particle.dy;
          }
        }
      }
    }
  }
  repelParticles() {
    if (this.interactive && this.repel) {
      let particle, distance, force, unitX, unitY;
      for (var index = 0; index < this.particles.length; index++) {
        particle = this.particles[index];
        distance = distanceBetween(particle, this.mousePos);
        if (distance < 250) {
          unitX = (particle.x - this.mousePos.x) / distance;
          unitY = (particle.y - this.mousePos.y) / distance;
          force = 100 / distance;
          particle.applyForce(unitX, unitY, force);
        }
      }
    }
  }
  //The primary render logic
  render() {
    //Clear
    this.domObject.getContext("2d").clearRect(0, 0, this.domObject.width, this.domObject.height);

    const brush = this.domObject.getContext("2d");
    brush.font = `${11 * window.devicePixelRatio}px arial`;
    //Draw lattice, if specified
    if (this.connected) {
      brush.lineWidth = 5;
      let distance, particleA, particleB, alpha
      for (var indexA = 0; indexA < this.particles.length; indexA++) {
        particleA = this.particles[indexA];
        for (var indexB = indexA + 1; indexB < this.particles.length; indexB++) {
          particleB = this.particles[indexB];
          distance = distanceBetween(particleA, particleB);
          if (distance < 250) {
            alpha = -distance/250 + 1;
            brush.strokeStyle = `rgba(255,255,255,${alpha})`;
            brush.beginPath();
            brush.moveTo(particleA.x, particleA.y);
            brush.lineTo(particleB.x, particleB.y);
            brush.stroke();
          }
        }
      }
    }
    //Draw all particles
    for (var x = 0; x < this.particles.length; x++) {
      const on = this.particles[x];
      brush.beginPath();
      brush.fillStyle = on.color;
      brush.arc(on.x, on.y, on.mass*10/on.density, 0, Math.PI*2);
      brush.fill();
      //Draw particle info, if in debug mode
      if (this.debug) {
        const locx = on.x - (5*11*window.devicePixelRatio);
        const locy = on.y - on.mass*10 - 5;
        brush.fillText(`(${Math.trunc(on.x)},${Math.trunc(on.y)}),<${Math.trunc(on.dx * 100) / 100},${Math.trunc(on.dy * 100) / 100}>`, locx, locy);
      }
    }
    //Show the particle being created, and the force applied to it
    if (this.interactive && this.clicked && this.clickToAdd) {
      brush.strokeStyle = "white";
      brush.lineWidth = 5 * window.devicePixelRatio;
      brush.beginPath();
      brush.moveTo(this.clickPos.x, this.clickPos.y);
      brush.lineTo(this.mousePos.x, this.mousePos.y);
      brush.stroke();
      brush.beginPath();
      brush.fillStyle = "white";
      brush.arc(this.clickPos.x, this.clickPos.y, (new Date().getTime() - this.timeClicked) / 50, 0, Math.PI*2);
      brush.fill();
    }
    //Show where cursor is in debug mode
    if (this.debug && this.interactive) {
      brush.beginPath();
      brush.fillStyle = "black";
      brush.arc(this.mousePos.x, this.mousePos.y, 5, 0, Math.PI * 2);
      brush.fill();
    }
  }
  //The primary loop. Does physics, rendering, and calls itself every frame, all only if running
  run() {
    if (this.running) {
      let physicsStart, physicsEnd, renderEnd;
      if (this.frameTime)
        physicsStart = new Date().getTime();
      this.doPhysics();
      if (this.frameTime)
        physicsEnd = new Date().getTime();
      this.render();
      if (this.frameTime) {
        renderEnd = new Date().getTime();
        const brush = this.domObject.getContext("2d");
        brush.font = `${11 * window.devicePixelRatio}px arial`;
        brush.fillStyle = "white";
        brush.fillText(`Physics:${physicsEnd - physicsStart}ms`, 0, 20);
        brush.fillText(`Render:${renderEnd - physicsEnd}ms`, 0, 20 + 11 * window.devicePixelRatio);
        brush.fillText(`Particles:${this.particles.length}`, 0, 20 + 11 * 2 * window.devicePixelRatio);
      }
      requestAnimationFrame(this.run.bind(this));
    }
  }
  //Start
  start() {
    if (!this.running) {
      this.running = true;
      this.run();
    }
  }
  //Replace the particles with the new ones
  setParticles(newArr) {
    this.particles = newArr;
  }
  //Append the new particles
  addParticles(newParticles) {
    this.particles = this.particles.concat(newParticles);
  }
  //Toggle pause
  togglePause() {
    if (this.running) {
      this.running = false;
    } else {
      this.running = true;
      this.run();
    }
  }
  //Toggle interactivity
  toggleInteractivity() {
    this.interactive = !this.interactive;
  }
  //Stop
  stop() {
    this.running = false;
  }
  //Toggle debug mode
  toggleDebug() {
    this.debug = !this.debug;
  }
  //Toggle the frame time overlay
  toggleFrameTime() {
    this.frameTime = !this.frameTime;
  }
  //Keep track of clicks, if interactive
  handleMouseDown(event) {
    if (this.interactive) {
      this.clickPos = getMousePos(this.domObject, event);
      this.clicked = true;
      this.timeClicked = new Date().getTime();
    }
  }
  //Add a particle after a click, if interactive
  handleMouseUp() {
    if (this.interactive) {
      this.clicked = false;
      if (this.clickToAdd) {
        const mass = (new Date().getTime() - this.timeClicked) / 500;
        const dx = (this.mousePos.x - this.clickPos.x) / 500;
        const dy = (this.mousePos.y - this.clickPos.y) / 500;
        const newParticle = new Particle(this.clickPos.x, this.clickPos.y, dx, dy, mass, this.particleColor, 1, this.terminalVelocity);
        this.particles.push(newParticle);
      }
    }
  }
  //Keep track of the mouse location on the canvas
  handleMouseMove(event) {
    if (this.interactive) {
      this.mousePos = getMousePos(this.domObject, event);
    }
  }
  //Get rid of all particles
  clear() {
    this.particles = [];
  }
  //Add some new particles, given some options
  randomize(options) {
    if (!options) {
      this.randomize({});
      return;
    }
    const number = (options.number) ? options.number : 10;
    const minMass = (options.minMass) ? options.minMass : 1;
    const maxMass = (options.maxMass) ? options.maxMass : 5;
    const newParticles = [];
    for (let x = 0; x < number; x++) {
      const randx = Math.random() * this.domObject.width;
      const randy = Math.random() * this.domObject.height;
      const randdx = Math.random() * 2 - 1;
      const randdy = Math.random() * 2 - 1;
      const randMass = Math.random() * (maxMass - minMass) + minMass;
      let color;
      if (!this.particleColor) {
        const r = parseInt(Math.random() * 255);
        const g = parseInt(Math.random() * 255);
        const b = parseInt(Math.random() * 255);
        color = `rgb(${r},${g},${b})`;
      } else {
        color = this.particleColor;
      }
      newParticles[x] = new Particle(randx, randy, randdx, randdy, randMass, color, 1, this.terminalVelocity);
    }
    this.addParticles(newParticles);
  }
  //Some default configs that can be used
  static configs() {
    return {
      snow: {
        walled: true,
        particleColor: "rgba(255,255,255,0.8)",
        backgroundColor: "rgba(0,0,0,0)",
        terminalVelocity: 5,
        random: {
          number: 100,
          maxMass: 2,
        },
        falling: true,
        teleportWalls: true,
      },
      solarSystem: {
        walled: false,
        gravity: true,
        falling: false,
        teleportWalls: false,
        backgroundColor: "rgba(0,0,0,1)",
        terminalVelocity: 10000,
        particles: [
          new Particle(1250, 700, 0, 0, 1, "#FFFF00", 0.25),
          new Particle(1250, 600, 0.319, 0, 0.0553/332946, "#666666", 1/332946/10),
          new Particle(1250, 550, 0.318, 0, 0.815/332946, "#FF6666", 1/332946),
          new Particle(1250, 500, 0.317, 0, 1/332946, "#00FF00", 1/332946),
          new Particle(1250, 425, 0.316, 0, 0.107/332946, "#FF0000", 1/332946/5),
          new Particle(1250, 300, 0.313, 0, 317.8/332946, "#997711", 1/332946*200),
          new Particle(1250, 100, 0.3125, 0, 95.2/332946, "#AA7711", 1/332946*75)
        ],
      },
      blackHole: {
        walled: false,
        gravity: true,
        falling: false,
        teleportWalls: false,
        interactive: true,
        clickToAdd: true,
        backgroundColor: "rgb(0,0,0)",
        terminalVelocity: 10000,
        particles: [
          new Particle(500, 0, 3, 0),
          new Particle(500, 500, 0, 0, 500, "#333", 500),
        ],
      },
      lattice: {
        walled: true,
        gravity: false,
        falling: false,
        teleportWalls: true,
        interactive: true,
        repel: true,
        clickToAdd: false,
        backgroundColor: "rgba(0,0,0,0)",
        particleColor: "rgb(255,255,255)",
        connected: true,
        terminalVelocity: 3,
        random: {
          number: 50,
          minMass: 1,
          maxMass: 1,
        },
      },
    };
  }
}
//Calculate the positon of the mouse, given a canvas and mouse event
function getMousePos(domObject, event) {
  const rect = domObject.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * window.devicePixelRatio,
    y: (event.clientY - rect.top) * window.devicePixelRatio,
  };
}
//Basic distance formula. Math.pow/** is not used due to performance issues
function distanceBetween(a, b) {
  return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
}
