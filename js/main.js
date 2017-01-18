const canvas = document.getElementById("particles");
let particles;

function toggle() {
  particles.rendering = !particles.rendering;
}

function init() {
  resize();
  particles = new Particles(100, canvas, false);
  particles.togglePause();
  particles.run();
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
