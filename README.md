<h1 align="center">
  <img src="https://github.com/jcubic/wayne/blob/master/assets/wayne-logo.svg?raw=true"
       alt="Logo of Wayne library - it represents construction worker helmet and text with the name of the library" />
</h1>

[![npm](https://img.shields.io/badge/npm-0.17.0-blue.svg)](https://www.npmjs.com/package/@jcubic/wayne)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://makeapullrequest.com)
[![jSDelivr](https://data.jsdelivr.com/v1/package/npm/@jcubic/wayne/badge)](https://www.jsdelivr.com/package/npm/@jcubic/wayne)


[Service Worker Routing library for in-browser HTTP requests](https://github.com/jcubic/wayne/)

It's like an Express inside Service Worker.

Most of the time Service Worker is used for caching HTTP requests and making the app work when there
is no internet (mostly for [PWA](https://en.wikipedia.org/wiki/Progressive_web_application)), but in
fact, you can create completely new responses to requests that never leave the browser. This library
makes that easier by adding a simple API similar to Express.

## Usage

Installation from npm:

```bash
npm install @jcubic/wayne
```

```bash
yarn add @jcubic/wayne
```

The standard way of installing the service worker

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

Inside the same file you can send [AJAX](https://en.wikipedia.org/wiki/Ajax_(programming)) requests with standard
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

* When the Service Worker created as normal script

```javascript
importScripts('https://cdn.jsdelivr.net/npm/@jcubic/wayne/index.umd.min.js');

const app = new wayne.Wayne();
```

* When using bundlers like Vite:

```javascript
import { Wayne } from '@jcubic/wayne';
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

app.get('/404', function(req, res) {
    res.text('Not Found', { status: 404, statusText: 'Not Found' });
});

app.get('/external', function(req, res) {
  // lorem ipsum API
  res.redirect('https://api.buildable.dev/@62d55492951509001abc363e/live/lorem-ipsum');
});
```

### Handle the same extension for all requests

```javascript
importScripts(
  'https://cdn.jsdelivr.net/npm/@jcubic/wayne/index.umd.min.js',
  'https://cdn.jsdelivr.net/gh/jcubic/static@master/js/path.js'
);

const app = new Wayne();

app.get('*', function(req, res) {
  const url = new URL(req.url);
  const extension = path.extname(url.pathname);
  const accept = req.headers.get('Accept');
  if (extension === '.js' && accept.match(/text\/html/)) {
    res.text('// Sorry no source code for you');
  } else {
    res.fetch(req);
  }
});
```

This code will show the comment `// Sorry no source code for you` for every request to JavaScript
files from the browser (if open in a new tab).  When you want to view the file the browser sends
`Accept: text/html` HTTP header.

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

When not using a module the code will be similar. When you access URLs with
the prefix `__fs__` like `./__fs__/foo` it will read files from the indexedDB file
system named `__wayne__`. See [Lightning-FS](https://github.com/isomorphic-git/lightning-fs) repo for details about the library.

From version 0.12 you can use `test` callback option to check if the file should serve from the filesystem. Note that it will receive URLs from all domains.

From version 0.13.0 you can use `dir` callback function that allow to dynamically change directory of served files.

```javascript
const test = url => {
    const path = url.pathname;
    // return true if pathname should go to filesystem
    return path.match(/__fs__/);
};

const dir = () => '/';

app.use(wayne.FileSystem({ path, fs, mime, test, dir }));
```

From version 0.14.0 both functions `dir` and `test` can be async. So you can use data from IndexedDB
e.g. using [idb-keyval](https://github.com/jakearchibald/idb-keyval) by Jake Archibald.

A patch in 0.14.3 allow putting interceptors to inject something into output HTML from FileSystem
middleware. You do this by adding middleware before FileSystem and patch `res.send` method:


```javascript
function fs_interecept(callback) {
    return function(req, res, next) {
        const send = res.send.bind(res);
        res.send = function(data, ...rest) {
            const url = new URL(req.url);
            if (test(url)) {
                data = callback(data);
            }
            return send(data, ...rest);
        };
        next();
    };
}

app.use(fs_interecept(function(html) {
    return html.replace(/<\/body>/, `<script>console.log('intercepted')</script></body>`);
}));
```

You should use the same `test` function to make sure that you patch only those requests that came
from FS.


### [RPC](https://en.wikipedia.org/wiki/Remote_procedure_call) mechanism

In Service Worker, you create a generic route that sends data to the BroadcastChannel:

```javascript
import { send } from 'https://cdn.jsdelivr.net/npm/@jcubic/wayne';

const channel = new BroadcastChannel('__rpc__');

app.get('/rpc/{name}/*', async (req, res) => {
    const args = req.params[0].split('/');
    const method = req.params.name;
    try {
        const data = await send(channel, method, args);
        res.json(data);
    } catch(e) {
        res.text(e.message);
    }
});
```

and in the main thread, you create the other side of the channel and the remote methods:

```javascript
import { rpc } from 'https://cdn.jsdelivr.net/npm/@jcubic/wayne';

const channel = new BroadcastChannel('__rpc__');

rpc(channel, {
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
});
```

When you send a request `/rpc/ping` you will get a response from `methods.ping` function.

```javascript
fetch('./rpc/ping')
  .then(res => res.text())
  .then(text => {
     console.log({ text });
  });
```

With this setup, you can create new functions/methods that will map to HTTP requests.

The demo below uses random requests:

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

> [!WARNING]
> Above code will only work when main page is open, so you can't navigate away. It may freeze the browser,
> becasue it will not able to find other side of the BroadcastChannel. If you want to send data persistently,
> it's better to use IndexedDB to share data between main thread and Service Worker. You can use library like
> [idb-keyval](https://github.com/jakearchibald/idb-keyval) by Jake Archibald for this.

### Server-Sent Events

[Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
is the way to stream data in the browser.  It's a native browser implementation of Long
Polling. Here is an example of how to use SSE with Wayne:

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

### 3rd party URL
Service Worker allows intercepting everything that origineted from the page that has service worker
inclding URLs from different origin. From version 0.15.0 Wayne allow to inrecept such URLs. You just use
full URL instead of just path as a route:

```javascript
app.get(`https://github.com/{user}/{repo}`, (req, res) => {
    res.text(`Sorry, you can't fetch ${req.params.user} repo named ${req.params.repo}`);
});
```

If you run fetch in browser:

```javascript
await fetch('https://github.com/jcubic/wayne').then(res => res.text());
```

you will get the string:

```javascript
"Sorry, you can't fetch jcubic repo named wayne"
```

If you want to restrict the request to only same origin you can do this with filter option:

```javascript
const app = new Wayne({
    filter: req => {
        const url = new URL(req.url);
        return url.host === self.location.host;
    }
});
```

You can also use middleware for this

```javascript
app.use((req, res, next) => {
    const url = new URL(req.url);
    if (url.origin === location.origin) {
        next();
    } else {
        res.fetch(req);
    }
});
```

### Overwrite HTML code

```javascript
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
```

This code will intercept every page and if it's HTML it will add HTML code at the end (before
closing body tag).

### Using with ES Modules
You can intercept the import of ES Module with Wayne. Here is example:

**Main tread**
```html
<script>
window.ready = navigator.serviceWorker.register('./sw.js', { scope: location.pathname })
</script>
<script type="module">
// wait for Service Woker
await window.ready;
// next tick delay is require for the worker to intitialize properly
await new Promise(resolve => setTimeout(resolve, 0));

// static imports works only when you install and refresh the browser
// they probbaly run just after the code is parsed
const { default: $ } = await import('./@jquery');

$('body').css('background', 'rebeccapurple');
</script>
```

**Service Worker**

```javascript
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
```

The code checks if the URL contain `@` in the path and redirect them to
[https://esm.run](https://www.jsdelivr.com/esm). If the script import other scrips they usually look like this:

```javascript
import require$$0 from"/npm/jquery@3.7.1/+esm"
```

And needs to be imported from jsDelivr, the same if you import CSS file.
See [example of loading jQuery Terminal](https://jcubic.github.io/wayne/esm/) where this code is used.


## First load

According to the spec, the default behavior of the Service Worker is to control the HTTP requests
after reloading the page. To make the SW always in control use this code in your SW:

```javascript
// take control of uncontrolled clients on first load
// ref: https://web.dev/service-worker-lifecycle/#clientsclaim
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
```

You can read more in the article [The service worker lifecycle](https://web.dev/service-worker-lifecycle/)
by [Jake Archibald](https://twitter.com/jaffathecake).

## Demo
* [All in one demo](https://jcubic.github.io/wayne/demo).
* Proof of Concept of [ReactJS application inside Service Worker](https://jcubic.github.io/wayne/jsx/public/).
* [Filesystem demo](https://jcubic.github.io/wayne/fs/).
* [Server-Sent Events Proxy demo](https://jcubic.github.io/wayne/sse/).
* [Offline demo](https://jcubic.github.io/wayne/offline/).
* [Download demo](https://jcubic.github.io/wayne/download/).
* [Source Code Syntax highlight demo](https://jcubic.github.io/wayne/code/).
* [Using with React and Vite](https://jcubic.github.io/react-wayne-auth/)

The source code for the demos can be found
[in the docs' directory at the gh-pages branch](https://github.com/jcubic/wayne/tree/gh-pages/docs).

## API reference

Wayne constrcutor accept object with options:
* `filter` - a function that is called with request object, and should return false if the request
  should not be proxied with Service Worker.

Wayne object has those methods that correspond to HTTP methods
* `get`
* `post`
* `put`
* `delete`
* `patch`

Each method accepts a URL with markers inside curly brackets, those markers will be available from
**Request.params** object.  The request object is the browser native object of a given request see
[MDN for details](https://developer.mozilla.org/en-US/docs/Web/API/Request). The only change to the
native API is that the object has property **params**.

Here are a few most important Request properties:

* `headers` - Headers object to get key/value pairs use `Object.fromEntires(req.headers.entries())`.
* `method` - request method as a string.
* `url` - string with full URL.
* `referrer` - HTTP referer.
* `arrayBuffer()` - Returns a promise that resolves with an [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) representation of the request body.
* `blob()` - Returns a promise that resolves with a [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) representation of the request body.
* `formData()` - Returns a promise that resolves with a [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) representation of the request body.
* `json()` - Returns a promise that resolves with the result of parsing the request body as [JSON](https://developer.mozilla.org/en-US/docs/Web/API/Request/json).
* `text()` - Returns a promise that resolves with a text representation of the request body.

**Response** object is an instance of `HTTPResponse` those have methods:

* `html()`
* `json()`
* `text()`
* `send()`

each of those methods accepts string as the first argument. The second argument is options:

* `headers` - any headers as key-value pairs or you can pass [Headers object](https://developer.mozilla.org/en-US/docs/Web/API/Headers).
* `statusText` - The status message associated with the status code, e.g., OK.
* `status` - The status code for the response, e.g., 200.
* `type` - Content-Type of the response (MIME).

Additional methods:
* `redirect()` - accept URL or optional first argument that is the number of HTTP code
* `sse([options])` - function creates Server-Sent Event stream, the return object has a method `send` that sends a new event.
* `fetch(url | Request)` - method will send a normal HTTP request to the server and return the result to the client. You can use the default Request object from the route.
* `download(data, { filename })` - a method that can be used to trigger file download. The data can be a `string` or `arrayBuffer` you can use native fetch API and call `await res.text()` or `await res.arrayBuffer()` and pass the result as data.

The application also has middleware as in Express.js

* `use(function(err,  req, res, next) {})` 4 parameters it's an error handler
* `use(function(req, res, next) {})` 3 parameters it's a middleware

Additional exported functions:
* `FileSystem({ path: string, fs: <FS Module>, prefix: string })` - a function that creates a middleware for the file system. You should use FS that supports Service Worker like the one that uses [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) e.g. [BrowserFS](https://github.com/jvilk/BrowserFS) or [LightingFS](https://github.com/isomorphic-git/lightning-fs).
* `rpc(channel, object)` - a function that should be used in the main thread that creates an RPC-like mechanism. The first argument is an instance of a broadcast channel and the second is an object with remote functions.
* `send(channel, method: string, args: any[])` - function sends remote procedure to the main thread.

## Story

The idea of using a Service worker to serve pure in-browser HTTP requests has a long history. I
first used this technique for my [Git Web Terminal](https://git-terminal.js.org/) and described the
usage of it in the article from 2018:
[How to create Web Server in Browser](https://jcubic.wordpress.com/2018/05/23/how-to-create-web-server-from-browser/).
In June 2022, I came up with a cool new way of using this technique. While creating PoC for the
article I'm going to write (will update this story when ready), I realized that I can extract all
the logic of creating those fake HTTP requests into a library. This is how Wayne was born.

The name of the library was inspired by the scene in
[Wayne's World 2](https://en.wikipedia.org/wiki/Wayne's_World_2) in which Wayne dresses up as a construction
worker.

[![Watch the video](https://github.com/jcubic/wayne/blob/master/assets/wayne's-world-screen-capture.png?raw=true)](https://youtu.be/89W-lCTFT2o)

I highly recommend both movies if you haven't seen them already.

## Contribution
If you have any ideas for an improvement, don't hesitate to create an issue.
Code contributions are also welcome.

**Working on your first Pull Request?** You can learn how from this *free* series [How to Contribute to an Open Source Project on GitHub](https://kcd.im/pull-request)

## Article about or mention Wayne
* [Comparing Wayne.js with Express.js for service worker routing](https://blog.logrocket.com/comparing-wayne-js-express-js-service-worker-routing/)
* [Hack to Run React Application inside Service Worker](https://dev.to/jcubic/hack-to-run-react-application-inside-service-worker-4p2f)
* [How to create Web Server in Browser](https://itnext.io/how-to-create-web-server-in-browser-ffaa371d2b53)
* [Hack for Syntax Highlighting of Source Code](https://jakub.jankiewicz.org/blog/display-source-files-in-color/)
* [How to Create a REST API Without a Server](https://www.freecodecamp.org/news/how-to-create-a-rest-api-without-a-server/)

## Press
* [Architecture Weekly](https://github.com/oskardudycz/ArchitectureWeekly)
* [JavaScript Weekly](https://javascriptweekly.com/issues/597)
* [Web Tools Weekly](https://webtoolsweekly.com/archives/issue-471/)
* [Vue.js Developers Newsletter](https://vuejsdevelopers.com/newsletter/issue/265/)

## Acknowledge
* Part of the content of this README was based on text from [MDN](https://developer.mozilla.org/).
* Logo uses an illustration from [OpenClipart](https://openclipart.org/detail/320906/hard-hat).
* This article was helpful [SSEGWSW: Server-Sent Events Gateway by Service Workers](https://medium.com/its-tinkoff/ssegwsw-server-sent-events-gateway-by-service-workers-6212c1c55184)

## License

Released with [MIT](http://opensource.org/licenses/MIT) license<br/>
Copyright (c) 2022-2024 [Jakub T. Jankiewicz](https://jcubic.pl/me)
