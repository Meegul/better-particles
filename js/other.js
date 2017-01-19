let particleObject;
function init() {
    const particlesConfig = {
        number: 25,
        gravity: false,
        debug: true,
        walled: true,
        falling: true,
        teleportWalls: true,
        terminalVelocity: 10,
        domObject: document.getElementById("particles"),
        interactive: true,
        backgroundRGBA: "rgba(0,255,255,1)",
    };
    particleObject = new Particles(particlesConfig);
    particleObject.start();
}

window.onload = init;