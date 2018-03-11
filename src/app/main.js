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
    const textures = this.loadTextures();
    this.createWorld(textures);

  }

  loadTextures() {
    const fileLoader = new THREE.FileLoader();
    fileLoader.load('./assets/meshphong_frag.glsl', data => this.frag = data);
    fileLoader.load('./assets/meshphong_vert.glsl', data => this.vert = data);

    //fileLoader.load('./assets/phong_full_frag.glsl', data => frag = data);
    //fileLoader.load('./assets/phong_full_vert.glsl', data => vert = data);

    const TexturePromiseLoader = promisifyLoader(new THREE.TextureLoader());

    const diffuseMap = TexturePromiseLoader.load( './assets/textures/rockwall/rockwall-diffuse.jpg' );
    const bumpMap = TexturePromiseLoader.load( './assets/textures/rockwall/rockwall-AO.jpg' );
    const normalMap = TexturePromiseLoader.load( './assets/textures/rockwall/rockwall-normal.jpg' );
    const snowNormalMap = TexturePromiseLoader.load( './assets/textures/snow-normal.jpg' );

    this.textures = [diffuseMap, bumpMap, normalMap, snowNormalMap];
    return this.textures;
  }

  createWorld(textures) {
    Promise.all(textures)
    .then(([diffuseMap, bumpMap, normalMap, snowNormalMap]) => {

      const shaderMaterial = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.merge([
          THREE.ShaderLib.phong.uniforms,

          { diffuse: { value: new THREE.Color(0xffffff) } },
          //{ emissive: { value: new THREE.Color(0xff5500) } },
          { shininess: { value: 50 } },
          { bumpMap: { value: null }},
          { bumpScale: { value: 10 }},
          { normalMap: { value: null }},
          { normalScale: { value: new THREE.Vector3( 2, 2 ) }},
          { snowNormalMap: { value: null }},
          { snowNormalScale: { value: new THREE.Vector3( 0.25, 0.25 ) }},
          { map: { value: null } },
          { uvTransform: { value: null } },
        ]),
        vertexShader: this.vert,//THREE.ShaderLib['lambert'].vertexShader,
        fragmentShader: this.frag,//THREE.ShaderLib['lambert'].fragmentShader,//,//new THREE.FileLoader().load('./assets/meshphong_frag.glsl'),//THREE.ShaderLib['phong'].fragmentShader,
        side: THREE.DoubleSide,
        lights: true,
        defines: { 
          USE_MAP: true, 
          USE_BUMPMAP: true, 
          USE_NORMALMAP: true 
        },
        extensions: {
          derivatives: true,
        },
      });

      const repeat = 1;

      shaderMaterial.uniforms['map'].value = diffuseMap;
      shaderMaterial.uniforms['bumpMap'].value = bumpMap ;
      shaderMaterial.uniforms['normalMap'].value = normalMap ;
      shaderMaterial.uniforms['snowNormalMap'].value = snowNormalMap ;
      shaderMaterial.uniforms['uvTransform'].value = new THREE.Matrix3().set(repeat, 0, 0, 0, repeat, 0, 0, 0, repeat); 
      shaderMaterial.needsUpdate = true;

      this.sphereGeo = new THREE.SphereBufferGeometry(20,20,10);
      console.log(shaderMaterial)
      const mesh = new THREE.Mesh(this.sphereGeo, shaderMaterial)
      mesh.castShadow = true;
      this.scene.add(mesh);

      var helper = new THREE.VertexNormalsHelper( mesh, 2, 0x00ff00, 1 );
      this.scene.add(helper);

      const boxGeo = new THREE.BoxBufferGeometry(40,40,40);
      const boxMesh = new THREE.Mesh(boxGeo, shaderMaterial);
      boxMesh.position.set(-50,0,-70)
      this.scene.add(boxMesh);
      var helper2 = new THREE.VertexNormalsHelper( boxMesh, 2, 0x00ff00, 1 );
      this.scene.add(helper2);

      const torusGeo = new THREE.TorusKnotBufferGeometry( 12, 6, 80, 16 );
      const torusKnot = new THREE.Mesh( torusGeo, shaderMaterial );
      torusKnot.position.set(50,5,0)
      torusKnot.castShadow = true;
      this.scene.add( torusKnot );
      var helper3 = new THREE.VertexNormalsHelper( torusKnot, 2, 0x00ff00, 1 );
      this.scene.add(helper3);

      console.log({helper3})

      var geometry = new THREE.ParametricBufferGeometry( klein, 25, 25 );
      geometry.rotateX(0.4).rotateZ(-0.3);
      var cube = new THREE.Mesh( geometry, shaderMaterial );
      cube.castShadow = true;
      cube.scale.setScalar(3)
      cube.position.set(-50,0,0)

      this.scene.add( cube )

      const rock = new THREE.JSONLoader().load('./assets/models/rock.json', geometry => {
        console.log(geometry)
        const rock = new THREE.Mesh(geometry, shaderMaterial);
        rock.scale.setScalar(3)
        rock.position.set(0,0,-50)
        rock.castShadow = true;
        this.scene.add(rock)
      })

      this.geometry = new Geometry(this.scene);
      this.geometry.make('plane')(150, 150, 10, 10);
      this.geometry.place([0, -20, 0], [Math.PI / 2, 0, 0]);


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