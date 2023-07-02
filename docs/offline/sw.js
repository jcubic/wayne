importScripts('https://cdn.jsdelivr.net/npm/@jcubic/wayne@latest/index.umd.min.js');

const app = new wayne.Wayne();

// don't intercept requests to other domains using middleware
app.use(async (req, res, next) => {
    const url = new URL(req.url);
    if (url.origin === location.origin) {
        // use normal route
        next();
    } else if (!navigator.onLine) {
        // any file to different domain when user is offline is blank
        res.send('', 'text/plain');
    } else {
        // normal HTTP request to the server
        res.fetch(req.url);
    }
});

app.get('*', async (req, res) => {
    if (navigator.onLine) {
        // dot it used so it work when worker is in a directory
        const path = req.params[0];
        res.fetch('.' + path);
    } else {
        res.html(`<!DOCTYPE HTML><html><body><h1>You're offline</h1></body></html>`);
    }
});

// take control of uncontrolled clients on first load
// ref: https://web.dev/service-worker-lifecycle/#clientsclaim
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
