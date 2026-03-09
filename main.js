import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/loaders/GLTFLoader.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/controls/PointerLockControls.js';

/* =========================
   Scene Setup
========================= */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);
scene.fog = new THREE.Fog(0x202020, 10, 80);

/* =========================
   Camera
========================= */

const camera = new THREE.PerspectiveCamera(
75,
window.innerWidth / window.innerHeight,
0.1,
1000
);

camera.position.set(0,2,5);

/* =========================
   Renderer
========================= */

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.shadowMap.enabled = true;

document.body.appendChild(renderer.domElement);

/* =========================
   Lighting (Better Lighting)
========================= */

const hemiLight = new THREE.HemisphereLight(0xffffff,0x444444,1.2);
hemiLight.position.set(0,20,0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff,0.8);
dirLight.position.set(5,10,7);
dirLight.castShadow = true;
scene.add(dirLight);

/* =========================
   Controls (FPS)
========================= */

const controls = new PointerLockControls(camera,document.body);

document.body.addEventListener("click",()=>{
controls.lock();
});

/* =========================
   Movement Variables
========================= */

const move = {
forward:false,
back:false,
left:false,
right:false
};

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

const speed = 6;
const damping = 8;

/* =========================
   Keyboard Controls
========================= */

document.addEventListener('keydown',(e)=>{

switch(e.code){

case "KeyW":
move.forward = true;
break;

case "KeyS":
move.back = true;
break;

case "KeyA":
move.left = true;
break;

case "KeyD":
move.right = true;
break;

}

});

document.addEventListener('keyup',(e)=>{

switch(e.code){

case "KeyW":
move.forward = false;
break;

case "KeyS":
move.back = false;
break;

case "KeyA":
move.left = false;
break;

case "KeyD":
move.right = false;
break;

}

});

/* =========================
   Model Loader
========================= */

let station;

const loader = new GLTFLoader();

loader.load("./station.glb",(gltf)=>{

station = gltf.scene;

station.traverse((child)=>{
if(child.isMesh){
child.castShadow = true;
child.receiveShadow = true;
}
});

scene.add(station);

});

/* =========================
   Collision Detection
========================= */

const playerCollider = new THREE.Box3();
const worldColliders = [];

function buildColliders(object){

object.traverse((child)=>{

if(child.isMesh){

child.geometry.computeBoundingBox();

const box = child.geometry.boundingBox.clone();
box.applyMatrix4(child.matrixWorld);

worldColliders.push(box);

}

});

}

/* =========================
   Resize Handling
========================= */

window.addEventListener("resize",()=>{

camera.aspect = window.innerWidth/window.innerHeight;
camera.updateProjectionMatrix();

renderer.setSize(window.innerWidth,window.innerHeight);

});

/* =========================
   Animation Loop
========================= */

const clock = new THREE.Clock();

function animate(){

requestAnimationFrame(animate);

const delta = clock.getDelta();

/* movement direction */

direction.z = Number(move.forward) - Number(move.back);
direction.x = Number(move.right) - Number(move.left);
direction.normalize();

/* smoother movement */

velocity.x -= velocity.x * damping * delta;
velocity.z -= velocity.z * damping * delta;

if(move.forward || move.back)
velocity.z -= direction.z * speed * delta;

if(move.left || move.right)
velocity.x -= direction.x * speed * delta;

/* apply movement */

controls.moveRight(-velocity.x * delta);
controls.moveForward(-velocity.z * delta);

/* floor lock */

camera.position.y = 2;

/* collision detection */

playerCollider.setFromCenterAndSize(
camera.position,
new THREE.Vector3(1,2,1)
);

for(const box of worldColliders){

if(playerCollider.intersectsBox(box)){

controls.moveRight(velocity.x * delta);
controls.moveForward(velocity.z * delta);

}

}

renderer.render(scene,camera);

}

animate();
