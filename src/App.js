import Config from './config';
import Detector from './utils/detector';
import Main from './app/main';

import './App.css';


// Check environment and set the Config helper
if(process.env.NODE_ENV === 'development') {
  console.log('----- RUNNING IN DEV ENVIRONMENT! -----');
  Config.isDev = true;
}

const App = () => {
  // Check for webGL capabilities
  if(!Detector.webgl) {
    Detector.addGetWebGLMessage();
  } else {
    const container = document.getElementById('appContainer');
    container.style.height = 100;
    new Main(container);
  }
}

export default App;
