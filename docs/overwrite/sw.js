importScripts('https://cdn.jsdelivr.net/npm/@jcubic/wayne@latest/index.umd.min.js');

const app = new wayne.Wayne();

// intercept everything and patch HTML requests
app.get('*', async (req, res) => {
  const _res = await fetch(req);
  const type = _res.headers.get('Content-Type');
  let response;
  if (type.match(/text\/html/i)) {
      const html = await _res.text();
      response = html.replace(/<\/body>/, '<p>Patched by Wayne<p></body>');
  } else {
      response = await _res.arrayBuffer();
  }
  res.send(response, { type });
});

// take control of uncontrolled clients on first load
// ref: https://web.dev/service-worker-lifecycle/#clientsclaim
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
