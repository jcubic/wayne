importScripts(
    'https://cdn.jsdelivr.net/npm/@jcubic/wayne/index.umd.js'
);

const app = new wayne.Wayne();

app.use(async (req, res, next) => {
    const url = new URL(req.url);

    const cache = await get_cache();
    const cache_response = await cache.match(req);

    if (cache_response) {
        if (navigator.onLine) {
            const net_response = await fetch(req);
            cache.put(req, net_response.clone());
            res.respond(net_response);
        } else {
            res.respond(cache_response);
        }
    } else {
       next();
    }
});

app.get('/foo', (req, res) => {
   res.text(`HELLO ${navigator.onLine ? 'online' : 'offline'}`);
});

const cache_url = [
  '/wayne/pwa/',
  '/wayne/pwa/style.css'
];

self.addEventListener('install', (event) => {
   event.waitUntil(cache_all());
});

function get_cache() {
    return caches.open('pwa-assets');
}

async function cache_all() {
    const cache = await get_cache();
    return cache.addAll(cache_url);
}

self.addEventListener('update', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});
