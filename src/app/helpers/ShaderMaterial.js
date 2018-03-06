import * as THREE from 'three';
import Config from '../../config';
//import glsl from 'glslify';
//const glsl =  require('glslify')
//import meshphong_frag from './meshphong_frag.glsl';
// import Config from '../../config';

export default class ShaderMaterial {
  constructor() {

    const loadTextureAsync  = (url) => {
      return new Promise ((resolve, reject) => {
    
        const onLoad = (texture) => resolve (texture)
        const onError = (event) => reject (event)
    
        new THREE.TextureLoader().load(url, onLoad, onError)
      })
    }
   //f console.log(new THREE.TextureLoader().load('./assets/textures/uvGrid.jpg'))
    new THREE.TextureLoader().load('./assets/textures/uvGrid.jpg', map => {

    //     console.log(THREE.ShaderLib['phong'])
    //     map.wrapS = map.wrapT = THREE.RepeatWrapping;
    //     map.mapping = THREE.UVMapping
      //let meshphong_frag;
      //const x = new THREE.FileLoader().load('./assets/meshphong_frag.glsl', meshphong_frag => {
       // console.log(data)
        //meshphong_frag = data;
      //})
        //console.log(map)
        //loadTextureAsync('./assets/textures/uvGrid.jpg').then(map => {

          console.log({map})

          const shaderMaterial = new THREE.ShaderMaterial({
          //uniforms,
              uniforms: THREE.UniformsUtils.merge([
                THREE.ShaderLib.phong.uniforms,
              // customUniforms,
                { diffuse: { value: new THREE.Color(0xffff00) } },
                //{ emissive: { value: new THREE.Color(0xff5500) } },
                { shininess: { value: 100 } },


                { map: { type: 't', value: null } },
                { offsetRepeat: { value: new THREE.Vector4(0,0,4,4) } },

              ]),
              vertexShader: THREE.ShaderLib['phong'].vertexShader,
              fragmentShader: THREE.ShaderLib['phong'].fragmentShader,//,//new THREE.FileLoader().load('./assets/meshphong_frag.glsl'),//THREE.ShaderLib['phong'].fragmentShader,
              side: THREE.DoubleSide,
              lights: true,
              needsUpdate: true,
    
              //defines: { USE_MAP: true }
          });

          shaderMaterial.uniforms['map'].value = map

        //console.log(THREE.ShaderLib.phong.uniforms)
        console.log(THREE.ShaderLib['phong'].vertexShader)
        console.log(shaderMaterial)
        shaderMaterial.needsUpdate = true;
        Config.isLoaded = true;
        return shaderMaterial;
    })
   
  }
}
