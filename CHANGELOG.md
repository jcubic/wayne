## 0.14.1
### Bug fix
* fix throwing error from FileSystem when different HTTP requests is sent
* ignore requests to different domains with FileSystem

## 0.14.0
### Features
* allow to use async function in `test` and `dir` with FileSystem middleware

## 0.13.0
### Features
* allow to use non promise FS libraries like `BrowserFS` with FileSystem middleware
* add `dir` option to FileSystem middleware to change default FS directory
### Bugfix
* fix errors with `FileSystem` when `prefix` or `test` are not defined

## 0.12.0
### Features
* add `default_file` (default `index.html`) for `FileSystem`
* add `test` callback to check when to serve files from fs

## 0.11.2
### Bugfix
* don't show stack trace when request is blocked by AdBlock

## 0.11.0
### Features
* make `HTTPResponse::fetch` accept `Request` object

## 0.10.0
### Features
* add  `HTTPResponse::download` method

## 0.9.0
### Features
* add `HTTPResponse::fetch` method

## 0.8.0
### Features
* improve the URL parser [#24](https://github.com/jcubic/wayne/issues/24)

## 0.7.0
### Features
* add abstraction over RPC mechanism (export `rpc` and `send`)
### Bugfix
* fix infinite await when not using middlewares

## 0.6.2
### Bugfix
* fix binary files in FS middleware [#26](https://github.com/jcubic/wayne/issues/26)
* fix Unicode file names in FS middleware [#27](https://github.com/jcubic/wayne/issues/27)

## 0.6.1
### Bugfix
* remove console.log on every request to FS

## 0.6.0
### Features
* add support for 204 HTTP response
* add middleware [#18](https://github.com/jcubic/wayne/issues/18)
* add filesystem middleware [#3](https://github.com/jcubic/wayne/issues/3)
* make 404 and 500 error pages show Wayne in h1 tag

## 0.5.1
### Bugfix
* fix 404 error on async code from a route [#19](https://github.com/jcubic/wayne/issues/19)

## 0.5.0
### Features
* add error handler support [#10](https://github.com/jcubic/wayne/issues/10)

## 0.4.0
### Features
* add path with globs [#16](https://github.com/jcubic/wayne/issues/16)

## 0.3.0
### Features
* add `sse()` method for Server-Sent Events [#12](https://github.com/jcubic/wayne/issues/12)

## 0.2.1
### Bugfix
* fix cross-origin redirect [#2](https://github.com/jcubic/wayne/issues/2)

## 0.2.0
### Features
* allow to use without ES Module [#9](https://github.com/jcubic/wayne/issues/9)
* add redirects [#2](https://github.com/jcubic/wayne/issues/2)

## 0.1.0
* Inital version
