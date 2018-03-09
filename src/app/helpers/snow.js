import * as THREE from 'three';

const texture = new THREE.ImageLoader().load( 'snowflake1.png' );
		
const numParticles = 10000,
  width = 100,
  height = particleSystemHeight,
  depth = 100,
  parameters = {
    color: 0xFFFFFF,
    height: particleSystemHeight,
    radiusX: 2.5,
    radiusZ: 2.5,
    size: 100,
    scale: 4.0,
    opacity: 0.4,
    speedH: 1.0,
    speedV: 1.0
  };
const systemGeometry = new THREE.Geometry();
const systemMaterial = new THREE.ShaderMaterial({
  uniforms: {
    color:  { type: 'c', value: new THREE.Color( parameters.color ) },
    height: { type: 'f', value: parameters.height },
    elapsedTime: { type: 'f', value: 0 },
    radiusX: { type: 'f', value: parameters.radiusX },
    radiusZ: { type: 'f', value: parameters.radiusZ },
    size: { type: 'f', value: parameters.size },
    scale: { type: 'f', value: parameters.scale },
    opacity: { type: 'f', value: parameters.opacity },
    texture: { type: 't', value: texture },
    speedH: { type: 'f', value: parameters.speedH },
    speedV: { type: 'f', value: parameters.speedV }
  },
  vertexShader: document.getElementById( 'step07_vs' ).textContent,
  fragmentShader: document.getElementById( 'step09_fs' ).textContent,
  blending: THREE.AdditiveBlending,
  transparent: true,
  depthTest: false
});

for( var i = 0; i < numParticles; i++ ) {
  var vertex = new THREE.Vector3(
      rand( width ),
      Math.random() * height,
      rand( depth )
    );

  systemGeometry.vertices.push( vertex );
}

const particleSystem = new THREE.ParticleSystem( systemGeometry, systemMaterial );
particleSystem.position.y = -height/2;

this.scene.add( particleSystem );

clock = new THREE.Clock();