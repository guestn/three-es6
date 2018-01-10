const ALIAS = {
  'left'		: 37,
  'up'		  : 38,
  'right'		: 39,
  'down'		: 40,
  'space'		: 32,
  'tab'		  : 9,
  'escape'	: 27
};

export default class Keyboard {
  constructor(domElement) {
    this.domElement = domElement || document;
    this.keyCodes = {};

    // bind keyEvents
    this.domElement.addEventListener('keydown', (e) => this.onKeyChange(e), false);
    this.domElement.addEventListener('keyup', (e) => this.onKeyChange(e), false);

    // bind window blur
    window.addEventListener('blur', () => this.onBlur, false);
  }

  destroy() {
    this.domElement.removeEventListener('keydown', (e) => this.onKeyChange(e), false);
    this.domElement.removeEventListener('keyup', (e) => this.onKeyChange(e), false);

    // unbind window blur event
    window.removeEventListener('blur', () => this.onBlur, false);
  }

  onBlur() {
    for(const prop in this.keyCodes)
      this.keyCodes[prop] = false;
  }

  onKeyChange(e) {
    // log to debug
    //console.log('onKeyChange', event, event.keyCode, event.shiftKey, event.ctrlKey, event.altKey, event.metaKey)

    // update this.keyCodes
    const keyCode = e.keyCode;
    this.keyCodes[keyCode] = e.type === 'keydown';
  }

  pressed(keyDesc) {
    const keys = keyDesc.split('+');
    for(let i = 0; i < keys.length; i++) {
      const key = keys[i];
      let pressed = false;
      if(Object.keys(ALIAS).indexOf(key) !== -1) {
        pressed = this.keyCodes[ALIAS[key]];
      } else {
        pressed = this.keyCodes[key.toUpperCase().charCodeAt(0)];
      }
      if(!pressed)
        return false;
    }

    return true;
  }

  eventMatches(e, keyDesc) {
    const aliases = ALIAS;
    const aliasKeys = Object.keys(aliases);
    const keys = keyDesc.split('+');
    // log to debug
    // console.log('eventMatches', event, event.keyCode, event.shiftKey, event.ctrlKey, event.altKey, event.metaKey)
    for(let i = 0; i < keys.length; i++) {
      const key = keys[i];
      let pressed = false;
      if(key === 'shift') {
        pressed = e.shiftKey ? true : false;
      } else if(key === 'ctrl') {
        pressed = e.ctrlKey ? true : false;
      } else if(key === 'alt') {
        pressed = e.altKey ? true : false;
      } else if(key === 'meta') {
        pressed = e.metaKey ? true : false;
      } else if(aliasKeys.indexOf(key) !== -1) {
        pressed = e.keyCode === aliases[key];
      } else if(e.keyCode === key.toUpperCase().charCodeAt(0)) {
        pressed = true;
      }
      if(!pressed)
        return false;
    }

    return true;
  }
}
