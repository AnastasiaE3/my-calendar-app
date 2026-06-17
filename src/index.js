import React from 'react'; //Brings in React, Required for JSX to work
import ReactDOM from 'react-dom/client'; //knows how to take components and put them on an actual webpage
import './index.css'; // global CSS file for the whole app.
import App from './App'; // Imports main App.js component 
import reportWebVitals from './reportWebVitals'; // It can track things like how fast your page loads.

const root = ReactDOM.createRoot(document.getElementById('root')); // document.getElementById('root') Goes into your public/index.html file for <div id="root"></div>. It's the container where entire React app will live.
root.render(
  <React.StrictMode>
    <App /> 
  </React.StrictMode> //It runs extra checks and warns about potential problems in the code
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(); // for performance tracking, not using it now.
