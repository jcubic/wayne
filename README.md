<h1 align="center">
  <img src="https://github.com/jcubic/wayne/blob/master/assets/wayne-logo.svg?raw=true"
       alt="Logo of Wayne library - it represent constrution worker helmet and text with the name of the library" />
</h1>

[![npm](https://img.shields.io/badge/npm-0.6.2-blue.svg)](https://www.npmjs.com/package/@jcubic/wayne)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://makeapullrequest.com)

[Service Worker Routing library for in browser HTTP requests](https://github.com/jcubic/wayne/)

It's like Express inside Service Worker.

Most of the time Service Worker is used for caching of HTTP requests and making the app work when there is no internet (mostly for [PWA](https://en.wikipedia.org/wiki/Progressive_web_application)), but in fact you can create completely new responses to requests that never leave the browser. This library make that easier by adding simple API similar to Express.

## Usage

Installation from npm:

```bash
npm install @jcubic/wayne
```

```bash
yarn add @jcubic/wayne
```

Standard way of installing the service worker

```javascript
if ('serviceWorker' in navigator) {
    const scope = location.pathname.replace(/\/[^\/]+$/, '/');
    navigator.serviceWorker.register('sw.js', { scope, type: 'module' })
             .then(function(reg) {
                 reg.addEventListener('updatefound', function() {
                     const installingWorker = reg.installing;
                     console.log('A new service worker is being installed:',
                                 installingWorker);
                 });
                 // registration worked
                 console.log('Registration succeeded. Scope is ' + reg.scope);
             }).catch(function(error) {
                 // registration failed
                 console.log('Registration failed with ' + error);
             });
}
```

If you want to support browsers that don't support ES Modules in Service Worker use this instead:

```javascript
if ('serviceWorker' in navigator) {
    const scope = location.pathname.replace(/\/[^\/]+$/, '/');
    navigator.serviceWorker.register('sw.js', { scope })
             .then(function(reg) {
                 reg.addEventListener('updatefound', function() {
                     const installingWorker = reg.installing;
                     console.log('A new service worker is being installed:',
                                 installingWorker);
                 });
                 // registration worked
                 console.log('Registration succeeded. Scope is ' + reg.scope);
             }).catch(function(error) {
                 // registration failed
                 console.log('Registration failed with ' + error);
             });
}
```

Inside same file you can send [AJAX](https://en.wikipedia.org/wiki/Ajax_(programming)) requests with standard
[fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).

```javascript
function get(url) {
    fetch(url)
      .then(res => res.text())
      .then(text => output.innerHTML = text);
}

input.addEventListener('click', () => {
    get(`./user/${user_id.value}`);
});

error.addEventListener('click', () => {
    get(`./error`);
});
```


Service worker - **sw.js** file

Importing Wayne module:

* when worker created as ES Module

```javascript
import { Wayne } from 'https://cdn.jsdelivr.net/npm/@jcubic/wayne';

const app = new Wayne();
```

* When worker created as normal script

```javascript
importScripts('https://cdn.jsdelivr.net/npm/@jcubic/wayne/index.umd.min.js');

const app = new wayne.Wayne();
```

Using the library

```javascript
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
  // lorem ipsum API
  res.redirect('https://api.buildable.dev/@62d55492951509001abc363e/live/lorem-ipsum');
});
```

### File system middleware

```javascript
import { Wayne, FileSystem } from 'https://cdn.jsdelivr.net/npm/@jcubic/wayne';
import FS from "https://cdn.skypack.dev/@isomorphic-git/lightning-fs";
import mime from "https://cdn.skypack.dev/mime";
import path from "https://cdn.skypack.dev/path-browserify";

const { promises: fs } = new FS("__wayne__");

const app = new Wayne();

app.use(FileSystem({ path, fs, mime, prefix: '__fs__' }));
```

When not using a module the code will be similar. When you access URLS with
prefix `__fs__` like `./__fs__/foo` it will read files from indexedDB file
system named `__wayne__`. See [Lightning-FS](https://github.com/isomorphic-git/lightning-fs) repo on details about the library.

### [RPC](https://en.wikipedia.org/wiki/Remote_procedure_call) mechanism

In Service worker you create generic route that send data to broadcastChannel:

```javascript
let id = 0;
const channel = new BroadcastChannel('rpc');

app.get('/rpc/{name}/*', function(req, res) {
    try {
        const current_id = ++id;
        const args = req.params[0].split('/');
        const payload = { id: current_id, method: req.params.name || 'ping', args };
        channel.addEventListener('message', function handler(message) {
            if (current_id == message.data.id) {
                res.json(message.data.result);
                channel.removeEventListener('message', handler);
            }
        });
        channel.postMessage(payload);
    } catch(e) {
        res.text(e.message);
    }
});
```

and in the main thread you create the other side of the channel and the remote methods:

```javascript

const channel = new BroadcastChannel('rpc');

const methods = {
    ping: function() {
        return 'pong';
    },
    sin: function(x) {
        return Math.sin(x);
    },
    random: function() {
        return Math.random();
    },
    json: function() {
        return fetch('https://api.npoint.io/8c7cc24b3fd405b775ce').then(res => res.json());
    }
};

channel.addEventListener('message', async function handler(message) {
    if (Object.keys(message.data).includes('method', 'id', 'args')) {
        const { method, id, args } = message.data;
        try {
            const result = await methods[method](...args);
            channel.postMessage({id, result});
        } catch(error) {
            channel.postMessage({id, error});
        }
    }
});
```

When you send request `/rpc/ping` you will get response from `methods.ping` function.

```javascript
fetch('./rpc/ping')
  .then(res => res.text())
  .then(text => {
     console.log({ text });
  });
```

With this setup, you can create new functions/methods that will map to HTTP requests.

The demo below uses random request:

```javascript
let index = 0;
const requests = [
    './rpc/ping/',
    './rpc/json/',
    './rpc/random/',
    './rpc/sin/10'
];

rpc.addEventListener('click', () => {
    get(random_request() );
});

function random_request() {
    const next_index = index++ % requests.length;
    return requests[next_index];
}
```

### Server-Sent Events

[Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) is the way to stream data in the browser.
It's native browser implementation of Long Polling. Here is example how to use SSE with Wayne:

**Service Worker**

```javascript
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
```

**Main tread**

```javascript
let see_source;

sse_start.addEventListener('click', () => {
    see_source = new EventSource("./sse");
    see_source.onmessage = event => {
        console.log(event.data);
    };
});

sse_stop.addEventListener('click', () => {
    if (see_source) {
        see_source.close();
        see_source = null;
    }
});
```

## Demo

* [simple demo](https://jcubic.github.io/wayne/demo). 
* Proof of Concept of [ReactJS application inside Service Worker](https://jcubic.github.io/wayne/jsx/public/).
* [Filesystem demo](https://jcubic.github.io/wayne/fs/).

## API reference

Wayne object has those methods that correspond to HTTP methods

* `get`
* `post`
* `put`
* `delete`
* `patch`

each method accepts URL with markers inside curly brackets those markers will be available from **Request.params** object.
Request object is browser native object of a given request see [MDN for details](https://developer.mozilla.org/en-US/docs/Web/API/Request). The only change to the native API is that the object have proeprty **params**.

Here are few most important Request properties:

* `headers` - Headers object to get key/value pairs use `Object.fromEntires(req.headers.entries())`.
* `method` - request method as string.
* `url` - string with full URL.
* `referrer` - HTTP referer.
* `arrayBuffer()` - Returns a promise that resolves with an [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) representation of the request body.
* `blob()` - Returns a promise that resolves with a [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) representation of the request body.
* `formData()` - Returns a promise that resolves with a [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) representation of the request body.
* `json()` - Returns a promise that resolves with the result of parsing the request body as [JSON](https://developer.mozilla.org/en-US/docs/Web/API/Request/json).
* `text()` - Returns a promise that resolves with a text representation of the request body.

**Response** object is instance of `HTTPResponse` those have methods:

* `html()`
* `json()`
* `text()`
* `send()`


each of those methods accepts string as first argument. Second argument are options:

* `headers` - any headers as key value pairs or you can pass [Headers object](https://developer.mozilla.org/en-US/docs/Web/API/Headers).
* `statusText` - The status message associated with the status code, e.g., OK.
* `status` - The status code for the response, e.g., 200.
* `type` - Content-Type of the response (MIME).

Additional methods:
* `redirect()` - accept url or optional first argument that is number of HTTP code

Application also have middlewere as in Express.js

* `use(function(err,  req, res, next) {})` 4 parameters it's error handler
* `use(function(req, res, next) {})` 3 parameters it's middlewere


## Story

The idea of using a Service worker to serve pure in browser HTTP requests has a long history. I've first used this technque for my [Git Web Terminal](https://git-terminal.js.org/) and described the usage of it in the article from 2018: [How to create Web Server in Browser](https://jcubic.wordpress.com/2018/05/23/how-to-create-web-server-from-browser/). In June 2022, I came up with a cool new way of using this technique. While creating PoC for the article I'm going to write (will update this story when ready), I realized that I can extract all the logic of creating those fake HTTP requests into a library. This is how Wayne was born.

The name of the library was inspired by the scene in [Wayne's World 2](https://en.wikipedia.org/wiki/Wayne's_World_2) in which Wayne dresses up as a construction worker.

[![Watch the video](https://github.com/jcubic/wayne/blob/master/assets/wayne's-world-screen-capture.png?raw=true)](https://youtu.be/89W-lCTFT2o)

I hightly recommend both movies if you haven't seen them already.


## Contribution
If you have any ideas for an improvement don't hesitate to create an issue.
Code contributions are also welcome.

**Working on your first Pull Request?** You can learn how from this *free* series [How to Contribute to an Open Source Project on GitHub](https://kcd.im/pull-request)

## Article about or mention Wayne
* [Comparing Wayne.js with Express.js for service worker routing](https://blog.logrocket.com/comparing-wayne-js-express-js-service-worker-routing/)
* [Hack to Run React Application inside Service Worker](https://dev.to/jcubic/hack-to-run-react-application-inside-service-worker-4p2f)
* [How to create Web Server in Browser](https://itnext.io/how-to-create-web-server-in-browser-ffaa371d2b53)

## Press
* [Architecture Weekly](https://github.com/oskardudycz/ArchitectureWeekly)
* [JavaScript Weekly](https://javascriptweekly.com/issues/597)

## Aknowledge
* Part of the content of this README was based on text from [MDN](https://developer.mozilla.org/).
* Logo use illustration from [OpenClipart](https://openclipart.org/detail/320906/hard-hat).
* This article was helpful [SSEGWSW: Server-Sent Events Gateway by Service Workers](https://medium.com/its-tinkoff/ssegwsw-server-sent-events-gateway-by-service-workers-6212c1c55184)

## License

Released with [MIT](http://opensource.org/licenses/MIT) license<br/>
Copyright (c) 2022-2023 [Jakub T. Jankiewicz](https://jcubic.pl/me)
