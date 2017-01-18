const canvas = document.getElementById("particles");
const particles = new Particles(1, canvas, false);

function toggle() {
  particles.rendering = !particles.rendering;
}

function init() {
  resize();
  orbittingBodies();
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
  const newParticles = [];
  for (let x = 0; x < 250; x++) {
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
  particles.setParticles(newParticles);
}

function toggleDebug() {
  particles.debug = !particles.debug;
}

window.onresize = resize;
window.onload = init;
