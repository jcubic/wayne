importScripts('https://cdn.jsdelivr.net/gh/jcubic/wayne@master/index.js');

const app = new wayne.Wayne();

const users = {
  1: 'Jakub T. Jankiewicz',
  2: 'John Doe',
  3: 'Jane Doe'
};

app.get('/user/{id}', function(req, res) {
  const user = users[req.params.id];
  if (user) {
    res.json({result: user});
  } else {
    res.json({error: 'User Not Found'});
  }
});

app.get('/error', function(req, res) {
  nonExisting();
});

app.get('/__fs__/*/name/*', function(req, res) {
  res.text(req.params[0] + ' ' + req.params[1]);
});

app.get('/download', async function(req, res) {
  const text = await fetch('http://localhost/~kuba/jcubic/wayne/repo/docs/hacker.txt')
        .then(res => res.text());
  const headers = {
    'Content-Disposition': 'attachment; filename="hacker.txt"'
  };
  res.text(text, { headers });
});

if (app.use) {
  app.use((err, req, res, next) => {
    const sep = '-'.repeat(80);
    res.text([sep, ':: Wayne', sep, `Error: ${err.message}`, err.stack].join('\n'));
  });
}
