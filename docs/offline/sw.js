importScripts('https://cdn.jsdelivr.net/npm/@jcubic/wayne/index.umd.min.js');

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
        const _res = await fetch(req.url);
        const type = _res.headers.get('Content-Type') ?? 'application/octet-stream';
        res.send(await _res.arrayBuffer(), { type });
    }
});

app.get('*', async (req, res) => {
    if (navigator.onLine) {
        const path = '.' + req.params[0];
        const _res = await fetch(path);
        const type = _res.headers.get('Content-Type') ?? 'application/octet-stream';
        res.send(await _res.arrayBuffer(), { type });
    } else {
        res.html(`<!DOCTYPE HTML><html><body><h1>You're offline</h1></body></html>`);
    }
});

// take control of uncontrolled clients on first load
// ref: https://web.dev/service-worker-lifecycle/#clientsclaim
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
