importScripts(
    'https://cdn.jsdelivr.net/npm/@jcubic/wayne/index.umd.min.js'
);

const app = new wayne.Wayne();

app.get('*', (req, res) => {
  const url = new URL(req.url);
  const name = req.url.replace(/.*@/, '');
  if (url.pathname.match(/\+esm/)) {
    res.fetch(`https://cdn.jsdelivr.net${url.pathname}`);
  } else if (url.pathname.match(/@/)) {
     if (name.match(/css/)) {
        res.fetch(`https://cdn.jsdelivr.net/npm/${name}`);
     } else {
        res.fetch(`https://esm.run/${name}`);
     }
  } else {
     res.fetch(req);
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
