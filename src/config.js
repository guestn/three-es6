import TWEEN from 'tween.js';

// This object contains the state of the app
export default {
  isDev: false,
  isLoaded: false,
  isTweening: false,
  isRotating: true,
  isMouseMoving: false,
  isMouseOver: false,
  maxAnisotropy: 1,
  dpr: 1,
  easing: TWEEN.Easing.Quadratic.InOut,
  duration: 500,
  renderer: {
    antialias: false,
    alpha: true,
  },
  container: {
    width: window.innerWidth,
    height: window.innerHeight
  },
  models: {
    'teapot': {
      path: './assets/models/teapot-claraio.json',
      scale: 20
    }
  },
  textures: {
    'UV': {
      path: './assets/textures/',
      imageFiles: [
        {name: 'UV', image: 'UV_Grid_Sm.png'}
      ]
    },
    'Noise': {
      path: './assets/textures/',
      imageFiles: [
        {name: 'UV', image: 'seamless-perlin-noise.jpg'}
      ]
    },
  },
  mesh: {
    enableHelper: false,
    wireframe: false,
    translucent: false,
    material: {
      color: 0xffffff,
      emissive: 0xffffff
    }
  },
  fog: {
    color: 0x444444,
    near: 0.0008
  },
  camera: {
    fov: 45,
    near: 2,
    far: 1000,
    aspect: 1,
    posX: 0,
    posY: 30,
    posZ: 40
  },
  controls: {
    autoRotate: false,
    autoRotateSpeed: -0.5,
    rotateSpeed: 0.5,
    zoomSpeed: 0.8,
    minDistance: 200,
    maxDistance: 600,
    minPolarAngle: Math.PI / 5,
    maxPolarAngle: Math.PI / 2,
    minAzimuthAngle: -Infinity,
    maxAzimuthAngle: Infinity,
    enableDamping: true,
    dampingFactor: 0.5,
    enableZoom: true,
    target: {
      x: 0,
      y: 0,
      z: 0
    }
  },
  ambientLight: {
    enabled: false,
    color: 0x141414
  },
  directionalLight: {
    enabled: true,
    color: 0xf0f0f0,
    intensity: 0.4,
    x: -75,
    y: 280,
    z: 150
  },
  shadow: {
    enabled: true,
    helperEnabled: true,
    bias: 0,
    mapWidth: 2048,
    mapHeight: 2048,
    near: 250,
    far: 400,
    top: 100,
    right: 100,
    bottom: -100,
    left: -100
  },
  pointLight: {
    enabled: true,
    color: 0xffffff,
    intensity: 0.34,
    distance: 115,
    x: 0,
    y: 0,
    z: 0
  },
  hemiLight: {
    enabled: true,
    color: 0xc8c8c8,
    groundColor: 0xffffff,
    intensity: 0.55,
    x: 0,
    y: 0,
    z: 0
  }
};
