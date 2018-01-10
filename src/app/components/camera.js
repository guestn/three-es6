import * as THREE from 'three';

import Config from '../../config';

// Class that creates and updates the main camera
export default class Camera {
  constructor(renderer) {
    const width = Config.container.width;
    const height = Config.container.height;

    // Create and position a Perspective Camera

    this.threeCamera = new THREE.PerspectiveCamera(Config.camera.fov, width / height, Config.camera.near, Config.camera.far);
    this.threeCamera.position.set(Config.camera.posX, Config.camera.posY, Config.camera.posZ);

    // Initial sizing
    this.updateSize(renderer);

    // Listeners
    window.addEventListener('resize', () => this.updateSize(renderer), false);
  }

  updateSize(renderer) {
    // Multiply by dpr in case it is retina device
    this.threeCamera.aspect = Config.container.width * Config.dpr / Config.container.height * Config.dpr;
    // Always call updateProjectionMatrix on camera change
    this.threeCamera.updateProjectionMatrix();
  }
}
