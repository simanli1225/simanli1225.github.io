// ------------------------
let screenWidth = window.screen.availWidth;
let screenHeight = window.screen.availHeight;
// make a variable for filling background
let canvasFillColor = "rgb(0,0,0)";

window.modeTracker = "";
const videoOutput = document.getElementsByClassName("output_canvas")[0];
videoOutput.width = screenWidth;
videoOutput.height = screenWidth / 1.3;

// function changeSize() {
//     let { clientWidth, clientHeight } = document.body;
//     // videoOutput.style.transform = `scale(${ clientWidth / clientHeight })`
//     videoOutput.style.transform = ``
//     // videoOutput.style.left = -((screenWidth - clientWidth) + 100) + 'px'
//     // console.log(window.screen.availWidth, clientWidth, '可用')
//     // console.log(clientWidth, clientHeight);
// }

// changeSize();
// window.onresize = (ev) => {
//     changeSize();
// };
const bosearStats = document.getElementById("bosearstats");
const touchStats = document.getElementById("touchstats");

/**
 * Default contrlols configuration
 * @type {Object}
 */
const controls = {
  yawMultiplier: 2,
  pitchMultiplier: 1,
  rollMultiplier: 1,
  FOV: 35,
  filterSpeed: 0.9,
  oneEuroFilterBeta: 0.06,

  nPoint: 468,
};
window.controls = controls;

// const audioFiles8 = [
//   'audio/m1spatial/T1.ogg',
//   'audio/m1spatial/T2.ogg',
//   'audio/m1spatial/T3.ogg',
//   'audio/m1spatial/T4.ogg',
//   'audio/m1spatial/B5.ogg',
//   'audio/m1spatial/B6.ogg',
//   'audio/m1spatial/B7.ogg',
//   'audio/m1spatial/B8.ogg',
// ];

const audioFiles8 = ["T1", "T2", "T3", "T4", "B5", "B6", "B7", "B8"];
const getAudioFiles = (files) => {
  const path = "audio/m1spatial";

  // NOTE: The new iPad now mimic to Mac OMG
  const isModernIPad =
    /MacIntel/.test(navigator.platform) && "ontouchend" in document;
  const extention =
    /iPhone|iPad|iPod/i.test(navigator.userAgent) || isModernIPad
      ? "mp3"
      : "ogg";

  return files.map((file) => `${path}/${file}.${extention}`);
};

const Player = new Mach1SoundPlayer(getAudioFiles(audioFiles8));
const DecodeModule = new Mach1DecodeModule();
const osc = new OSC();

tf.setBackend("webgl");

function radiansToDegrees(radians) {
  return radians * (180 / Math.PI);
}

const boseARDeviceElement = document.querySelector("bose-ar-device");
const boseAROrder = "YXZ";
const boseARConfig = {
  order: boseAROrder,
  euler: new THREE.Euler(undefined, undefined, undefined, boseAROrder),
  eulerOffset: new THREE.Euler(undefined, undefined, undefined, boseAROrder),
  recallibrate: true,
  callibrate() {
    this.eulerOffset.copy(this.euler);
    this.recallibrate = false;
  },
  eulerScalar: { x: 1, y: 1, z: 1 },
};
console.log("here is player" + Player);
console.log(Player);
console.log(Player.isPlaying);

//make the event listener when music ended
// Player.addEventListener("ended", function()
// {
//      alert("ended");
// });

boseARDeviceElement.setAttribute("double-tap", "");
boseARDeviceElement.addEventListener("doubleTap", () => {
  boseARConfig.recallibrate = true;
});

boseARDeviceElement.addEventListener("rotation", (event) => {
  boseARConfig.euler.x =
    Number(event.target.getAttribute("rotationpitch")) + Math.PI / 2;
  boseARConfig.euler.y = Number(event.target.getAttribute("rotationyaw"));
  boseARConfig.euler.z = Number(event.target.getAttribute("rotationroll"));

  if (boseARConfig.recallibrate) boseARConfig.callibrate();

  boseARConfig.euler.x =
    (boseARConfig.euler.x - boseARConfig.eulerOffset.x) *
    boseARConfig.eulerScalar.x;
  boseARConfig.euler.y =
    (boseARConfig.euler.y - boseARConfig.eulerOffset.y) *
    boseARConfig.eulerScalar.y;
  boseARConfig.euler.z =
    (boseARConfig.euler.z - boseARConfig.eulerOffset.z) *
    boseARConfig.eulerScalar.z;

  const pitch = radiansToDegrees(boseARConfig.euler.x);
  const yaw = radiansToDegrees(boseARConfig.euler.y);
  const roll = radiansToDegrees(boseARConfig.euler.z);

  document.getElementById("rotationPitch").value = pitch;
  document.getElementById("rotationYaw").value = yaw;
  document.getElementById("rotationRoll").value = roll;

  if (window.modeTracker === "bosear") {
    // TODO: reimplement multipliers and reset all to 1 when `bosear` mode selected
    window.yaw = yaw;
    window.pitch = pitch;
    window.roll = roll;
  }
});

const getModeElement = (name) => {
  const element = document.getElementsByName("mode");
  for (let i = 0; i < element.length; i += 1) {
    if (element[i].value === name) {
      return element[i];
    }
  }
  return null;
};

const gimbal = new Gimbal();

function selectTracker() {
  // NOTE: Clear all warning messages
  document.getElementById("warning").innerHTML = "";

  const ele = document.getElementsByName("mode");
  for (let i = 0; i < ele.length; i += 1) {
    if (ele[i].checked) {
      window.modeTracker = ele[i].value;
    }
  }

  if (window.modeTracker === "device") {
    const handleDeviceOrientation = () => {
      gimbal.update();
      if (window.modeTracker === "device") {
        window.yaw = (gimbal.yaw * 180) / Math.PI;
        window.pitch = (gimbal.pitch * 180) / Math.PI;
        window.roll = (gimbal.roll * 180) / Math.PI;
      }
    };
    try {
      if (typeof DeviceMotionEvent.requestPermission === "function") {
        DeviceMotionEvent.requestPermission().then((response) => {
          if (response === "granted") {
            window.addEventListener(
              "deviceorientation",
              handleDeviceOrientation,
              true
            );
          }
        });
        window.addEventListener(
          "deviceorientation",
          handleDeviceOrientation,
          true
        );
      } else {
        window.addEventListener(
          "deviceorientation",
          handleDeviceOrientation,
          true
        );
      }
    } catch (e) {
      getModeElement("device").disabled = true;
      getModeElement("touch").checked = true;

      const warningMessage = "WARNING: UNABLE TO TRACK DEVICE ORIENTATION!";
      document.getElementById("warning").innerHTML =
        window.modeTracker === "device" ? warningMessage : "";
    }
    gimbal.enable();
  }
}

function enableBoseAR() {
  const ele = document.getElementById("boseRate");
  boseARDeviceElement.setAttribute(
    "rotation",
    ele.options[ele.selectedIndex].value
  );
}

document.addEventListener("DOMContentLoaded", () => {
  selectTracker();
  enableBoseAR();
});

function setupDatGui() {
  const gui = new dat.GUI();
  // gui.add(controls, "nPoint", 300, 468); //468);
  gui.add(controls, "yawMultiplier", 0.0, 5.0);
  gui.add(controls, "pitchMultiplier", 0.0, 5.0);
  gui.add(controls, "rollMultiplier", 0.0, 5.0);
  gui.add(controls, "FOV", 30.0, 90.0);
  gui.add(controls, "filterSpeed", 0.1, 1.0);

  gui.add(controls, "oneEuroFilterBeta", 0.05, 0.1).onChange(() => {
    window.createOneEuroFilters();
  });
  gui.close();
}

// TODO: Apply isMobile returned bools to Device modes
function isMobile() {
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  return isAndroid || isiOS;
}

let model;
let ctx;
let videoWidth;
let videoHeight;
let video;
let canvas;

const mobile = isMobile();

async function setupCamera() {
  video = document.getElementById("video");

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "user",
        width: mobile ? undefined : 640,
        height: mobile ? undefined : 480,
      },
    });
    video.srcObject = stream;
  } catch (e) {
    const element = document.getElementById("warning");
    let warningMessage = "ERROR: UNABLE TO TRACK FACE";
    if (e.message.includes("denied")) {
      warningMessage = `${warningMessage} WEBCAM PERMISSION DENIED!`;
    } else if (
      e.message === "Requested device not found" ||
      e.message === "The object can not be found here."
    ) {
      warningMessage = `${warningMessage} YOUR DEVICE DOESN'T HAVE CAMERA SUPPORT!`;
    } else {
      warningMessage = `${warningMessage} ${e.message}`;
    }

    // NOTE: This is just a simple checker for the tracker mode and it should move to another space
    setInterval(() => {
      if (window.modeTracker === "facetracker") {
        element.innerHTML = warningMessage;
      }
    }, 1000);

    return false;
  }

  video.onloadedmetadata = () => {
    Promise.resolve(video);
  };

  return true;
}

videoWidth = window.innerWidth;
videoHeight = window.innerHeight;

// let videoWidth2 = window.innerWidth;
// let videoHeight2 = window.innerHeight;

async function renderPrediction() {
  const predictions = await model.estimateFaces(video);
  const warningMessage = "WARNING: UNABLE TO TRACK FACE!";
  ctx.fillStyle = "rgb(0,0,0)";
  //   ctx.fillStyle = canvasFillColor;
  //   ctx.fillRect(0, 0, videoWidth, videoHeight);

  // create the gradient background
  // Create gradient
//   var grd = ctx.createLinearGradient(0,0,200,0);
//   grd.addColorStop(0,"red");
//   grd.addColorStop(1,"white");
  
  // Fill with gradient
//   ctx.fillStyle = grd;
    // ctx.fillStyle = "rgb(200,0,0)";

  ctx.fillRect(0, 0, videoWidth, videoHeight);

  document.getElementById("stats").innerHTML = "";
  document.getElementById("warning").innerHTML =
    window.modeTracker === "facetracker" && predictions.length === 0
      ? warningMessage
      : "";

  if (predictions.length > 0) {
    predictions.forEach((prediction) => {
      try {
        if (window.modeTracker === "facetracker") {
          document.getElementById("warning").innerHTML =
            prediction.faceInViewConfidence < 1 ? warningMessage : "";
          document.getElementById(
            "stats"
          ).innerHTML += `confidence: ${prediction.faceInViewConfidence.toFixed(
            3
          )}`;
        }
      } catch (err) {
        document.getElementById("stats").innerHTML = err.message;
      }

      const keypoints = prediction.scaledMesh;

      //--------------------------------------NEW begin of test!!!  add here to try
      //draw trangles
      const drawPath = (ctx, points, closePath) => {
        const region = new Path2D();
        region.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
          const point = points[i];
          region.lineTo(point[0], point[1]);
        }
        if (closePath) {
          region.closePath();
        }
        // ctx.strokeStyle = "white";
        ctx.strokeStyle = "#C0C0C070";
        ctx.lineWidth = 0.5;
        ctx.stroke(region);
      };

      //draw mesh

      //  Draw Triangles
      for (let i = 0; i < TRIANGULATION.length / 3; i++) {
        // Get sets of three keypoints for the triangle
        const points = [
          TRIANGULATION[i * 3],
          TRIANGULATION[i * 3 + 1],
          TRIANGULATION[i * 3 + 2],
        ].map((index) => keypoints[index]);
        drawPath(ctx, points, true);
      }

      if (window.modeTracker === "facetracker") {
        window.yaw = yaw * parseFloat(controls.yawMultiplier);
        window.pitch = pitch * parseFloat(controls.pitchMultiplier);
        window.roll = roll * parseFloat(controls.rollMultiplier);
      }
    });
  }

  requestAnimationFrame(renderPrediction);
}

async function trackerMain() {
  const info = document.getElementById("info");
  const element = `
    <img class="svg-loader" src="/img/loading.gif">
    <p id="progress:debug">loading...</p>
    <p id="progress"></p>
  `;
  const progress = {
    element,
    change(current) {
      document.getElementById("progress").innerHTML = `${current}%`;
    },
  };
  const waitingSounds = () =>
    new Promise((resolve) => {
      const timer = setInterval(() => {
        progress.change(Player.progress); // update loading info
        if (Player.isReady()) {
          clearInterval(timer);
          resolve();
        }
      }, 500);
    });

  info.innerHTML = progress.element;
  document.getElementById("main").style.display = "none";

  const [isSetupCamera] = await Promise.all([
    setupCamera(),
    waitingSounds(),
    tf.ready(),
  ]);

  // disable all camera based handlers and settings
  if (!isSetupCamera) {
    // comment out the lines for making a loader
    // info.innerHTML = "";
    document.getElementById("main").style.display = "";

    // enable all mods without facetracker part
    return null;
  }

  canvas = document.getElementsByClassName("output_canvas")[0];
  ctx = canvas.getContext("2d");
  let width = window.screen.width;
  let height = window.screen.height;
  ctx.translate(width - 1600, -(height / 2) * 0.5);
  // ctx.translate(0, 0);
  // ctx.scale(-1, 1);
  ctx.scale(2, 2);

  ctx.fillStyle = "black";
  ctx.strokeStyle = "#F5339E";

  model = await facemesh.load({ maxFaces: 1 });
  await renderPrediction();

  // wait for loaded audio
  info.innerHTML = "";
  document.getElementById("main").style.display = "";

  // NOTE: iOS fix; should be start after build, load and resize events
  video.play();
}

document.addEventListener("DOMContentLoaded", () => {
  // setupDatGui();
  trackerMain();
});

// ------------------------
// Mach1 Spatial & Audio Handling

let m1Decode = null;
DecodeModule.then((m1DecodeModule) => {
  m1Decode = new m1DecodeModule.Mach1Decode();

  m1Decode.setPlatformType(m1Decode.Mach1PlatformType.Mach1PlatformDefault);
  m1Decode.setDecodeAlgoType(
    m1Decode.Mach1DecodeAlgoType.Mach1DecodeAlgoSpatial
  );
  m1Decode.setFilterSpeed(0.9);
});

function Decode(yaw, pitch, roll) {
  if (m1Decode !== null && yaw !== null && pitch !== null && roll !== null) {
    m1Decode.setFilterSpeed(controls.filterSpeed);
    m1Decode.beginBuffer();
    const decoded = m1Decode.decode(yaw, pitch, roll);
    m1Decode.endBuffer();

    Player.gains = decoded;
  }
}

// ------------------------
// OSC Handling
osc.open({
  port: 9898,
});

// ------------------------
// Visual rendering adopted from https://threejs.org/examples/webgl_materials_normalmap.html
let container;
let stats;
let loader;
let camera;
let scene;
let renderer;
let mesh;
let pivot;
let directionalLight;
let pointLight;
let ambientLight;

let mouseX = 0;
let mouseY = 0;

const width = 320; // window.innerWidth;
const height = 240; // window.innerHeight;

let composer;

let fYaw;
let fPitch;
let fRoll;

let yaw = 0;
let pitch = 0;
let roll = 0;

window.createOneEuroFilters = function createOneEuroFilters() {
  fYaw = OneEuroFilter(60, 1.0, controls.oneEuroFilterBeta, 1.0);
  fPitch = OneEuroFilter(60, 1.0, controls.oneEuroFilterBeta, 1.0);
  fRoll = OneEuroFilter(60, 1.0, controls.oneEuroFilterBeta, 1.0);
};

function onWindowResize() {
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  composer.setSize(width, height);
}

function onDocumentMouseMove(event) {
  // const rect = event.target.getBoundingClientRect();
  mouseX = event.clientX / window.innerWidth;
  mouseY = event.clientY / window.innerHeight;
}

function init() {
  const createScene = (geometry, scale, material) => {
    mesh = new THREE.Mesh(geometry, material);

    mesh.position.y = 120;

    mesh.scale.x = scale;
    mesh.scale.y = scale;
    mesh.scale.z = scale;

    pivot = new THREE.Group();
    pivot.position.set(0.0, -150.0, 0);
    pivot.add(mesh);

    scene.add(pivot);
  };

  const mainWindow = document.getElementById("main");
  container = document.getElementById("modelview");

  camera = new THREE.PerspectiveCamera(27, width / height, 1, 10000);
  camera.position.z = 2500;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x474747);

  // LIGHTS
  ambientLight = new THREE.AmbientLight(0x474747);
  scene.add(ambientLight);

  pointLight = new THREE.PointLight(0xffffff, 1.25, 1000);
  pointLight.position.set(0, 0, 600);

  scene.add(pointLight);

  directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(1, -0.5, -1);
  scene.add(directionalLight);

  const material = new THREE.MeshPhongMaterial({
    color: 0x191919,
    specular: 0x50505,
    shininess: 25,
    normalScale: new THREE.Vector2(0.8, 0.8),
  });

  loader = new THREE.GLTFLoader();
  loader.load(
    "https://threejs.org/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb",
    (gltf) => {
      createScene(gltf.scene.children[0].geometry, 100, material);
    }
  );

  renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  stats = new Stats();

  // COMPOSER
  renderer.autoClear = false;

  const renderModel = new THREE.RenderPass(scene, camera);
  composer = new THREE.EffectComposer(renderer);
  composer.addPass(renderModel);

  // EVENTS
  mainWindow.addEventListener("mousemove", onDocumentMouseMove, false);
  window.addEventListener("resize", onWindowResize, false);

  onWindowResize();
}

function render() {
  if (mesh) {
    pivot.rotation.y = Math.PI - THREE.Math.degToRad(yaw);
    pivot.rotation.x = THREE.Math.degToRad(pitch);
    pivot.rotation.z = -THREE.Math.degToRad(roll);
  }
  composer.render();
}

function animate() {
  const map = (value, x1, y1, x2, y2) =>
    ((value - x1) * (y2 - x2)) / (y1 - x1) + x2;
  requestAnimationFrame(animate);
  // Update mode dependent UI here
  if (window.modeTracker === "touch") {
    window.yaw = map(mouseX, 0, 1, -180, 180);
    window.pitch = map(mouseY, 0, 1, 45, -45);
    window.roll = 0;
    document.getElementById("compass").style.display = "none";
    if (videoOutput.style.display === "") {
      videoOutput.style.display = "none";
    }
    if (bosearStats.style.display === "") {
      bosearStats.style.display = "none";
    }
    if (touchStats.style.display === "none") {
      touchStats.style.display = "";
    }

    const rotateX = `rotateX(${parseInt(-window.pitch, 10)}deg)`;
    const rotateY = `rotateY(${parseInt(-window.yaw, 10)}deg)`;
    const transform = `translate(-50%, -50%) ${rotateX} ${rotateY}`;
    $(".card").css({ transform });
  }
  if (window.modeTracker === "device") {
    document.getElementById("compass").style.display = "";
    if (window.yaw != null) yaw = window.yaw;
    if (window.pitch != null) pitch = -window.pitch;
    if (window.roll != null) roll = window.roll;
    if (videoOutput.style.display === "") {
      videoOutput.style.display = "none";
    }
    if (bosearStats.style.display === "") {
      bosearStats.style.display = "none";
    }
    if (touchStats.style.display === "") {
      touchStats.style.display = "none";
    }
  } else {
    if (videoOutput.style.display === "") {
      videoOutput.style.display = "none";
    }
    if (bosearStats.style.display === "") {
      bosearStats.style.display = "none";
    }
    if (window.yaw != null) yaw = fYaw.filter(window.yaw);
    if (window.pitch != null) pitch = fPitch.filter(window.pitch);
    if (window.roll != null) roll = fRoll.filter(window.roll);
  }
  if (window.modeTracker === "facetracker") {
    document.getElementById("compass").style.display = "";
    if (videoOutput.style.display === "none") {
      videoOutput.style.display = "";
    }
    if (bosearStats.style.display === "") {
      bosearStats.style.display = "none";
    }
    if (touchStats.style.display === "") {
      touchStats.style.display = "none";
    }
  }
  if (window.modeTracker === "bosear") {
    document.getElementById("compass").style.display = "";
    if (videoOutput.style.display === "") {
      videoOutput.style.display = "none";
    }
    if (bosearStats.style.display === "none") {
      bosearStats.style.display = "";
    }
    if (touchStats.style.display === "") {
      touchStats.style.display = "none";
    }
  }

  render();
  stats.update();

  // Setting up all values into rotation panel
  document.getElementById("rotationPitch").value = pitch;
  document.getElementById("rotationYaw").value = yaw;
  document.getElementById("rotationRoll").value = roll;
  // Apply orientation to decode Mach1 Spatial to Stereo
  Decode(yaw, pitch, roll);
  // Apply orientation (yaw) to compass UI
  document.getElementById("compass").style.transform = `rotate(${yaw}deg)`;

  // Check and reconnect OSC
  // Apply orientation as output OSC messages
  if (osc.status() === OSC.STATUS.IS_OPEN) {
    /**
     * Receive OSC message with address "/orientation" and three float arguements
     * Yaw (left -> right | where rotating left is negative)
     * Pitch (down -> up | where rotating down is negative)
     * Roll (top-pointing-left -> top-pointing-right | where rotating top of object left is negative)
     *
     * @type {Class}
     */
    osc.send(new OSC.Message("/orientation", yaw, pitch, roll));
  } else if (osc.status() === OSC.STATUS.IS_CLOSED) {
    osc.open({
      // TODO: custom port output
      port: 9898,
    });
  }
}

// eslint-disable-next-line
function DisplayDebug() {
  // Add debug UI here
  const modelview = document.getElementById("modelview");
  if (modelview.style.display === "none") {
    modelview.style.display = "";
  } else {
    modelview.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.createOneEuroFilters();
  init();
  animate();
});

window.onerror = (event) => {
  document.getElementById(
    "progress:debug"
  ).innerHTML = `<p>Error: ${event}</p>`;
};
window.addEventListener("unhandledrejection", (event) => {
  document.getElementById(
    "progress:debug"
  ).innerHTML = `<p>Error: ${event.reason}</p>`;
});

let playButtonVar = document.getElementById("play_button_id");
playButtonVar.addEventListener(
  "mouseenter",
  function (event) {
    // highlight the mouseenter target
    console.log("mouseIn");
    document.getElementById("playButton_labelID").style.borderColor =
      "transparent transparent transparent black";
  },
  false
);
playButtonVar.addEventListener(
  "mouseleave",
  function (event) {
    console.log("mouseOut");
    document.getElementById("playButton_labelID").style.borderColor =
      "transparent transparent transparent white";
  },
  false
);

function buttonChange() {
  // no ';' here
  // var elem = document.getElementById("myButton1");
  var elem = document.getElementById("play_btn_inner");
  console.log(elem.innerHTML);
  if (elem.innerHTML == "PLAY") {
    elem.innerHTML = "PAUSE";
    Player.play();
    console.log("now play music");
    document.getElementById("playButton_labelID").classList.add("pause");
    document.getElementById("playButton_labelID").classList.remove("playpause");
  } else {
    elem.innerHTML = "PLAY";
    Player.stop();
    console.log("now stop music");
    document.getElementById("playButton_labelID").classList.remove("pause");
    document.getElementById("playButton_labelID").classList.add("playpause");
  }
}
