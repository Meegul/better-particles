const canvas = document.getElementById("particles");
let particles;

function toggle() {
  particles.rendering = !particles.rendering;
}

function init() {
  const particlesConfig = {
    domObject: canvas,
    gravity: true,
    walls: false,
    falling: false,
    teleportWalls: false,
    number: 250,
    terminalVelocity: 10000,
    backgroundRGBA: "rgba(0,0,0,1)",
  };
  particles = new Particles(particlesConfig);
  particles.start();
}

function resize() {
  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;
}

function orbittingBodies() {
  const particle1 = new Particle(canvas.width / 2, canvas.height / 2, 0, 0, 5);
  const particle2 = new Particle(canvas.width / 2, canvas.height - 25, 1, 0, 1);
  const particle3 = new Particle(canvas.width / 2, 25, -1, 0, 1);
  particles.setParticles([particle1, particle2, particle3]);
}

function oppositeCorners() {
  const particle1 = new Particle(25, 25);
  const particle2 = new Particle(canvas.width - 25, canvas.height - 25);
  particles.setParticles([particle1, particle2]);
}

function blackHole() {
  const blackHole = new Particle(canvas.width / 2, canvas.height / 2, 0, 0, 500, "#333", 500);
  const particle1 = new Particle(canvas.width / 2, 0, 3, 0);
  particles.setParticles([blackHole, particle1]);
}

function solarSystem() {
  const sun = new Particle(1250, 700, 0, 0, 1, "#FFFF00", 0.25);
  const mercury = new Particle(1250, 600, 0.319, 0, 0.0553/332946, "#666666", 1/332946/10);
  const venus = new Particle(1250, 550, 0.318, 0, 0.815/332946, "#FF6666", 1/332946);
  const earth = new Particle(1250, 500, 0.317, 0, 1/332946, "#00FF00", 1/332946);
  const mars = new Particle(1250, 425, 0.316, 0, 0.107/332946, "#FF0000", 1/332946/5);
  const jupiter = new Particle(1250, 300, 0.313, 0, 317.8/332946, "#997711", 1/332946*200);
  const saturn = new Particle(1250, 100, 0.3125, 0, 95.2/332946, "#AA7711", 1/332946*75);
  particles.setParticles([sun, mercury, venus, earth, mars, jupiter, saturn]);
}

function randomize() {
  const numRandomValue = document.getElementById("num-random").value;
  const number = parseInt(numRandomValue) ? parseInt(numRandomValue) : 250;
  particles.randomize(number);
}

function toggleDebug() {
  particles.debug = !particles.debug;
}

window.onresize = resize;
window.onload = init;
