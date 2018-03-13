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
import ShaderMaterial  from './helpers/ShaderMaterial';
import { promisifyLoader, klein, rand } from './helpers/helpers';
import Snow from './helpers/snow';
import Mesh from './helpers/Mesh';

// Model
import ModelWithTextures from './model/modelWithTextures';
import Texture from './model/texture';
import Model from './model/model';


// Managers
import Interaction from './managers/interaction';
import DatGUI from './managers/datGUI';

// data
import Config from './../config';

// stats
import rStats from '@jpweeks/rstats';
import { freemem } from 'os';
// -- End of imports


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

    // Create and place lights in scene
    const lights = ['ambient', 'directional', 'point', 'hemi'];
    for (let i = 0; i < lights.length; i++) {
      this.light.place(lights[i]);
    }

    this.createStats();
    const texturesAndFiles = this.loadTexturesAndFiles();
    this.createWorld(texturesAndFiles);

  }

  loadTexturesAndFiles() {
    const FilePromiseLoader = promisifyLoader(new THREE.FileLoader())

    const vertexShader = FilePromiseLoader.load('./assets/meshphong_vert.glsl');
    const fragmentShader = FilePromiseLoader.load('./assets/meshphong_frag.glsl');

    const TexturePromiseLoader = promisifyLoader(new THREE.TextureLoader());

    const diffuseMap = TexturePromiseLoader.load( './assets/textures/rockwall/rockwall-diffuse.jpg' );
    const bumpMap = TexturePromiseLoader.load( './assets/textures/rockwall/rockwall-AO.jpg' );
    const normalMap = TexturePromiseLoader.load( './assets/textures/rockwall/rockwall-normal.jpg' );
    const snowNormalMap = TexturePromiseLoader.load( './assets/textures/snow-normal.jpg' );

    this.texturesAndFiles = [diffuseMap, bumpMap, normalMap, snowNormalMap, vertexShader, fragmentShader];
    return this.texturesAndFiles;
  }

  createWorld(texturesAndFiles) {
    Promise.all(texturesAndFiles)
    .then(([diffuseMap, bumpMap, normalMap, snowNormalMap, vertexShader,fragmentShader]) => {

      const snowShaderMat = new ShaderMaterial({ 
        maps: { diffuseMap, bumpMap, normalMap, snowNormalMap }, 
        shaders: { vertexShader, fragmentShader }
      });

      this.sphereGeo = new THREE.SphereBufferGeometry(20,20,10);
      const mesh = new THREE.Mesh(this.sphereGeo, snowShaderMat)
      mesh.castShadow = true;
      this.scene.add(mesh);

      var helper = new THREE.VertexNormalsHelper( mesh, 2, 0x00ff00, 1 );
      this.scene.add(helper);

      const box = new Mesh({ 
        type: 'BoxBufferGeometry', 
        params: [40,40,40], 
        position: [-50, 0, -70],
        material: snowShaderMat 
      });

      this.scene.add(box)

      const torus = new Mesh({ 
        type: 'TorusKnotBufferGeometry', 
        params: [12, 6, 80, 16 ], 
        position: [50,5,0],
        material: snowShaderMat 
      });

      this.scene.add(torus);

      const parametric = new Mesh({ 
        type: 'ParametricBufferGeometry', 
        params: [ klein, 25, 25 ],
        geoRotate: [0.4,0,-0.3],
        position: [-50,0,0],
        scale: [3,3,3],
        material: snowShaderMat 
      });

      this.scene.add(parametric)

      const rock = new Mesh({ 
        type: 'JSON',
        url: './assets/models/rock.json',
        position: [0,0,-50],
        scale: [3,3,3],
        material: snowShaderMat 
      });

      this.scene.add(rock)

      // const rock = new THREE.JSONLoader().load('./assets/models/rock.json', geometry => {
      //   console.log(geometry)
      //   const rock = new THREE.Mesh(geometry, snowShaderMat);
      //   rock.scale.setScalar(3)
      //   rock.position.set(0,0,-50)
      //   rock.castShadow = true;
      //   this.scene.add(rock)
      // })

      const ground = new THREE.PlaneBufferGeometry(150, 150, 10, 10);
      const groundMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        emissive: 0x000022,
      })
      const groundMesh = new THREE.Mesh(ground, groundMaterial);
      groundMesh.position.set(0,-20,0);
      groundMesh.rotation.set(-Math.PI / 2, 0, 0);
      groundMesh.receiveShadow = true;
      this.scene.add(groundMesh);


//////////////////---------------------------------
      //const texture = new THREE.TextureLoader().load( './assets/textures/rock-diffuse.jpg' );
      this.snow = new Snow(this.scene);

      this.animate();

    })
  }
    
  createStats() {
    //Set up rStats if dev environment
    if(Config.isDev) {
      this.rS = new rStats({
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
      });
    }
  }


  animate() {
    const rS = this.rS;

    // Render rStats if Dev
    if (Config.isDev) {
      rS('frame').start();
      //glS.start();

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

    const elapsedTime = this.clock.getElapsedTime();

    this.snow.update(delta);

    TWEEN.update();
    this.controls.threeControls.update();

    // RAF
    requestAnimationFrame(this.animate.bind(this)); // Bind the main class instead of window object
  }
}