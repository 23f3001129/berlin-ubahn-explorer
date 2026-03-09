import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/loaders/GLTFLoader.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/controls/PointerLockControls.js';

/* -------------------- SCENE -------------------- */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

/* -------------------- CAMERA -------------------- */

const camera = new THREE.PerspectiveCamera(
75,
window.innerWidth / window.innerHeight,
0.1,
1000
);

camera.position.set(0,2,5);

/* -------------------- RENDERER -------------------- */

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

document.body.appendChild(renderer.domElement);

/* -------------------- LIGHTING -------------------- */

const light = new THREE.HemisphereLight(0xffffff,0x444444,1);
scene.add(light);

/* -------------------- CONTROLS -------------------- */

const controls = new PointerLockControls(camera, document.body);
scene.add(controls.getObject());

document.body.addEventListener('click',()=>{
controls.lock();
});

/* -------------------- MODEL LOADER -------------------- */

const loader = new GLTFLoader();

loader.load(
'./station.glb',

function(gltf){
console.log("Model Loaded");
scene.add(gltf.scene);
},

function(progress){
console.log((progress.loaded / progress.total * 100) + "% loaded");
},

function(error){
console.error("Error loading model:", error);
}
);

/* -------------------- MOVEMENT -------------------- */

const move = {
forward:false,
back:false,
left:false,
right:false
};

document.addEventListener('keydown',(e)=>{
if(e.code === 'KeyW') move.forward = true;
if(e.code === 'KeyS') move.back = true;
if(e.code === 'KeyA') move.left = true;
if(e.code === 'KeyD') move.right = true;
});

document.addEventListener('keyup',(e)=>{
if(e.code === 'KeyW') move.forward = false;
if(e.code === 'KeyS') move.back = false;
if(e.code === 'KeyA') move.left = false;
if(e.code === 'KeyD') move.right = false;
});

/* -------------------- CLOCK -------------------- */

const clock = new THREE.Clock();

/* -------------------- ANIMATION LOOP -------------------- */

function animate(){

requestAnimationFrame(animate);

const delta = clock.getDelta();
const speed = 5 * delta;

if(move.forward) controls.moveForward(speed);
if(move.back) controls.moveForward(-speed);
if(move.left) controls.moveRight(-speed);
if(move.right) controls.moveRight(speed);

/* prevent falling through floor */

if(camera.position.y < 1.6){
camera.position.y = 1.6;
}

renderer.render(scene,camera);
}

animate();

/* -------------------- WINDOW RESIZE -------------------- */

window.addEventListener('resize',()=>{

camera.aspect = window.innerWidth / window.innerHeight;
camera.updateProjectionMatrix();

renderer.setSize(window.innerWidth, window.innerHeight);

});
