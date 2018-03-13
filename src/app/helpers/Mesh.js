import * as THREE from 'three';
import { promisifyLoader } from './helpers';


export default class Mesh {
  constructor({ 
    type,
    url, 
    params, 
    position = [0,0,0], 
    rotation = [0,0,0], 
    scale = [1,1,1], 
    geoRotate = [0,0,0],
    shadows = true, 
    material 
  }) {
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
    this.geoRotate = geoRotate;
    this.shadows = shadows;
    this.material = material;
    if (type === 'JSON') {
      console.log({url})
      const JSONPromiseLoader = promisifyLoader(new THREE.JSONLoader())
      const geometry = JSONPromiseLoader.load(url)
      .then((geo) => this.orientObject(geo))
      // new THREE.JSONLoader().load(url, geometry => {
      //   console.log('asda',geometry)
      //   this.orientObject(geometry);
      // })
    } else {
      const geometry = new THREE[type](...params);
      return this.orientObject(geometry);
    }
  }
  

  orientObject(geometry) {
    console.log({geometry})
    if (this.geoRotate) {
      geometry.rotateX(this.geoRotate[0])
      geometry.rotateY(this.geoRotate[1])
      geometry.rotateZ(this.geoRotate[2])
    }
    const mesh = new THREE.Mesh( geometry, this.material );
    mesh.position.set(...this.position);
    mesh.rotation.set(...this.rotation);
    mesh.scale.set(...this.scale);
    mesh.castShadow = this.shadows;

    return mesh;
  }
}
