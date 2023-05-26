import { Wayne, FileSystem } from "https://cdn.jsdelivr.net/npm/@jcubic/wayne/index.js";
import FS from "https://cdn.skypack.dev/@isomorphic-git/lightning-fs";
import mime from "https://cdn.skypack.dev/mime";
import path from "https://cdn.skypack.dev/path-browserify";

const { promises: fs } = new FS("__wayne__");

const app = new Wayne();

app.use(FileSystem({ path, fs, mime, prefix: '__fs__' }));

app.get("/foo", (req, res) => {
  res.text("Hello");
});

app.use((err, req, res, next) => {
  const sep = '-'.repeat(80);
  res.text([sep, ':: Wayne', sep, `Error: ${err.message}`, err.stack].join('\n'));
});