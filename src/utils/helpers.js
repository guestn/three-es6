// Provides simple static functions that are used multiple times in the app

export const throttle = (fn, threshhold, scope) => {
  threshhold || (threshhold = 250);
  let last, deferTimer;

  return function() {
    const context = scope || this;

    const now  = new Date(),
        args = arguments;

    if(last && now < last + threshhold) {
      clearTimeout(deferTimer);
      deferTimer = setTimeout(function() {
        last = now;
        fn.apply(context, args);
      }, threshhold);
    }
    else {
      last = now;
      fn.apply(context, args);
    }
  };
}

export const logProgress = (name = '') => {
  return function(xhr) {
    if(xhr.lengthComputable) {
      const percentComplete = xhr.loaded / xhr.total * 100;

      console.log(`${name} ${Math.round(percentComplete, 2)}% downloaded`);
    }
  }
}

export const logError = (name = '') => {
  return function(xhr) {
    console.error(`${name}: ${xhr}`);
  }
}

export const  handleColorChange = (color) => {
  return (value) => {
    if(typeof value === 'string') {
      value = value.replace('#', '0x');
    }

    color.setHex(value);
  };
}

export const update = (mesh) => {
  this.needsUpdate(mesh.material, mesh.geometry);
}

export const  needsUpdate = (material, geometry) => {
  return function() {
    material.shading = +material.shading; //Ensure number
    material.vertexColors = +material.vertexColors; //Ensure number
    material.side = +material.side; //Ensure number
    material.needsUpdate = true;
    geometry.verticesNeedUpdate = true;
    geometry.normalsNeedUpdate = true;
    geometry.colorsNeedUpdate = true;
  };
}

export const updateTexture = (material, materialKey, textures) => {
  return function(key) {
    material[materialKey] = textures[key];
    material.needsUpdate = true;
  };
}