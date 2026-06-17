const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    //instanceof checks what type something is. 
    // This is a safety check, it makes sure someone passed a real function
    // and not accidentally a number or a string. 
    // If both checks pass, it continues. If not, it does nothing.


    //is a dynamic import, it only loads the web-vitals package 
    // when this function is actually called. 
    // This keeps app faster because it doesn't load unnecessary code upfront.
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry); // Do things jump around on screen while loading?
      getFID(onPerfEntry); // How long until the page responds to your first click?
      getFCP(onPerfEntry); // How long until something first appears on screen?
      getLCP(onPerfEntry); // How long until the main content is visible?
      getTTFB(onPerfEntry); // How long until the server starts sending data?
    });
  }
};

export default reportWebVitals; 
//Makes the function available to index.js which imports and calls it