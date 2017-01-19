class Particle {
  constructor(x = 0, y = 0, dx = 0, dy = 0, mass = 1, color = "#FFFFFF", density = 1, terminalVelocity = 10) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.mass = mass;
    this.color = color;
    this.density = density;
    this.terminalVelocity = terminalVelocity;
  }
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
  move() {
    this.x += this.dx;
    this.y += this.dy;
  }
}

class Particles {
  constructor(paramsObject) {
    if (!paramsObject.domObject) {
      console.log("Missing domObject");
      return;
    }
    this.domObject = paramsObject.domObject;
    this.debug = paramsObject.debug || false;
    this.frameTime = paramsObject.frameTime || false;
    this.interactive = paramsObject.interactive || false;
    this.gravity = paramsObject.gravity || false;
    this.walled = paramsObject.walled || false;
    this.falling = paramsObject.falling || false;
    this.teleportWalls = paramsObject.teleportWalls || false;
    this.numParticles = (paramsObject.number) ? paramsObject.number : 10;
    this.terminalVelocity = (paramsObject.terminalVelocity) ? paramsObject.terminalVelocity : 10;
    this.clickPos = undefined;
    this.mousePos = {
      x: 0,
      y: 0,
    };
    this.clicked = false;
    this.timeClicked = undefined;
    this.domObject.width = this.domObject.offsetWidth * window.devicePixelRatio;
    this.domObject.height = this.domObject.offsetHeight * window.devicePixelRatio;
    this.domObject.style.background = (paramsObject.backgroundRGBA) ? paramsObject.backgroundRGBA : "rgba(255,255,255,1)";
    this.domObject.addEventListener("mousedown", this.handleMouseDown.bind(this));
    this.domObject.addEventListener("mousemove", this.handleMouseMove.bind(this));
    this.domObject.addEventListener("mouseup", this.handleMouseUp.bind(this));
    this.randomize(this.numParticles);
  }
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
  render() {
    //Clear
    this.domObject.getContext("2d").clearRect(0, 0, this.domObject.width, this.domObject.height);
    //Draw
    const brush = this.domObject.getContext("2d");
    brush.font = `${11 * window.devicePixelRatio}px arial`;
    for (var x = 0; x < this.particles.length; x++) {
      const on = this.particles[x];
      brush.beginPath();
      brush.fillStyle = on.color;
      brush.arc(on.x, on.y, on.mass*10/on.density, 0, Math.PI*2);
      brush.fill();
      if (this.debug) {
        const locx = on.x - (5*11*window.devicePixelRatio);
        const locy = on.y - on.mass*10 - 5;
        brush.fillText(`(${Math.trunc(on.x)},${Math.trunc(on.y)}),<${Math.trunc(on.dx * 100) / 100},${Math.trunc(on.dy * 100) / 100}>`, locx, locy);
      }
    }
    if (this.interactive && this.clicked) {
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
      }
      requestAnimationFrame(this.run.bind(this));
    }
  }
  start() {
    this.running = true;
    this.run();
  }
  setParticles(newArr) {
    this.particles = newArr;
  }
  togglePause() {
    if (this.running) {
      this.running = false;
    } else {
      this.running = true;
      this.run();
    }
  }
  toggleDebug() {
    this.debug = !this.debug;
  }
  toggleFrameTime() {
    this.frameTime = !this.frameTime;
  }
  handleMouseDown(event) {
    if (this.interactive) {
      this.clickPos = getMousePos(this.domObject, event);
      this.clicked = true;
      this.timeClicked = new Date().getTime();
      console.log(`Mouse down at:(${this.clickPos.x},${this.clickPos.y})`);
    }
  }
  handleMouseUp() {
    if (this.interactive) {
      this.clicked = false;
      console.log(`Mouse up at:(${this.mousePos.x},${this.mousePos.y})`);
      const mass = (new Date().getTime() - this.timeClicked) / 500;
      const dx = (this.mousePos.x - this.clickPos.x) / 500;
      const dy = (this.mousePos.y - this.clickPos.y) / 500;
      const newParticle = new Particle(this.clickPos.x, this.clickPos.y, dx, dy, mass);
      this.particles.push(newParticle);
    }
  }
  handleMouseMove(event) {
    if (this.interactive) {
      this.mousePos = getMousePos(this.domObject, event);
    }
  }
  clear() {
    this.particles = [];
  }
  randomize(number = 10) {
    const newParticles = [];
    for (let x = 0; x < number; x++) {
      const randx = Math.random() * this.domObject.width;
      const randy = Math.random() * this.domObject.height;
      const randdx = Math.random() * 2 - 1;
      const randdy = Math.random() * 2 - 1;
      const randMass = Math.random() * 5;
      const r = parseInt((Math.random() * 16 * 16)).toString(16);
      const g = parseInt((Math.random() * 16 * 16)).toString(16);
      const b = parseInt((Math.random() * 16 * 16)).toString(16);
      const rgb = `#${r}${g}${b}`;
      newParticles[x] = new Particle(randx, randy, randdx, randdy, randMass, rgb, 1, this.terminalVelocity);
    }
    this.setParticles(newParticles);
  }
}

function getMousePos(domObject, event) {
  const rect = domObject.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * window.devicePixelRatio,
    y: (event.clientY - rect.top) * window.devicePixelRatio,
  };
}

function distanceBetween(a, b) {
  return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
}
