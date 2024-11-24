/*
 * Wayne - Server Worker Routing library (v. 0.19.0)
 *
 * Copyright (c) 2022-2024 Jakub T. Jankiewicz <https://jcubic.pl/me>
 * Released under MIT license
 *
 * Sun, 24 Nov 2024 19:39:28 +0000
 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.wayne = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FileSystem = FileSystem;
exports.HTTPResponse = void 0;
exports.RouteParser = RouteParser;
exports.Wayne = void 0;
exports.make_cache = make_cache;
exports.rpc = rpc;
exports.send = send;
exports.travese_cache = travese_cache;
/*
 * Wayne - Server Worker Routing library (v. 0.19.0)
 *
 * Copyright (c) 2022-2024 Jakub T. Jankiewicz <https://jcubic.pl/me>
 * Released under MIT license
 */

const root_url = get_root_path();
const root_url_re = new RegExp('^' + escape_re(root_url));
function same_origin(origin) {
  return origin === self.location.origin;
}
function get_root_path() {
  if (self.registration) {
    const url = new URL(registration.scope);
    return url.pathname.replace(/\/$/, '');
  }
  return location.pathname.replace(/\/[^\/]+$/, '');
}
function normalize_url(url) {
  return url.replace(root_url_re, '');
}
function escape_re(str) {
  if (typeof str == 'string') {
    var special = /([\^\$\[\]\(\)\{\}\+\*\.\|\?])/g;
    return str.replace(special, '\\$1');
  }
}
function is_function(arg) {
  return typeof arg === 'function';
}
function is_promise(arg) {
  return arg && typeof arg === 'object' && is_function(arg.then);
}

// taken from Isomorphic-git MIT license
function is_promise_fs(fs) {
  const test = targetFs => {
    try {
      // If readFile returns a promise then we can probably assume the other
      // commands do as well
      return targetFs.readFile().catch(e => e);
    } catch (e) {
      return e;
    }
  };
  return is_promise(test(fs));
}
// List of commands all filesystems are expected to provide
const commands = ['stat', 'readdir', 'readFile'];
function bind_fs(fs) {
  const result = {};
  if (is_promise_fs(fs)) {
    for (const command of commands) {
      result[command] = fs[command].bind(fs);
    }
  } else {
    for (const command of commands) {
      result[command] = function (...args) {
        return new Promise((resolve, reject) => {
          fs[command](...args, function (err, data) {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          });
        });
      };
    }
  }
  return result;
}

// -----------------------------------------------------------------------------
// :: Wayne Route Response Class
// -----------------------------------------------------------------------------

class HTTPResponse {
  constructor(resolve, reject) {
    this._resolve = resolve;
    this._reject = reject;
  }
  html(data, init) {
    this.send(data, {
      type: 'text/html',
      ...init
    });
  }
  text(data, init) {
    this.send(data, init);
  }
  json(data, init) {
    this.send(JSON.stringify(data), {
      type: 'application/json',
      ...init
    });
  }
  respond(response) {
    this._resolve(response);
  }
  blob(blob, init = {}) {
    this._resolve(new Response(blob, init));
  }
  send(data, {
    type = 'text/plain',
    ...init
  } = {}) {
    if (![undefined, null].includes(data)) {
      data = new Blob([data], {
        type
      });
    }
    this.blob(data, init);
  }
  async fetch(arg) {
    if (typeof arg === 'string') {
      const _res = await fetch(arg);
      const type = _res.headers.get('Content-Type') ?? 'application/octet-stream';
      this.send(await _res.arrayBuffer(), {
        type
      });
    } else if (arg instanceof Request) {
      return fetch(arg).then(this._resolve).catch(this._reject);
    }
  }
  download(content, {
    filename = 'download',
    type = 'text/plain',
    ...init
  } = {}) {
    const headers = {
      'Content-Disposition': `attachment; filename="${filename}"`
    };
    this.send(content, {
      type,
      headers,
      ...init
    });
  }
  redirect(code, url) {
    if (url === undefined) {
      url = code;
      code = 302;
    }
    if (!url.match(/https?:\/\//)) {
      url = root_url + url;
    }
    this._resolve(Response.redirect(url, code));
  }
  sse({
    onClose
  } = {}) {
    let send, close, stream, defunct;
    stream = new ReadableStream({
      cancel() {
        defunct = true;
        trigger(onClose);
      },
      start: controller => {
        send = function (event) {
          if (!defunct) {
            const chunk = create_chunk(event);
            const payload = new TextEncoder().encode(chunk);
            controller.enqueue(payload);
          }
        };
        close = function close() {
          controller.close();
          stream = null;
          trigger(onClose);
        };
      }
    });
    this._resolve(new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Connection': 'keep-alive'
      }
    }));
    return {
      send,
      close
    };
  }
}

// -----------------------------------------------------------------------------
// :: Route Parser
// :: code based on https://github.com/jcubic/route.js
// :: Copyright (C) 2014-2017 Jakub T. Jankiewicz <https://jcubic.pl/me>
// -----------------------------------------------------------------------------
exports.HTTPResponse = HTTPResponse;
function RouteParser() {
  const name_re = '[a-zA-Z_][a-zA-Z_0-9]*';
  const self = this;
  const open_tag = '{';
  const close_tag = '}';
  const glob = '*';
  const glob_re = '(.*?)';
  const number = '\\d';
  const optional = '?';
  const open_group = '(';
  const close_group = ')';
  const plus = '+';
  const dot = '.';
  self.route_parser = function (open, close) {
    const routes = {};
    const tag_re = new RegExp('(' + escape_re(open) + name_re + escape_re(close) + ')', 'g');
    const tokenizer_re = new RegExp(['(', escape_re(open), name_re, escape_re(close), '|', escape_re(glob), '|', escape_re(number), '|', escape_re(dot), '|', escape_re(optional), '|', escape_re(open_group), '|', escape_re(close_group), '|', escape_re(plus), ')'].join(''), 'g');
    const clear_re = new RegExp(escape_re(open) + '(' + name_re + ')' + escape_re(close), 'g');
    return function (str) {
      const result = [];
      let index = 0;
      let parentheses = 0;
      str = str.split(tokenizer_re).map(function (chunk, i, chunks) {
        if (chunk === open_group) {
          parentheses++;
        } else if (chunk === close_group) {
          parentheses--;
        }
        if ([open_group, plus, close_group, optional, dot, number].includes(chunk)) {
          return chunk;
        } else if (chunk === glob) {
          result.push(index++);
          return glob_re;
        } else if (chunk.match(tag_re)) {
          result.push(chunk.replace(clear_re, '$1'));
          return '([^\\/]+)';
        } else {
          return chunk;
        }
      }).join('');
      if (parentheses !== 0) {
        throw new Error(`Wayne: Unbalanced parentheses in an expression: ${str}`);
      }
      return {
        re: str,
        names: result
      };
    };
  };
  const parse = self.route_parser(open_tag, close_tag);
  self.parse = parse;
  self.pick = function (routes, url, origin) {
    let input;
    let keys;
    if (routes instanceof Array) {
      input = {};
      keys = routes;
      routes.map(function (route) {
        input[route] = route;
      });
    } else {
      keys = Object.keys(routes);
      input = routes;
    }
    const results = [];
    for (let i = keys.length; i--;) {
      const key = keys[i];
      const route = input[key];
      let pattern;
      // check if origin match for full URL
      const re = /:\/\/([^\/]+)(\/.*)/;
      let m = key.match(re);
      if (m) {
        const key_origin = m[1];
        // glob
        if (key_origin.match(/\*/)) {
          const re = new RegExp(key_origin.replace(/\*/g, glob_re));
          if (!origin.match(re)) {
            continue;
          }
        } else {
          const url = new URL(key);
          if (url.origin !== origin) {
            continue;
          }
        }
        pattern = m[2];
      } else if (!same_origin(origin)) {
        // skip different origin
        continue;
      } else {
        pattern = key;
      }
      const parts = parse(pattern);
      route.forEach(({
        handler,
        options
      }) => {
        const caseSensitive = options.caseSensitive ?? true;
        m = url.match(new RegExp('^' + parts.re + '$', caseSensitive ? '' : 'i'));
        if (m) {
          const matched = m.slice(1);
          const data = {};
          if (matched.length) {
            parts.names.forEach((name, i) => {
              data[name] = matched[i];
            });
          }
          results.push({
            pattern: key,
            handler,
            data
          });
        }
      });
    }
    return results;
  };
}
function html(content) {
  return ['<!DOCTYPE html>', '<html>', '<head>', '<meta charset="UTF-8">', '<title>Wayne Service Worker</title>', '</head>', '<body>', ...content, '</body>', '</html>'].join('\n');
}
function error_500(error) {
  var output = html(['<h1>Wayne: 500 Server Error</h1>', '<p>Service worker give 500 error</p>', `<p>${error.message || error}</p>`, `<pre>${error.stack || ''}</pre>`]);
  return [output, {
    status: 500,
    statusText: '500 Server Error'
  }];
}
function make_dir(prefix, path, list) {
  var output = html(['<h1>Wayne FS</h1>', `<p>Content of ${path}</p>`, '<ul>', ...list.map(name => {
    return `<li><a href="${root_url}${prefix}${path}${name}">${name}</a></li>`;
  }), '</ul>']);
  return [output, {
    status: 200,
    statusText: 'Ok'
  }];
}
function error_404(path) {
  var output = html(['<h1>Wayne: 404 File Not Found</h1>', `<p>File ${path} not found`]);
  return [output, {
    status: 404,
    statusText: '404 Page Not Found'
  }];
}
async function file_exists({
  fs,
  file_path
}) {
  try {
    await fs.stat(file_path);
    return true;
  } catch (e) {
    return false;
  }
}
function create_chunk({
  data,
  event,
  retry,
  id
}) {
  return Object.entries({
    event,
    id,
    data,
    retry
  }).filter(([, value]) => value).map(([key, value]) => `${key}: ${value}`).join('\n') + '\n\n';
}
function trigger(maybeFn, ...args) {
  if (typeof maybeFn === 'function') {
    maybeFn(...args);
  }
}
function chain_handlers(handlers, callback) {
  if (handlers.length) {
    return new Promise((resolve, reject) => {
      let i = 0;
      (async function recur() {
        const handler = handlers[i];
        if (!handler) {
          return resolve();
        }
        try {
          await callback(handler, function next() {
            i++;
            recur();
          });
        } catch (error) {
          reject(error);
        }
      })();
    });
  }
}
async function list_dir({
  fs,
  path
}, path_name) {
  const names = await fs.readdir(path_name);
  return Promise.all(names.map(async name => {
    const fullname = path.join(path_name, name);
    const stat = await fs.stat(fullname);
    if (stat.isDirectory()) {
      return `${name}/`;
    }
    return name;
  }));
}

// -----------------------------------------------------------------------------
// :: Write FS into browser cache
// -----------------------------------------------------------------------------
async function make_dir_response({
  fs,
  path
}, dir = '/', prefix, list) {
  const [html, init] = make_dir(prefix, dir, list);
  const blob = new Blob([html], {
    type: 'text/html'
  });
  return new Response(blob, init);
}
async function travese_cache({
  cache,
  fs,
  path,
  mime
}, dir = '/', prefix = '') {
  const entries = await list_dir({
    fs,
    path
  }, dir);
  const response = await make_dir_response({
    fs,
    path
  }, dir, prefix, entries);
  await cache.put(`${prefix}${dir}`, response);
  for (const entry of entries) {
    const full_path = path.join(dir, entry);
    if (entry.endsWith('/')) {
      await travese_cache({
        cache,
        fs,
        path,
        mime
      }, full_path, prefix);
    } else {
      const file_contents = await fs.readFile(full_path);
      const content_type = mime.getType(entry);
      const response = new Response(file_contents, {
        headers: {
          'Content-Type': content_type
        }
      });
      await cache.put(`${prefix}${full_path}`, response);
    }
  }
}
async function make_cache({
  fs,
  path,
  mime,
  dir = '/',
  prefix,
  cache: cache_name = '__wayne__'
} = {}) {
  if (!caches) {
    throw new Error('Cache API is not available in this environment');
  }
  const cache = await caches.open(cache_name);
  return travese_cache({
    cache,
    fs,
    path,
    mime
  }, dir, prefix);
}

// -----------------------------------------------------------------------------
// :: File System
// -----------------------------------------------------------------------------
function FileSystem(options) {
  let {
    path,
    prefix = '',
    test,
    dir = () => '/',
    fs,
    cache = null,
    mime,
    default_file = 'index.html'
  } = options;
  fs = bind_fs(fs);
  const parser = new RouteParser();
  if (prefix && !prefix.startsWith('/')) {
    prefix = `/${prefix}`;
  }
  if (!test) {
    test = url => url.pathname.startsWith(prefix);
  }
  async function serve(res, path_name) {
    const ext = path.extname(path_name);
    const type = mime.getType(ext);
    const data = await fs.readFile(path_name);
    res.send(data, {
      type
    });
  }
  if (cache) {
    cache = caches.open(cache);
  }
  let real_cache;
  return async function (req, res, next) {
    const url = new URL(req.url);
    const method = req.method;
    let path_name = normalize_url(decodeURIComponent(url.pathname));
    url.pathname = path_name;
    if (!(same_origin(url.origin) && (await test(url)))) {
      return next();
    }
    if (req.method !== 'GET') {
      return res.send('Method Not Allowed', {
        status: 405
      });
    }
    if (prefix) {
      path_name = path_name.substring(prefix.length);
    }
    if (!path_name) {
      path_name = '/';
    }
    path_name = path.join(await dir(), path_name);
    if (cache) {
      real_cache ??= await cache;
      // putting prefix + path in cache creates a full URL as key
      const full_url = path.join(root_url, url.pathname);
      const cache_response = await real_cache.match(full_url);
      if (cache_response) {
        res.respond(cache_response);
      } else {
        res.html(...error_404(path_name));
      }
      return;
    }
    try {
      const stat = await fs.stat(path_name);
      if (stat.isFile()) {
        await serve(res, path_name);
      } else if (stat.isDirectory()) {
        const file_path = path.join(path_name, default_file);
        if (await file_exists({
          fs,
          file_path
        })) {
          await serve(res, default_path);
        } else {
          const payload = make_dir(prefix, path_name, await list_dir({
            fs,
            path
          }, path_name));
          res.html(...payload);
        }
      }
    } catch (e) {
      console.log(e.stack);
      if (typeof stat === 'undefined') {
        res.html(...error_404(path_name));
      } else {
        res.html(...error_500(error));
      }
    }
  };
}
// -----------------------------------------------------------------------------
function pluck(name) {
  return function (object) {
    return object[name];
  };
}

// -----------------------------------------------------------------------------
function handlers(arr) {
  return arr.map(pluck('handler'));
}

// -----------------------------------------------------------------------------
// :: Main Wayne Constructor
// -----------------------------------------------------------------------------

class Wayne {
  constructor({
    filter = () => true
  } = {}) {
    this._er_handlers = [];
    this._middlewares = [];
    this._routes = {};
    this._timeout = 5 * 60 * 1000; // 5 minutes
    this._parser = new RouteParser();
    self.addEventListener('fetch', event => {
      if (filter(event.request) === false) {
        return;
      }
      const promise = new Promise(async (resolve, reject) => {
        const req = event.request;
        try {
          const res = new HTTPResponse(resolve, reject);
          await chain_handlers(this._middlewares, function (fn, next) {
            return fn(req, res, next);
          });
          const method = req.method;
          const url = new URL(req.url);
          const path = normalize_url(url.pathname);
          const origin = url.origin;
          const routes = this._routes[method];
          if (routes) {
            const match = this._parser.pick(routes, path, origin);
            const have_wildcard = match.length > 1 && match.find(route => {
              return !!route.pattern.match(/\*/);
            });
            if (match.length) {
              let selected_route;
              if (have_wildcard) {
                selected_route = match.find(route => {
                  return !route.pattern.match(/\*/);
                });
              }
              if (!(have_wildcard && selected_route)) {
                selected_route = match[0];
              }
              const fns = [...this._middlewares, ...handlers(match)];
              req.params = selected_route.data;
              setTimeout(function () {
                reject('Timeout Error');
              }, this._timeout);
              await chain_handlers(fns, (fn, next) => {
                return fn(req, res, next);
              });
              return;
            }
          }
          if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
            return;
          }
          fetch(event.request).then(resolve).catch(reject);
        } catch (error) {
          this._handle_error(resolve, req, error);
        }
      });
      event.respondWith(promise.catch(() => {}));
    });
    ['GET', 'POST', 'DELETE', 'PATCH', 'PUT'].forEach(method => {
      this[method.toLowerCase()] = this.method(method);
    });
  }
  _handle_error(resolve, req, error) {
    const res = new HTTPResponse(resolve);
    if (this._er_handlers.length) {
      chain_handlers(this._er_handlers, function (handler, next) {
        handler(error, req, res, next);
      }, function (error) {
        res.html(...error_500(error));
      });
    } else {
      res.html(...error_500(error));
    }
  }
  use(...fns) {
    fns.forEach(fn => {
      if (typeof fn === 'function') {
        if (fn.length === 4) {
          this._er_handlers.push(fn);
        } else if (fn.length === 3) {
          this._middlewares.push(fn);
        }
      }
    });
  }
  method(method) {
    return function (url, handler, options = {}) {
      if (!this._routes[method]) {
        this._routes[method] = {};
      }
      const routes = this._routes[method];
      if (!routes[url]) {
        routes[url] = [];
      }
      routes[url].push({
        handler,
        options
      });
      return this;
    };
  }
}

// -----------------------------------------------------------------------------
// :: RPC
// -----------------------------------------------------------------------------
exports.Wayne = Wayne;
function rpc(channel, methods) {
  channel.addEventListener('message', async function handler(message) {
    if (Object.keys(message.data).includes('method', 'id', 'args')) {
      const {
        method,
        id,
        args
      } = message.data;
      try {
        const result = await methods[method](...args);
        channel.postMessage({
          id,
          result
        });
      } catch (error) {
        channel.postMessage({
          id,
          error
        });
      }
    }
  });
}
;
let rpc_id = 0;
function send(channel, method, args) {
  return new Promise((resolve, reject) => {
    const id = ++rpc_id;
    const payload = {
      id,
      method,
      args
    };
    channel.addEventListener('message', function handler(message) {
      if (id == message.data.id) {
        const data = message.data;
        channel.removeEventListener('message', handler);
        if (data.error) {
          reject(data.error);
        } else {
          resolve(message.data);
        }
      }
    });
    channel.postMessage(payload);
  });
}
;

},{}]},{},[1])(1)
});
