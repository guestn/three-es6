import './App.css';
//
// class App extends Component {
//   render() {
//     return (
//       <div className="App">
//         <header className="App-header">
//           <h1 className="App-title">3</h1>
//         </header>
//
//       </div>
//     );
//   }
// }

//export default App;


import Config from './config';
import Detector from './utils/detector';
import Main from './app/main';

// Check environment and set the Config helper
// if(__ENV__ == 'dev') {
//   console.log('----- RUNNING IN DEV ENVIRONMENT! -----');
//
//   Config.isDev = true;
// }

export default function App() {
  // Check for webGL capabilities
  if(!Detector.webgl) {
    Detector.addGetWebGLMessage();
  } else {
    const container = document.getElementById('appContainer');
    new Main(container);
  }
}
