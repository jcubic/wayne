import { Wayne } from 'https://cdn.jsdelivr.net/gh/jcubic/wayne@master/index.js';

const app = new Wayne();

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

