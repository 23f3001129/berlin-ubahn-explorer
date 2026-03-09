import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Octree } from 'three/addons/math/Octree.js';
import { Capsule } from 'three/addons/math/Capsule.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// ---- INIT ----
const clock = new THREE.Clock();
const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x111115 );
scene.fog = new THREE.Fog( 0x111115, 0, 70 );

// ---- CAMERA & LIGHTS ----
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.rotation.order = 'YXZ';

const ambientLight = new THREE.AmbientLight( 0xffffff, 0.3 );
scene.add( ambientLight );

const directionalLight = new THREE.DirectionalLight( 0xfffae6, 1.0 );
directionalLight.position.set( - 10, 30, 20 );
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 0.01;
directionalLight.shadow.camera.far = 200;
directionalLight.shadow.camera.right = 40;
directionalLight.shadow.camera.left = - 40;
directionalLight.shadow.camera.top  = 40;
directionalLight.shadow.camera.bottom = - 40;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.bias = -0.0005;
scene.add( directionalLight );

// Point lights to simulate station lighting
const stationLight1 = new THREE.PointLight( 0xffaa00, 2, 30 );
stationLight1.position.set( 0, 5, 0 );
scene.add( stationLight1 );

// ---- RENDERER ----
const renderer = new THREE.WebGLRenderer( { antialias: true, powerPreference: "high-performance" } );
renderer.setPixelRatio( Math.min(window.devicePixelRatio, 2) );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild( renderer.domElement );

// ---- PHYSICS & WORLD ----
const worldOctree = new Octree();
const playerCollider = new Capsule( new THREE.Vector3( 0, 0.35, 0 ), new THREE.Vector3( 0, 1.45, 0 ), 0.35 ); 

// ---- PLAYER KINETICS & MOMENTUM ----
const playerVelocity = new THREE.Vector3();
const playerDirection = new THREE.Vector3();
let playerOnFloor = false;

const keyStates = {};

document.addEventListener( 'keydown', ( event ) => {
    keyStates[ event.code ] = true;
} );

document.addEventListener( 'keyup', ( event ) => {
    keyStates[ event.code ] = false;
} );

// ---- CONTROLS ----
const controls = new PointerLockControls( camera, document.body );
const instructions = document.getElementById( 'instructions' );

document.addEventListener( 'click', () => {
    controls.lock();
} );

controls.addEventListener( 'lock', () => {
    instructions.style.opacity = '0';
    setTimeout(() => instructions.style.display = 'none', 300);
} );

controls.addEventListener( 'unlock', () => {
    instructions.style.display = 'flex';
    setTimeout(() => instructions.style.opacity = '1', 10);
} );

scene.add( controls.getObject() );

// ---- LOAD U-BAHN STATION ----
const loader = new GLTFLoader();

// Attempt to load the user's GLB file. If it fails, load a fallback.
loader.load( 'ubahn.glb', ( gltf ) => {
    addModelToScene(gltf.scene);
}, undefined, ( error ) => {
    console.warn("Could not load 'ubahn.glb'. Building a fallback U-Bahn station environment for prototyping.");
    buildFallbackStation();
} );

function addModelToScene(modelData) {
    scene.add( modelData );
    // Map the 3D model geometry to Octree for collision physics calculation
    worldOctree.fromGraphNode( modelData );

    modelData.traverse( child => {
        if ( child.isMesh ) {
            child.castShadow = true;
            child.receiveShadow = true;
            if ( child.material.map ) {
                child.material.map.anisotropy = 8; // High texture quality
            }
        }
    } );
}

function buildFallbackStation() {
    const group = new THREE.Group();
    // Material presets
    const floorMat = new THREE.MeshStandardMaterial({color: 0x333333, roughness: 0.9});
    const wallMat = new THREE.MeshStandardMaterial({color: 0xe6dfc8, roughness: 0.7});
    const railMat = new THREE.MeshStandardMaterial({color: 0x222222, metalness: 0.8, roughness: 0.2});
    
    // Platform Floor
    const platform = new THREE.Mesh(new THREE.BoxGeometry(20, 1, 80), floorMat);
    platform.position.set(0, -0.5, 0);
    platform.receiveShadow = true;
    group.add(platform);

    // Track pit
    const pit = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 80), floorMat);
    pit.position.set(-13, -1.8, 0);
    pit.receiveShadow = true;
    group.add(pit);

    // Opposite Wall
    const oppWall = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 80), wallMat);
    oppWall.position.set(-16.5, 3, 0);
    oppWall.castShadow = true;
    oppWall.receiveShadow = true;
    group.add(oppWall);

    // Platform Wall
    const platWall = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 80), wallMat);
    platWall.position.set(10.5, 3, 0);
    platWall.castShadow = true;
    platWall.receiveShadow = true;
    group.add(platWall);

    // Ceiling
    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(28, 1, 80), wallMat);
    ceiling.position.set(-3, 8, 0);
    ceiling.receiveShadow = true;
    group.add(ceiling);

    // Pillars
    for(let z = -30; z <= 30; z += 15) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 8), floorMat);
        pillar.position.set(-1, 3.5, z);
        pillar.castShadow = true;
        group.add(pillar);
    }
    
    // Rails
    for (let x of [-12, -14]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 80), railMat);
        rail.position.set(x, -1.5, 0);
        group.add(rail);
    }

    addModelToScene(group);
}

// ---- PHYSICS LOOP ----
const GRAVITY = 30;
const STEPS_PER_FRAME = 5;

// Prevent clipping / handle structural collision constraints
function checkPlayerCollisions() {
    const result = worldOctree.capsuleIntersect( playerCollider );
    playerOnFloor = false;

    if ( result ) {
        playerOnFloor = result.normal.y > 0;
        
        // Correct player trajectory by eliminating velocity in the collision normal direction
        if ( ! playerOnFloor ) {
            playerVelocity.addScaledVector( result.normal, - result.normal.dot( playerVelocity ) );
        }
        
        playerCollider.translate( result.normal.multiplyScalar( result.depth ) );
    }
}

// Applies inertia / momentum
function updatePlayer( deltaTime ) {
    let damping = Math.exp( - 4 * deltaTime ) - 1;

    // Apply gravity
    if ( ! playerOnFloor ) {
        playerVelocity.y -= GRAVITY * deltaTime;
        damping *= 0.1; // Reduced damping in mid-air (simulates inertia jump)
    }

    playerVelocity.addScaledVector( playerVelocity, damping );
    
    const deltaPosition = playerVelocity.clone().multiplyScalar( deltaTime );
    playerCollider.translate( deltaPosition );

    checkPlayerCollisions();
    
    // Lock camera inside capsule
    camera.position.copy( playerCollider.end );
}

function getForwardVector() {
    camera.getWorldDirection( playerDirection );
    playerDirection.y = 0;
    playerDirection.normalize();
    return playerDirection;
}

function getSideVector() {
    camera.getWorldDirection( playerDirection );
    playerDirection.y = 0;
    playerDirection.normalize();
    playerDirection.cross( camera.up );
    return playerDirection;
}

// Processes WSAD Input
function handleControls( deltaTime ) {
    const speedDelta = deltaTime * ( playerOnFloor ? 30 : 8 );

    if ( keyStates[ 'KeyW' ] ) {
        playerVelocity.add( getForwardVector().multiplyScalar( speedDelta ) );
    }
    if ( keyStates[ 'KeyS' ] ) {
        playerVelocity.add( getForwardVector().multiplyScalar( - speedDelta ) );
    }
    if ( keyStates[ 'KeyA' ] ) {
        playerVelocity.add( getSideVector().multiplyScalar( - speedDelta ) );
    }
    if ( keyStates[ 'KeyD' ] ) {
        playerVelocity.add( getSideVector().multiplyScalar( speedDelta ) );
    }
    if ( playerOnFloor ) {
        if ( keyStates[ 'Space' ] ) {
            playerVelocity.y = 10;
        }
    }
}

// ---- HEAD BOBBING ----
let headBobTimer = 0;
function updateHeadBob(deltaTime) {
    if (playerOnFloor) {
        const speed = new THREE.Vector2(playerVelocity.x, playerVelocity.z).length();
        if (speed > 1) {
            // Fast walk = faster bob frequency
            headBobTimer += deltaTime * (speed > 6 ? 12 : 8);
            
            // Subtle Y-axis bouncing
            const bobOffset = Math.sin(headBobTimer) * 0.06;
            camera.position.y += bobOffset;
        } else {
            // Smoothly return to 0 when stopped
            headBobTimer = 0; 
        }
    }
}

// ---- RENDER LOOP ----
function animate() {
    const deltaTime = Math.min( 0.05, clock.getDelta() ) / STEPS_PER_FRAME;

    for ( let i = 0; i < STEPS_PER_FRAME; i ++ ) {
        handleControls( deltaTime );
        updatePlayer( deltaTime );
    }
    
    updateHeadBob( deltaTime * STEPS_PER_FRAME );

    renderer.render( scene, camera );
    requestAnimationFrame( animate );
}

window.addEventListener( 'resize', onWindowResize );

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

animate();
