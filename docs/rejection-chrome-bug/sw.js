
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});


/*

importScripts(
  '../repo/index.umd.js',
  'https://cdn.jsdelivr.net/npm/prismjs/prism.js',
  'https://cdn.jsdelivr.net/gh/jcubic/static@master/js/path.js'
);

const app = new wayne.Wayne();

const language_map = {
  js: 'javascript',
  css: 'css'
};

const style = '<link href="https://cdn.jsdelivr.net/npm/prismjs/themes/prism-coy.css" rel="stylesheet"/>';


app.get('*', async function(req, res) {
  const url = new URL(req.url);
  const extension = path.extname(url.pathname).substring(1);
  const language = language_map[extension];
  const accept = req.headers.get('Accept');
  if (language && Prism.languages[language] && accept.match(/text\/html/)) {
    const code = await fetch(req.url).then(res => res.text());
    const grammar = Prism.languages[language];
    const tokens = Prism.tokenize(code, grammar);
    const output = Prism.Token.stringify(tokens, language);
    res.html(`${style}\n<pre><code class="language-${language}">${output}</code></pre>`);
  } else {
    res.fetch(req);
  }
});

/*


app.get('*', async function(req, res) {
  const url = new URL(req.url);
  const extension = path.extname(url.pathname).substring(1);
  const language = language_map[extension];
  const accept = req.headers.get('Accept');
  if (language && Prism.languages[language] && accept.match(/text\/html/)) {
    const code = escape(await fetch(req.url).then(res => res.text()));
    const grammar = Prism.languages[language];
    const tokens = Prism.tokenize(code, grammar);
    const output = Prism.Token.stringify(tokens, language);
    res.html(`${style}\n<pre><code class="language-${language}">${output}</code></pre>`);
  } else {
    res.fetch(req);
  }
});
*/

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

function escape(html) {
  return html.replace(/</g, '&lt;').replace('>', '&gt;');
}
