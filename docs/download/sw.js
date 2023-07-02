importScripts('https://cdn.jsdelivr.net/npm/@jcubic/wayne@0.10.0/index.umd.min.js');

const app = new wayne.Wayne();

app.get('/file', async (req, res) => {
    const _res = await fetch('./hack.txt');
    const text = await _res.text();
    res.download(text, { filename: 'jargon-hack.txt' });
});

// take control of uncontrolled clients on first load
// ref: https://web.dev/service-worker-lifecycle/#clientsclaim
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
