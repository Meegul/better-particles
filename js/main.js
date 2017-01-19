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
    random: {
      number: parseInt(document.getElementById("num-random").value),
    },
    terminalVelocity: 10000,
    backgroundColor: "rgba(0,0,0,1)",
  };
  particles = new Particles(particlesConfig);
  particles.start();
}

function resize() {
  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;
}

function blackHole() {
  particles.stop();
  particles = new Particles(Particles.configs().blackHole, canvas);
  particles.start();
}

function solarSystem() {
  particles.stop();
  particles = new Particles(Particles.configs().solarSystem, canvas);
  particles.start();
}

function lattice() {
  particles.stop();
  particles = new Particles(Particles.configs().lattice, canvas);
  particles.start();
}

function randomize() {
  const numRandomValue = document.getElementById("num-random").value;
  const number = parseInt(numRandomValue) ? parseInt(numRandomValue) : 250;
  particles.randomize({
    number: number,
  });
}

window.onresize = resize;
window.onload = init;
