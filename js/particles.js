class Particle {
  constructor(x = 0, y = 0, dx = 0, dy = 0, mass = 1, color = "#FFFFFF") {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.mass = mass;
    this.color = color;
  }
  applyForce(unitVector, force) {
    this.dx += unitVector.x * force / this.mass;
    this.dy += unitVector.y * force / this.mass;
  }
  move() {
    this.x += this.dx;
    this.y += this.dy;
  }
}

class Particles {
  constructor(number = 10, domObject, debug = false, frameTime = false, interactive = true) {
    if (!domObject)
      return;
    this.particles = new Array(number).fill(0).map(() => new Particle(250, 250));
    this.domObject = domObject;
    this.running = false;
    this.debug = debug;
    this.frameTime = frameTime;
    this.interactive = interactive;
    this.clickPos = undefined;
    this.mousePos = undefined;
    this.clicked = false;
    this.timeClicked = undefined;
    this.domObject.addEventListener("mousedown", this.handleMouseDown.bind(this));
    this.domObject.addEventListener("mousemove", this.handleMouseMove.bind(this));
    this.domObject.addEventListener("mouseup", this.handleMouseUp.bind(this));
    this.randomize(number);
  }
  doPhysics() {
    const G = 0.1; //Gravitational Constant
    //Gravity
    for (let indexA = 0; indexA < this.particles.length; indexA++) {
      for (let indexB = indexA + 1; indexB < this.particles.length; indexB++) {
        const particleA = this.particles[indexA];
        const particleB = this.particles[indexB];
        const unitAB = getUnitVector({
          x: particleB.x - particleA.x,
          y: particleB.y - particleA.y,
        });
        const unitBA = getUnitVector({
          x: particleA.x - particleB.x,
          y: particleA.y - particleB.y,
        });

        const distance = distanceBetween(particleA, particleB);
        const force = (G * particleA.mass * particleB.mass) / distance;
        if (distance > 0.5) {
          particleA.applyForce(unitAB, force);
          particleB.applyForce(unitBA, force);
        }
      }
    }
    //Make the moves
    this.particles.forEach((on) => on.move());
  }
  render() {
    //Clear
    this.domObject.getContext("2d").clearRect(0, 0, this.domObject.width, this.domObject.height);
    //Draw
    const brush = this.domObject.getContext("2d");
    brush.font = `${11 * window.devicePixelRatio}px arial`;
    brush.fillStyle = "red";
    this.particles.forEach((on) => {
      brush.beginPath();
      brush.arc(on.x, on.y, on.mass*10, 0, Math.PI*2);
      brush.fillStyle = on.color;
      brush.fill();
      if (this.debug) {
        const locx = on.x - (5*11*window.devicePixelRatio);
        const locy = on.y - on.mass*10 - 5;
        brush.fillText(`(${Math.trunc(on.x)},${Math.trunc(on.y)}),<${Math.trunc(on.dx * 100) / 100},${Math.trunc(on.dy * 100) / 100}>`, locx, locy);
      }
    });
    if (this.interactive && this.clicked) {
      console.log("Drawing Line!");
      brush.strokeStyle = "white";
      brush.lineWidth = 5 * window.devicePixelRatio;
      brush.stroke
      brush.beginPath();
      brush.moveTo(this.clickPos.x, this.clickPos.y);
      brush.lineTo(this.mousePos.x, this.mousePos.y);
      brush.stroke();
      brush.beginPath();
      brush.fillStyle = "white";
      brush.arc(this.clickPos.x, this.clickPos.y, (new Date().getTime() - this.timeClicked) / 50, 0, Math.PI*2);
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
        const brush = canvas.getContext("2d");
        brush.font = `${11 * window.devicePixelRatio}px arial`;
        brush.fillStyle = "white";
        canvas.getContext("2d").fillText(`Physics:${physicsEnd - physicsStart}ms`, 0, 20);
        canvas.getContext("2d").fillText(`Render:${renderEnd - physicsEnd}ms`, 0, 20 + 11 * window.devicePixelRatio);
      }
      requestAnimationFrame(this.run.bind(this));
    }
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
      const randx = Math.random() * canvas.width;
      const randy = Math.random() * canvas.height;
      const randdx = Math.random() * 2 - 1;
      const randdy = Math.random() * 2 - 1;
      const randMass = Math.random() * 5;
      const r = parseInt((Math.random() * 16 * 16)).toString(16);
      const g = parseInt((Math.random() * 16 * 16)).toString(16);
      const b = parseInt((Math.random() * 16 * 16)).toString(16);
      const rgb = `#${r}${g}${b}`;
      newParticles[x] = new Particle(randx, randy, randdx, randdy, randMass, rgb);
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
  return Math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2);
}

function getUnitVector(vector) {
  const magnitude = Math.sqrt(vector.x ** 2 + vector.y ** 2);
  return {
    x: vector.x / magnitude,
    y: vector.y / magnitude,
  };
}
