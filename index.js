/**
 * @file index.js
 * @description Entry point for React Native Web
 */

import { AppRegistry } from "react-native";
import App from "./App";

/**
 * Polyfill for passive event listeners to prevent wheel event warnings
 * This fixes the VirtualizedList warning about non-passive wheel events
 */
if (typeof window !== "undefined") {
  // Store original addEventListener
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  
  // Override addEventListener to make wheel events passive by default
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    if (type === 'wheel' || type === 'mousewheel' || type === 'touchstart' || type === 'touchmove') {
      // If options is boolean (legacy), convert to object
      if (typeof options === 'boolean') {
        options = { capture: options, passive: true };
      } else if (typeof options === 'object' && options !== null) {
        // If options is object but passive is not specified, set it to true
        options = { ...options, passive: options.passive !== false };
      } else {
        // Default case
        options = { passive: true };
      }
    }
    
    return originalAddEventListener.call(this, type, listener, options);
  };
}

// Register the main component
AppRegistry.registerComponent("main", () => App);

// For web, we need to run the app
if (typeof window !== "undefined") {
  AppRegistry.runApplication("main", {
    rootTag: document.getElementById("root"),
  });
}
