let particleObject;
function init() {
    particleObject = new Particles(Particles.configs().snow, document.getElementById("particles"));
    particleObject.start();
}

window.onload = init;