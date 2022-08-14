import Application from './core/Application.js';

window.addEventListener('DOMContentLoaded', () => {
    const app = new Application();

    app.init();
});

// register service worker

if("serviceWorker" in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/serviceWorker.js')
            .then(() => console.log("Service Worker Registered"))
            .catch(e => console.error("Service worker couldn't be registered", e))
    });
}