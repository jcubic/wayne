importScripts(
    'https://cdn.jsdelivr.net/npm/@jcubic/wayne/index.umd.js',
    'https://cdn.jsdelivr.net/npm/idb-keyval@6/dist/umd.js'
);

const app = new wayne.Wayne();

async function is_valid_request(url) {
    if (is_chrome_extension(url)) {
        return true;
    }

    const valid_hosts = (await idbKeyval.get('__hosts__')) ?? [];
    const host = new URL(url).host;

    return valid_hosts.includes(host);
}

function is_chrome_extension(url) {
  return url.match(/chrome-extension:/);
}

const html_404 = `<!DOCTYPE HTML>
<html>
<body>
  <h1>This request is blocked</h1>
</body>
</html>`;

app.get(`https://github.com/{user}/{repo}`, (req, res) => {
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/418
  res.text('Invalid', { status: 418 });
});

app.use(async (req, res, next) => {
    const url = new URL(req.url);
    if (url.origin === location.origin) {
        // all local URLs should be handled normaly by Wayne
        next();
    } else {
        if (await is_valid_request(req.url)) {
          res.fetch(req);
        } else if (url.host === 'github.com') {
          // if we want to make Wayne handle this specific URLs we need
          // to create an exception, by calling next
          next();
        } else {
          res.html(html_404, { status: 403 });
        }
    }
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});