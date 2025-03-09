import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/GLTFLoader.js';
// import { parseTextToParameters } from './text.js';


// Diagram of data flow relationships

// User input “blue a little bigger”
// ↓
// Front end sends input to back end `/update-context`
// ↓
// The backend processes the input, generating updatedPreferences (parsing + updating user preferences).
// ↓
// The backend returns updatedPreferences to the frontend, assigning them to updatedParameters.
// ↓
// Frontend passes updatedParameters to generateCubeScene function and uses them as parameters (variable name changes to parameters)
// ↓
// The generateCubeScene function uses parameters to create a 3D model.
// ↓
// The user sees the blue, larger cube

document.getElementById('generate').addEventListener('click', async () => {
    const userInput = document.getElementById('prompt').value;

    // Send user input to the backend
    const response = await fetch(`${API_BASE_URL}/update-context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: userInput, userId: 'default' })
    });

    // get the parameters returned by the backend, updatedParameters is the result of the fetch request from the backend (i.e. the value of response.json())
    const updatedParameters = await response.json();

    //print parameters on the website
    displayParameters(updatedParameters);

    // Use the returned parameters to generate the 3D scene, the updatedParameters are passed as arguments to the generateCubeScene function.
    generateCubeScene(updatedParameters);
});

//print parameters on the website
function displayParameters(parameters) {
    const outputElement = document.getElementById('parameters-output');
    outputElement.innerHTML = `
    <pre>${JSON.stringify(parameters, null, 2)}</pre>
`;
}


// generate a Three.js scene, the parameters variable in the generateCubeScene function is actually a reference to updatedParameters.
function generateCubeScene(parameters) {

    const canvasContainer = document.getElementById('canvas-container');
    canvasContainer.innerHTML = '';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeeeeee);

    const camera = new THREE.PerspectiveCamera(75, canvasContainer.clientWidth / canvasContainer.clientHeight, 0.1, 1000);
    camera.position.set(15, 15, 15);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    renderer.shadowMap.enabled = true; //open shadow
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    canvasContainer.appendChild(renderer.domElement);

    const light = new THREE.PointLight(0xffffff, 1);
    light.position.set(400, 200, -50);
    light.castShadow = false; //open shadow
    light.shadow.mapSize.width = 1024; //add shadow to light
    light.shadow.mapSize.height = 1024; //add shadow to light
    light.shadow.camera.near = 0.5; //add shadow to light
    light.shadow.camera.far = 5000; //add shadow to light
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);

    // Add ground (receive shadows)
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // 加载 glTF 模型
    const loader = new GLTFLoader();
    // 注意路径 "../1.gltf" 是因为 1.gltf 在 index.html 同级目录，而 script.js 在 client 文件夹中
    loader.load('../1.gltf', (gltf) => {
        const model = gltf.scene;
        // 设置模型位置和缩放（可以根据参数调整）
        model.position.set(0, 0, 0);
        if (parameters && parameters.scale) {
            model.scale.set(parameters.scale, parameters.scale, parameters.scale);
        }
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        scene.add(model);
    }, undefined, (error) => {
        console.error('加载 glTF 模型出错: ', error);
    });

    // Person
    const person = createPerson(1.8);
    person.position.set(0, 0, 7.5);
    person.castShadow = true; //add shadow to light
    person.receiveShadow = true; //add shadow to light
    scene.add(person);

    // cube
    const shape = createShape(parameters);
    shape.position.set(0, parameters.height / 2 || 5, 0);
    shape.castShadow = true; //add shadow to light
    shape.receiveShadow = true; //add shadow to light
    scene.add(shape);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.update();

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
}

function createPerson(height) {
    const bodyHeight = height * 0.83;
    const headHeight = height * 0.17;

    // body
    const bodyGeometry = new THREE.CylinderGeometry(0.55, 0.15, bodyHeight, 32);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xA8A8A8 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = bodyHeight / 6; // Elevate to the ground.

    // head
    const headGeometry = new THREE.SphereGeometry(headHeight / 1, 32, 32);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xA8A8A8 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = bodyHeight; // Put it on top of the body.

    // Combine body and head into a group
    const person = new THREE.Group();
    person.add(body);
    person.add(head);

    return person;
}

// Create geometry based on parameters
function createShape(params) {
    const { shape = 'cube', width = 10, height = 10, depth = 10, color = 0xA8A8A8 } = params;

    let geometry;
    switch (shape.toLowerCase()) {
        case 'sphere':
            geometry = new THREE.SphereGeometry(width / 2, 32, 32);
            break;
        case 'cylinder':
            geometry = new THREE.CylinderGeometry(width / 2, width / 2, height, 32);
            break;
        default:
            geometry = new THREE.BoxGeometry(width, height, depth);
    }

    const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.75,
    });

    return new THREE.Mesh(geometry, material);
}

