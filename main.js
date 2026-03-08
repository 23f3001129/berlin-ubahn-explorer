import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/loaders/GLTFLoader.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/controls/PointerLockControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

const camera = new THREE.PerspectiveCamera(
75,
window.innerWidth / window.innerHeight,
0.1,
1000
);

camera.position.set(0,2,5);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.HemisphereLight(0xffffff,0x444444,1);
scene.add(light);

const loader = new GLTFLoader();

loader.load('station.glb',(gltf)=>{
scene.add(gltf.scene);
});

const controls = new PointerLockControls(camera, document.body);

document.body.addEventListener('click',()=>{
controls.lock();
});

const move = {forward:false, back:false, left:false, right:false};

document.addEventListener('keydown',(e)=>{
if(e.code==='KeyW') move.forward=true;
if(e.code==='KeyS') move.back=true;
if(e.code==='KeyA') move.left=true;
if(e.code==='KeyD') move.right=true;
});

document.addEventListener('keyup',(e)=>{
if(e.code==='KeyW') move.forward=false;
if(e.code==='KeyS') move.back=false;
if(e.code==='KeyA') move.left=false;
if(e.code==='KeyD') move.right=false;
});

function animate(){
requestAnimationFrame(animate);

const speed=0.1;

if(move.forward) controls.moveForward(speed);
if(move.back) controls.moveForward(-speed);
if(move.left) controls.moveRight(-speed);
if(move.right) controls.moveRight(speed);

renderer.render(scene,camera);
}

animate();
