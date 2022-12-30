importScripts('https://cdn.jsdelivr.net/gh/jcubic/wayne/index.umd.js');

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

app.get('/redirect', function(req, res) {
  res.redirect(301, '/message');
});

app.get('/message', function(req, res) {
  res.text('Lorem Ipsum');
});

app.get('/external', function(req, res) {
  res.redirect('https://api.buildable.dev/@62d55492951509001abc363e/live/lorem-ipsum');
});

app.get('/sse', function(req, res) {
  const stream = res.sse({
    onClose() {
      clearInterval(timerId);
    }
  });
  var timerId = setInterval(function() {
    const now = (new Date()).toString();
    stream.send({ data: now });
  }, 1000);
});

app.get('/__fs__/*/name/*', function(req, res) {
  res.text(req.params[0] + ' ' + req.params[1]);
});

app.get('/download', async function(req, res) {
  const text = await fetch('./hacker.txt')
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

if (app._timeout) {
  let id = 0;
  const channel = new BroadcastChannel('rpc');

  app.get('/rpc', function(req, res) {
    const current_id = ++id;
    const payload = { id: current_id, method: 'ping', args: [] };
    channel.addEventListener('message', function handler(message) {
      if (current_id == message.data.id) {
        res.text(message.data.result);
        channel.removeEventListener('message', handler);
      }
    });
    channel.postMessage(payload);
  });
}
