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
  constructor(number = 10, domObject, debug = false, frameTime = false) {
    if (!domObject)
      return;
    this.particles = new Array(number).fill(0).map(() => new Particle(250, 250));
    this.domObject = domObject;
    this.running = false;
    this.debug = debug;
    this.frameTime = frameTime;
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
