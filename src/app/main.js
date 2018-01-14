// Global imports -
import * as THREE from 'three';
import TWEEN from 'tween.js';

// Local imports -
// Components
import Renderer from './components/renderer';
import Camera from './components/camera';
import Light from './components/light';
import Controls from './components/controls';

// Helpers
import Geometry from './helpers/geometry';
import ImprovedNoise from './helpers/improvedNoise';
import Material from './helpers/material';

// Model
import ModelWithTextures from './model/modelWithTextures';
import Texture from './model/texture';
import Model from './model/model';

// Managers
import Interaction from './managers/interaction';
import DatGUI from './managers/datGUI';

// data
import Config from './../config';

// physics
import * as OIMO from 'oimo';

// stats
import rStats from '@jpweeks/rstats';
// -- End of imports
// Local vars for rStats
let rS, bS, glS, tS;


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

    this.bodys = null;
    this.infos;
    this.type=1;
    this.meshs = [];
    this.grounds = [];
    this.terrain;

    // Create and place lights in scene
    const lights = ['ambient', 'directional'];
    for (let i = 0; i < lights.length; i++) {
      this.light.place(lights[i]);
    }

    // Create and place geo in scene
    // this.geometry = new Geometry(this.scene);
    // this.geometry.make('plane')(150, 150, 10, 10);
    // this.geometry.place([0, -20, 0], [Math.PI / 2, 0, 0]);

    // this.geometry = new Geometry(this.scene);
    // this.geometry.make('sphere')(20, 20, 10, 10);
    // this.geometry.place([0, 0, 40], [Math.PI / 2, 0, 0]);

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

     

    document.addEventListener('DOMContentLoaded', () => {
      this.initOimoPhysics();

      this.animate();

        // physics

    }, false);

    console.log(this.camera.threeCamera)


    // Start render which does not wait for model fully loaded
    //this.animate();
  }


  animate() {
    // Render rStats if Dev
    if (Config.isDev) {
      rS('frame').start();
      //glS.start();

      rS('rAF').tick();
      rS('FPS').frame();

      rS('render').start();
    }

    // update the OIMO physics
    this.updateOimoPhysics();

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
    TWEEN.update();
    this.controls.threeControls.update();

    // RAF
    requestAnimationFrame(this.animate.bind(this)); // Bind the main class instead of window object

    this.updateOimoPhysics;


    //console.log(this.meshs[0].position.x)
    this.camera.threeCamera.position.set(this.meshs[0].position.x +50,this.meshs[0].position.y+10,this.meshs[0].position.z)
    this.camera.threeCamera.lookAt(this.meshs[0].position.x,this.meshs[0].position.y,this.meshs[0].position.z)

    //console.log(this.camera.threeCamera.position)
  }

    //----------------------------------
    //  OIMO PHYSICS
    //----------------------------------


  initOimoPhysics() {

    // world setting:( TimeStep, BroadPhaseType, Iterations )
    // BroadPhaseType can be 
    // 1 : BruteForce
    // 2 : Sweep and prune , the default 
    // 3 : dynamic bounding volume tree
  
    const world = new OIMO.World({info:true, worldscale:100} );
    this.world = world;
    this.gravity(-1);

    this.populate(1);
    //setInterval(this.updateOimoPhysics, 1000/60);
  
  }
  
  gravity(g){
    //nG = document.getElementById("gravity").value
    this.world.gravity = new OIMO.Vec3(0, g, 0);
  }
  clearMesh() {
    var i = this.meshs.length;
    while (i--) this.scene.remove(this.meshs[ i ]);
    i = this.grounds.length;
    while (i--) this.scene.remove(this.grounds[ i ]);
    if(this.terrain){
        this.scene.remove(this.terrain);
        this.terrain.geometry.dispose();
    }
    this.grounds = [];
    this.meshs = [];
  }

  populate(n) {

      this.paddel = new THREE.Object3D();
      this.scene.add( this.paddel );

      const buffgeoSphere = new THREE.BufferGeometry();
      buffgeoSphere.fromGeometry( new THREE.SphereGeometry( 1 , 20, 10 ) );
      const matSphere = new Material(0xeeeeee).standard;

      const buffgeoBox = new THREE.BufferGeometry();
      buffgeoBox.fromGeometry( new THREE.BoxGeometry( 1, 1, 1 ) );

        
      // The Bit of a collision group
      var group2 = 1 << 1;  // 00000000 00000000 00000000 00000010
      var all = 0xffffffff; // 11111111 11111111 11111111 11111111
      var max = 1;//document.getElementById("MaxNumber").value;
      this.type = 3;
      // reset old
      //clearMesh();
      this.world.clear();
      this.bodys = [];
      //this.initTerrain();
      this.initPlaneTerrain()
      // Is all the physics setting for rigidbody
      var config = [
          1, // The density of the shape.
          0.1, // The coefficient of friction of the shape.
          0.2, // The coefficient of restitution of the shape.
          1, // The bits of the collision groups to which the shape belongs.
          all // The bits of the collision groups with which the shape collides.
      ];
      // now add object
      var x, y, z, w, h, d;
      var t;
      var i = max;
      while (i--){

        x = -0;// + Math.random()*200;;
        z = -0;// + Math.random()*200;
        y = 100;// + Math.random()*1000;
        w = 10 + Math.random()*10;
        h = 10 + Math.random()*10;
        d = 10 + Math.random()*10;
        config[4] = all;
        config[3] = group2;
        this.bodys[i] = this.world.add({type:'sphere', size:[w*0.5], pos:[x,y,z], move:true, config:config, name:'sphere'});
        this.meshs[i] = new THREE.Mesh( buffgeoSphere, matSphere );
        this.meshs[i].scale.set( w*0.5, w*0.5, w*0.5 );
        this.meshs[i].castShadow = true;
        this.meshs[i].receiveShadow = true;
        this.scene.add( this.meshs[i] );
      }
  }
    
  updateOimoPhysics() {
    if(this.world == null) return;

    this.world.step();
    let x, y, z;
    var i = this.bodys.length;
    var mesh;
    var body;
    while (i--){
      body = this.bodys[i];
      mesh = this.meshs[i];
      if(!body.sleeping){
        mesh.position.copy(body.getPosition());
        mesh.quaternion.copy(body.getQuaternion());
        if(mesh.position.y<-300){
          x = -0;// + Math.random()*200;
          z = -0;// + Math.random()*200;
          y = 100;//100 + Math.random()*1000;
          body.resetPosition(x,y,z);
        }
      }
    }
  }

  initPlaneTerrain() {
    const ground2 = this.world.add({size:[800, 80, 400], pos:[0,-40,0], rot:[0,0,10],world:this.world});
    const groundGeo = new THREE.PlaneBufferGeometry( 400, 400,  1,1 );
    this.addStaticBox([800, 80, 400], [0,-40,0], [0,0,10]);
    this.addStaticBox([5000, 80, 5000], [0,-100,0], [0,0,0]);

  }

  addStaticBox(size, position, rotation) {
    const geos = {};
    geos['box'] = new THREE.BufferGeometry().fromGeometry( new THREE.BoxGeometry(1,1,1));

    var ToRad = 0.0174532925199432957;
    var mesh = new THREE.Mesh( geos.box, new Material(0xeeee00).standard );
    mesh.scale.set( size[0], size[1], size[2] );
    mesh.position.set( position[0], position[1], position[2] );
    mesh.rotation.set( rotation[0]*ToRad, rotation[1]*ToRad, rotation[2]*ToRad );
    this.scene.add( mesh );
    this.grounds.push(mesh);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  }

  initTerrain(w, h) {
    w = 32 || w;
    h = 32 || h;
    const groundSize = { x: 600, z: 600 }

    const groundGeo = new THREE.PlaneBufferGeometry( groundSize.x, groundSize.z,  w-1, h-1 );
    groundGeo.applyMatrix(new THREE.Matrix4().makeRotationZ( - Math.PI * 0.75 ));
   
    var size = w * h;
    var data = new Float32Array( size );
    var perlin = new ImprovedNoise(), quality = 1, z = Math.random() * 10;
    for ( var j = 0; j < 4; j ++ ) {
        for ( var i = 0; i < size; i ++ ) {
            var x = i % w, y = ~~ ( i / w );
            data[ i ] += (Math.abs( perlin.noise( x / quality, y / quality, z ) * quality *  0.5 ))
        }
        quality *= 5;
    }
    let b, v, m;
    const r = 20;
    const helperSpheres = new THREE.Object3D();
    const helperSphere = new THREE.BufferGeometry();
    helperSphere.fromGeometry( new THREE.SphereGeometry( r , 20, 10 ) );
    const matSphere2 = new Material(0xeeee00).standard;


    const vertices = groundGeo.attributes.position.array;
    for ( var i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3 ) {
        vertices[ j + 1 ] = (data[ i ] * 10)-100;
        let x = vertices[ j ];
        let y = vertices[ j+1 ] - r;
        let z = vertices[ j+2 ];
        b = this.world.add({type:'sphere', size:[r], pos:[x,y,z] })
        helperSpheres[i] = new THREE.Mesh( helperSphere, matSphere2 );
        helperSpheres[i].position.set(x,y,z)
        this.scene.add(helperSpheres[i])


    }

    this.scene.add(helperSpheres)
    
    groundGeo.computeFaceNormals();
    groundGeo.computeVertexNormals();
    const terrain = new THREE.Mesh(groundGeo, new THREE.MeshPhongMaterial ({color: 0x3D4143, shininess:60 }));
    terrain.castShadow = true;
    terrain.receiveShadow = true;
    this.scene.add(terrain);
  }
}


