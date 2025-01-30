import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
let video = document.getElementById('webcam');
let canvas = document.getElementById('cameraCanvas');
let threeCanvas =  document.getElementById('threeCanvas');
let ctx = canvas.getContext('2d');

let scene, camera, renderer, model, modelVisible = false;
const clock = new THREE.Clock();

function init3D() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5);

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('threeCanvas'), alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(light);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    loadModel();
}

function loadModel() {
    const loader = new GLTFLoader();
    loader.load('./assets/model.glb', (gltf) => {
        model = gltf.scene;
        model.scale.set(0.1, 0.1, 0.1);
        model.position.set(0, 0, 0);
        model.visible = false;
        scene.add(model);
    }, undefined, (error) => {
        console.error('Error loading model:', error);
    });
}

function animate() {
    requestAnimationFrame(animate);

    if (model && modelVisible) {
        model.rotation.y += clock.getDelta();
    }

    renderer.render(scene, camera);
}

async function setupWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "environment", // Use "user" for the front camera
            },
        });
        video.srcObject = stream;
        video.play();
        scanQRCode();
    } catch (err) {
        console.error('Webcam access denied:', err);
    }
}

function scanQRCode() {
    requestAnimationFrame(scanQRCode);

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

        if (qrCode) {
            console.log('QR Code detected:', qrCode.data);
            if (model) {
                modelVisible = true;
                model.visible = true;
                console.log('model is visible', model)
                const { topLeftCorner, bottomRightCorner } = qrCode.location;
                const centerX = (topLeftCorner.x + bottomRightCorner.x) / 2;
                const centerY = (topLeftCorner.y + bottomRightCorner.y) / 2;

                // Map 2D QR code position to 3D space (example logic)
                model.position.set(
                    (centerX / canvas.width - 0.5) * 5,
                    -(centerY / canvas.height - 0.5) * 5,
                    0
                );
            }
        } else if (model) {
            modelVisible = false;
            model.visible = false;
        }
    }
}

window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
  
    canvas.width = width;
    canvas.height = height;
    threeCanvas.width = width;
    threeCanvas.height = height;
  
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

init3D();
setupWebcam();
animate();