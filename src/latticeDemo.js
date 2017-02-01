const canvas = document.getElementById("particles-canvas");
let particleObject;

window.onload = () => {
    canvas.style.width = `${canvas.offsetWidth}px`;
    canvas.style.height = `${canvas.offsetHeight}px`;
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;

    const config = Particles.configs().lattice;
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

function updateFalling() {
    const falling = document.getElementById("falling").checked;
    particleObject.falling = falling;
}

function updateWalled() {
    const walled = document.getElementById("walled").checked;
    if (walled) {
        document.getElementById("teleport-walls").parentElement.className = "setting";
    } else {
        document.getElementById("teleport-walls").parentElement.className = "setting disabled";
    }
    particleObject.walled = walled;
}

function updateTeleportWalls() {
    const teleportWalls = document.getElementById("teleport-walls").checked;
    particleObject.teleportWalls = teleportWalls;
}

function updateConnected() {
    const connected = document.getElementById("connected").checked;
    particleObject.connected = connected;
    const dependentElements = [
        document.getElementById("lattice-width").parentElement,
        document.getElementById("lattice-distance").parentElement
    ];
    if (!connected) {
        dependentElements.forEach((on) => on.className = "setting disabled");
    } else {
        dependentElements.forEach((on) => on.className = "setting");
    }
}

function outputConfigs() {
    const text = JSON.stringify(particleObject.exportConfigs());
    document.getElementById("config-output").innerHTML = text;
}

function updateDebug() {
    const debug = document.getElementById("debug").checked;
    particleObject.debug = debug;
}

function updateFrameTime() {
    const frameTime = document.getElementById("frame-time").checked;
    particleObject.frameTime = frameTime;
}

function updateInteractive() {
    const interactive = document.getElementById("interactive").checked;
    particleObject.interactive = interactive;
    const dependentElements = [
        document.getElementById("repel").parentElement,
        document.getElementById("click-to-add").parentElement
    ];
    if (!interactive) {
        dependentElements.forEach((on) => on.className = "setting disabled");
    } else {
        dependentElements.forEach((on) => on.className = "setting");
    }
}

function updateRepel() {
    const repel = document.getElementById("repel").checked;
    particleObject.repel = repel;
}

function updateClickToAdd() {
    const clickToAdd = document.getElementById("click-to-add").checked;
    particleObject.clickToAdd = clickToAdd;
}

function updateTerminalVelocity() {
    const terminalVelocity = parseFloat(document.getElementById("terminal-velocity").value);
    particleObject.terminalVelocity = terminalVelocity;
}

function updateNumber() {
    const number = parseInt(document.getElementById("number").value);
    particleObject.random.number = number;
}

function updateMinMass() {
    const minMass = parseInt(document.getElementById("min-mass").value);
    particleObject.random.minMass = minMass;
}

function updateMaxMass() {
    const maxMass = parseInt(document.getElementById("max-mass").value);
    particleObject.random.maxMass = maxMass;
}

function updateMinDx() {
    const minDx = parseFloat(document.getElementById("min-dx").value);
    particleObject.random.minDx = minDx;
}

function updateMaxDx() {
    const maxDx = parseFloat(document.getElementById("max-dx").value);
    particleObject.random.maxDx = maxDx;
}

function updateMinDy() {
    const minDy = parseFloat(document.getElementById("min-dy").value);
    particleObject.random.minDy = minDy;
}

function updateMaxDy() {
    const maxDy = parseFloat(document.getElementById("max-dy").value);
    particleObject.random.maxDy = maxDy;
}

function restart() {
    particleObject.stop();
    particleObject = new Particles(particleObject.exportConfigs(), canvas);
    particleObject.start();
}