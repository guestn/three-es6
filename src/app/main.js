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
import { promisifyLoader, klein } from './helpers/helpers';
import Mesh from './helpers/Mesh';

// Materials
import ShaderMaterial from './materials/ShaderMaterial';

// Managers
// import Interaction from './managers/interaction';
// import DatGUI from './managers/datGUI';

// data
import Config from './../config';

// stats
import rStats from '@jpweeks/rstats';
// import { freemem } from 'os';
// -- End of imports


export default class Main {
  constructor(container) {
    this.container = container;
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(Config.fog.color, Config.fog.near);

    if (window.devicePixelRatio) {
      Config.dpr = window.devicePixelRatio;
    }

    this.renderer = new Renderer(this.scene, container);

    this.camera = new Camera(this.renderer.threeRenderer, container);
    this.controls = new Controls(this.camera.threeCamera, container);
    this.light = new Light(this.scene);

    // Create and place lights in scene
    const lights = ['ambient', 'directional', 'point', 'hemi'];
    lights.forEach(light => (
      this.light.place(light)
    ));

    this.createStats();
    const texturesAndFiles = this.loadTexturesAndFiles();
    this.createMaterials(texturesAndFiles)
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

  createMaterials(texturesAndFiles) {
    Promise.all(texturesAndFiles)
    .then(([diffuseMap, bumpMap, normalMap, snowNormalMap, vertexShader, fragmentShader]) => {

      const snowShaderMat = new ShaderMaterial({ 
        maps: { diffuseMap, bumpMap, normalMap, snowNormalMap }, 
        shaders: { vertexShader, fragmentShader }
      });

      const groundMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        emissive: 0x000022,
      })

      const materials = { snowShaderMat, groundMaterial }
      return this.createWorld(materials);
    });
  }

  createWorld(materials) {

    const sphere = new Mesh({ 
      type: 'SphereBufferGeometry', 
      params: [20,20,10], 
      material: materials.snowShaderMat,
      scene: this.scene,
      name: 'immasphere',
    });

    console.log(sphere.getMesh())
    
    const box = new Mesh({ 
      type: 'BoxBufferGeometry', 
      params: [40,40,40], 
      position: [-50, 0, -70],
      material: materials.snowShaderMat,
      scene: this.scene,
    });

    const torus = new Mesh({ 
      type: 'TorusKnotBufferGeometry', 
      params: [12, 6, 80, 16 ], 
      position: [50,5,0],
      material: materials.snowShaderMat,
      scene: this.scene,
    });

    const parametric = new Mesh({ 
      type: 'ParametricBufferGeometry', 
      params: [ klein, 25, 25 ],
      geoRotate: [0.4,0,-0.3],
      position: [-50,0,0],
      scale: [3,3,3],
      material: materials.snowShaderMat,
      scene: this.scene,
    });

    const rock = new Mesh({ 
      type: 'JSON',
      url: './assets/models/rock.json',
      position: [0,0,-50],
      scale: [3,3,3],
      material: materials.snowShaderMat,
      scene: this.scene,
    });

    const ground = new Mesh({ 
      type: 'PlaneBufferGeometry', 
      params: [ 150, 150, 10, 10 ],
      rotation: [-Math.PI/2, 0, 0],
      position: [0,-20,0],
      shadows: { receive: true, cast: false },
      material: materials.groundMaterial,
      scene: this.scene,
    });

    // finally: //
    this.animate();

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
    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();
    const rS = this.rS;

    this.updateStatsStart(rS)
    this.renderer.render(this.scene, this.camera.threeCamera);
    this.updateStatsEnd(rS)
    
    TWEEN.update();
    this.controls.threeControls.update();

    // RAF
    requestAnimationFrame(this.animate.bind(this)); // Bind the main class instead of window object
  }

  updateStatsStart(rS) {
    if (Config.isDev) {
      rS('frame').start();
      //glS.start();

      rS('rAF').tick();
      rS('FPS').frame();

      rS('render').start();
    }
  }
  updateStatsEnd(rS) {
    if (Config.isDev) {
      rS('render').end(); // render finished
      rS('frame').end(); // frame finished

      // // Local rStats update
      rS('rStats').start();
      rS().update();
      rS('rStats').end();
    }
  }
}