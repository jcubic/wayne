<h1 align="center">
  <img src="https://github.com/jcubic/wayne/blob/master/assets/wayne-logo.svg?raw=true"
       alt="Logo of Wayne library - it represent constrution worker helmet and text with the name of the library" />
</h1>

[![npm](https://img.shields.io/badge/npm-0.1.0-blue.svg)](https://www.npmjs.com/package/@jcubic/wayne)

[Service Worker Routing library for in browser HTTP requests](https://github.com/jcubic/wayne/)

It's like express.js inside Service Worker.

## Usage

Installation from npm:

```bash
npm install @jcubic/wayne
```

```bash
yarn add @jcubic/wayne
```

Installing service worker as ES Module


```javascript
if ('serviceWorker' in navigator) {
    var scope = location.pathname.replace(/\/[^\/]+$/, '/');
    navigator.serviceWorker.register('sw.js', {scope, type: 'module'})
             .then(function(reg) {
                 reg.addEventListener('updatefound', function() {
                     var installingWorker = reg.installing;
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


Service worker - **sw.js** file - the file import library from CDN.

```javascript
import { Wayne } from 'https://cdn.jsdelivr.net/npm/@jcubic/wayne';

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
```

## API reference

Wayne object has those methods that corenspond to HTTP methods

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
* `url` - string with full URL
* `referrer` - HTTP referer
* `arrayBuffer()` - Returns a promise that resolves with an [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) representation of the request body.
* `blob()` - Returns a promise that resolves with a [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) representation of the request body.
* `formData()` - Returns a promise that resolves with a [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) representation of the request body.
* `json()` - Returns a promise that resolves with the result of parsing the request body as [JSON](https://developer.mozilla.org/en-US/docs/Web/API/Request/json).
* `text()` - Returns a promise that resolves with a text representation of the request body.

**Response** object is instance of HTTPResponse that have methods:

* `html`
* `json`
* `text`
* `send`

each of those methods accepts string as first argument. Second argument are options:

* `headers` - any headers as key value pairs or you can pass [Headers object](https://developer.mozilla.org/en-US/docs/Web/API/Headers).
* `statusText` - The status message associated with the status code, e.g., OK.
* `status` - The status code for the response, e.g., 200.
* `type` - Content-Type of the response (MIME).

## Aknowledge
* Part of the content of this README was based on text from [MDN](https://developer.mozilla.org/).

## License

Released with [MIT](http://opensource.org/licenses/MIT) license<br/>
Copyright (c) 2022 [Jakub T. Jankiewicz](https://jcubic.pl/me)