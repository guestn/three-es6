// Global imports -
import * as THREE from 'three';

// Local imports -
// Components
import Renderer from './components/renderer';
import Camera from './components/camera';
import Light from './components/light';
import Controls from './components/controls';

// Helpers
import Geometry from './helpers/geometry';

// Model
// import ModelWithTextures from './model/modelWithTextures';
// import Texture from './model/texture';
// import Model from './model/model';

// Managers
// import Interaction from './managers/interaction';

// data
import Config from './../config';

// physics
import Ammo from 'ammonext';

// stats
import rStats from '@jpweeks/rstats';
// -- End of imports
// Local vars for rStats
let rS;


let collisionConfiguration;
let dispatcher;
let broadphase;
let solver;
let dynamicObjects = [];
const transformAux1 = new Ammo.btTransform();

let time = 0;
const objectTimePeriod = 3;
let timeNextSpawn = time + objectTimePeriod;
const maxNumObjects = 30;


// This class instantiates and ties all of the components together, starts the loading process and renders the main loop
export default class Main {
  constructor(container) {
    // Set container property to container element
    this.container = container;

    // Start Three clock
    this.clock = new THREE.Clock();

    // Main scene creation
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(Config.fog.color, Config.fog.near);

    // Get Device Pixel Ratio first for retina
    if (window.devicePixelRatio) {
      Config.dpr = window.devicePixelRatio;
    }

    // Main renderer instantiation
    this.renderer = new Renderer(this.scene, container);

    // Components instantiation
    this.camera = new Camera(this.renderer.threeRenderer, container);
    this.controls = new Controls(this.camera.threeCamera, container);
    this.light = new Light(this.scene);

    // Physics
    this.physicsWorld = null;


    // Heightfield parameters
    this.ammoHeightData = null;
    this.heightData = null;
    this.terrainWidthExtents = 30;
    this.terrainDepthExtents = 128;
    this.terrainWidth = 20;//128;
    this.terrainDepth = 10;//128;
    this.terrainHalfWidth = this.terrainWidth / 2;
    this.terrainHalfDepth = this.terrainDepth / 2;
    this.terrainMaxHeight = 8;
    this.terrainMinHeight = -2;


    // Create and place lights in scene
    const lights = ['ambient', 'directional'];
    for (let i = 0; i < lights.length; i++) {
      this.light.place(lights[i]);
    }

    // Create and place geo in scene
    this.geometry = new Geometry(this.scene);
    this.geometry.make('plane')(150, 150, 10, 10);
    this.geometry.place([0, -20, 0], [Math.PI / 2, 0, 0]);


    //Set up rStats if dev environment
    if(Config.isDev) {
    //   bS = new BrowserStats();
    //   glS = new glStats();
    //  tS = new threeStats(this.renderer.threeRenderer);
    //
      rS = new rStats({
        CSSPath: './assets/css/',
        userTimingAPI: true,
        values: {
          frame: { caption: 'Total frame time (ms)', over: 16, average: true, avgMs: 100 },
          fps: { caption: 'Framerate (FPS)', below: 30 },
          calls: { caption: 'Calls (three.js)', over: 3000 },
          raf: { caption: 'Time since last rAF (ms)', average: true, avgMs: 100 },
          rstats: { caption: 'rStats update (ms)', average: true, avgMs: 100 },
          texture: { caption: 'GenTex', average: true, avgMs: 100 }
        },
        groups: [
          { caption: 'Framerate', values: [ 'fps', 'raf' ] },
          { caption: 'Frame Budget', values: [ 'frame', 'texture', 'setup', 'render' ] }
        ],
        fractions: [
          { base: 'frame', steps: [ 'texture', 'setup', 'render' ] }
        ],
        //plugins: [bS, tS, glS]
      });
    }

    this.heightData = this.generateHeight( this.terrainWidth, this.terrainDepth, this.terrainMinHeight, this.terrainMaxHeight );

    const geometry = new THREE.PlaneBufferGeometry( this.terrainWidthExtents, this.terrainDepthExtents, this.terrainWidth - 1, this.terrainDepth - 1 );
    geometry.rotateX( - Math.PI / 2 );
    const vertices = geometry.attributes.position.array;
    for ( let i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3 ) {
    // j + 1 because it is the y component that we modify
        vertices[ j + 1 ] = this.heightData[ i ];
    }
    geometry.computeVertexNormals();
    const groundMaterial = new THREE.MeshPhongMaterial( { color: 0xC7C7C7 } );
    const terrainMesh = new THREE.Mesh( geometry, groundMaterial );
    terrainMesh.receiveShadow = true;
    this.scene.add( terrainMesh );

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load( "../assets/textures/grid.png", texture => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set( this.terrainWidth - 1, this.terrainDepth - 1 );
      groundMaterial.map = texture;
      groundMaterial.needsUpdate = true;
    });

    //this.generateExtrusion();

    document.addEventListener('DOMContentLoaded', () => {
      this.initPhysics();
      this.animate();
    }, false);


    // Start render which does not wait for model fully loaded
    //this.animate();
  }


  animate() {
    // Render rStats if Dev
    if (Config.isDev) {
      rS('frame').start();

      rS('rAF').tick();
      rS('FPS').frame();

      rS('render').start();
    }

    // Call render function and pass in created scene and camera
    this.renderer.render(this.scene, this.camera.threeCamera);

    // rStats has finished determining render call now
    if (Config.isDev) {
      rS('render').end(); // render finished
      rS('frame').end(); // frame finished

      // // Local rStats update
      rS('rStats').start();
      rS().update();
      rS('rStats').end();
    }

    // Delta time is sometimes needed for certain updates
    const delta = this.clock.getDelta();

    // Call any vendor or module updates here
    this.updatePhysics( delta);

    if ( dynamicObjects.length < maxNumObjects && time > timeNextSpawn ) {
      this.generateObject();
      timeNextSpawn = time + objectTimePeriod;
    }
    this.controls.threeControls.update();

    time += delta;

    // RAF
    requestAnimationFrame(this.animate.bind(this)); // Bind the main class instead of window object
  }


  generateExtrusion() {

    const splinePoints = [
      new THREE.Vector3( 0 , 0, 0),
      new THREE.Vector3( 3 , 0, -20),
      new THREE.Vector3( 10 , 0, -50),
      new THREE.Vector3( -10 , 0, -100),
      new THREE.Vector3( 20 , 0, -150),
    ]

    const spline = new THREE.CatmullRomCurve3(splinePoints);

    const extrudeSettings = {
      steps			: 10,
      bevelEnabled	: false,
      extrudePath		: spline,
      
    };


    const pts = [
      new THREE.Vector2 ( -1, -15 ),
      new THREE.Vector2 ( -10, -19),
      new THREE.Vector2 ( -10, -20 ),
      new THREE.Vector2 ( 0, -16 ),
      new THREE.Vector2 ( 0, 16 ),
      new THREE.Vector2 ( -10, 20 ),
      new THREE.Vector2 ( -10, 19),
      new THREE.Vector2 ( -1, 15 ),
    ]

    const pts2 = [
      new THREE.Vector2 ( -10, -20 ),
      new THREE.Vector2 ( 0, -16 ),
      new THREE.Vector2 ( 0, 16 ),
      new THREE.Vector2 ( -10, 20 ),
      new THREE.Vector2 ( 50, 0),
    ]
  
    const shape = new THREE.Shape(pts2);
 
    const geometry = new THREE.ExtrudeBufferGeometry( shape, extrudeSettings );

    // geometry.attributes.position.array.splice(318*0.8, 200)



    const material2 = new THREE.MeshLambertMaterial( { color: 0xff8000, wireframe: false } );
    const mesh = new THREE.Mesh( geometry, material2 );
    mesh.receiveShadow = true;
    this.scene.add( mesh );

    this.heightData = geometry.attributes.position.array;
  }
  ////////////////////
  // Ammo Physics   //
  ///////////////////

  initPhysics() {

    // Physics configuration

    collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
    broadphase = new Ammo.btDbvtBroadphase();
    solver = new Ammo.btSequentialImpulseConstraintSolver();
    this.physicsWorld = new Ammo.btDiscreteDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration );
    this.physicsWorld.setGravity( this.gravity() );

    // Create the terrain body
    const groundShape = this.createTerrainShape( this.heightData );
    console.log(groundShape)
    const groundTransform = new Ammo.btTransform();
    groundTransform.setIdentity();
    // Shifts the terrain, since bullet re-centers it on its bounding box.
    groundTransform.setOrigin( new Ammo.btVector3( 0, ( this.terrainMaxHeight + this.terrainMinHeight ) / 2, 0 ) );
    const groundMass = 0;
    const groundLocalInertia = new Ammo.btVector3( 0, 0, 0 );
    const groundMotionState = new Ammo.btDefaultMotionState( groundTransform );
    const groundBody = new Ammo.btRigidBody( new Ammo.btRigidBodyConstructionInfo( groundMass, groundMotionState, groundShape, groundLocalInertia ) );
    this.physicsWorld.addRigidBody( groundBody );

  }

  gravity() {
    return new Ammo.btVector3( 0, -100, 0 )
  }

  generateHeight( width, depth, minHeight, maxHeight ) {

    // Generates the height data (a sinus wave)

    var size = width * depth;
    var data = new Float32Array(size);

    var hRange = maxHeight - minHeight;
    var w2 = width / 2;
    var d2 = depth / 2;
    var phaseMult = 6;

    var p = 0;
    for ( var j = 0; j < depth; j++ ) {
      for ( var i = -width/2; i < width/2; i++ ) {

        // var radius = Math.sqrt(
        //     Math.pow( ( i - w2 ) / w2, 2.0 ) +
        //     Math.pow( ( j - d2 ) / d2, 2.0 ) );

        // var height = ( Math.sin( radius * phaseMult ) + 1 ) * 0.5 * hRange + minHeight;
        var height = j * 2 + 0.00001*Math.pow(i,6) + Math.random()

        data[ p ] = height;

        p++;
      }
    }
    console.log(data)
    return data;
  }

  createTerrainShape() {

    // This parameter is not really used, since we are using PHY_FLOAT height data type and hence it is ignored
    //var heightScale = 1;

    // Up axis = 0 for X, 1 for Y, 2 for Z. Normally 1 = Y is used.
    var upAxis = 1;

    // hdt, height data type. "PHY_FLOAT" is used. Possible values are "PHY_FLOAT", "PHY_UCHAR", "PHY_SHORT"
    const hdt = "PHY_FLOAT";

    // Set this to your needs (inverts the triangles)
    const flipQuadEdges = false;

    // Creates height data buffer in Ammo heap
    this.ammoHeightData = Ammo._malloc(4 * this.terrainWidth * this.terrainDepth);

    // Copy the javascript height data array to the Ammo one.
    let p = 0;
    let p2 = 0;
    for ( let j = 0; j < this.terrainDepth; j++ ) {
      for ( let i = 0; i < this.terrainWidth; i++ ) {

        // write 32-bit float data to memory
        Ammo.HEAPF32[ this.ammoHeightData + p2 >> 2] = this.heightData[ p ];
        //Ammo.HEAPF32[ this.ammoHeightData + p2 ] = this.heightData[ p ];

        p++;
        // 4 bytes/float
        p2 += 4;
      }
    }

    // Creates the heightfield physics shape
    const heightFieldShape = new Ammo.btHeightfieldTerrainShape(
      this.terrainWidth,
      this.terrainDepth,
      this.ammoHeightData,
      this.heightScale,
      this.terrainMinHeight,
      this.terrainMaxHeight,
      upAxis,
      hdt,
      flipQuadEdges
    );

    // Set horizontal scale
    const scaleX = this.terrainWidthExtents / ( this.terrainWidth - 1 );
    const scaleZ = this.terrainDepthExtents / ( this.terrainDepth - 1 );
    heightFieldShape.setLocalScaling( new Ammo.btVector3( scaleX, 1, scaleZ ) );

    heightFieldShape.setMargin( 0.05 );

    return heightFieldShape;

  }

  generateObject() {

    const objectSize = 3;
    const margin = 0.05;

    const radius = 1 + Math.random() * objectSize;
    const threeObject = new THREE.Mesh( new THREE.SphereGeometry( radius, 20, 20 ), this.createObjectMaterial() );
    const shape = new Ammo.btSphereShape( radius );
    shape.setMargin( margin );

    // threeObject.position.set( 
    //   ( Math.random() - 0.5 ) * this.terrainWidth * 0.6, 
    //   this.terrainMaxHeight + objectSize + 20, 
    //   ( Math.random() - 0.5 ) * this.terrainDepth * 0.6 
    // );
    threeObject.position.set(0,50,0);

    const mass = radius * 500;
    const localInertia = new Ammo.btVector3( 0, 0, 0 );
    shape.calculateLocalInertia( mass, localInertia );
    const transform = new Ammo.btTransform();
    transform.setIdentity();
    const pos = threeObject.position;
    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    const motionState = new Ammo.btDefaultMotionState( transform );
    const rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, shape, localInertia );
    const body = new Ammo.btRigidBody( rbInfo );

    threeObject.userData.physicsBody = body;

    threeObject.receiveShadow = true;
    threeObject.castShadow = true;

    this.scene.add( threeObject );
    dynamicObjects.push( threeObject );

    this.physicsWorld.addRigidBody( body );

  }

  updatePhysics( deltaTime ) {

    this.physicsWorld.stepSimulation( deltaTime, 10 );

    // Update objects
    for ( let i = 0, il = dynamicObjects.length; i < il; i++ ) {
      const objThree = dynamicObjects[ i ];
      const objPhys = objThree.userData.physicsBody;
      const ms = objPhys.getMotionState();
      if ( ms ) {

        ms.getWorldTransform( transformAux1 );
        const p = transformAux1.getOrigin();
        const q = transformAux1.getRotation();
        objThree.position.set( p.x(), p.y(), p.z() );
        objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );

      }
    }
  }

  createObjectMaterial() {
    const c = Math.floor( Math.random() * ( 1 << 24 ) );
    return new THREE.MeshPhongMaterial( { color: c } );
  }


}
