const canvas = document.getElementById("particles-canvas");
let particleObject;

window.onload = () => {
    canvas.style.width = `${canvas.offsetWidth}px`;
    canvas.style.height = `${canvas.offsetHeight}px`;
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;

    const config = Particles.configs().lattice;
    config.frameTime = true;
    particleObject = new Particles(config, canvas);
    particleObject.start();
};

function updateLatticeWidth() {
    const newWidth = parseFloat(document.getElementById("lattice-width").value);
    particleObject.latticeWidth = newWidth;
}

function updateLatticeDistance() {
    const newDistance = parseFloat(document.getElementById("lattice-distance").value);
    particleObject.latticeDistance = newDistance;
}

function updateGravity() {
    const gravity = document.getElementById("gravity").checked;
    particleObject.gravity = gravity;
}