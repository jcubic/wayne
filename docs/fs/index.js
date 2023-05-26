// global: LightningFS, location
const { promises: fs } = new LightningFS("__wayne__");

if ("serviceWorker" in navigator) {
  const scope = location.pathname.replace(/\/[^/]+$/, "/");
  navigator.serviceWorker
    .register("./sw.js", { scope, type: "module" })
    .then(function (reg) {
      reg.addEventListener("updatefound", function () {
        const installingWorker = reg.installing;
        console.log(
          "A new service worker is being installed:",
          installingWorker
        );
      });
      // registration worked
      console.log("Registration succeeded. Scope is " + reg.scope);
      main();
    })
    .catch(function (error) {
      // registration failed
      console.log("Registration failed with " + error);
    });
}

async function main() {
    await fs.writeFile('/foo', 'Hello').then(async () => {
        try {
            await fs.stat('/bar');
        } catch(e) {
            await fs.mkdir('/bar');
        }
        return fs.writeFile('/bar/baz', 'Hello World');
    });
    $('<div/>').appendTo('body').browse({
        root: '/',
        separator: '/',
        contextmenu: true,
        name: 'filestystem',
        create(type, path) {
            if (type === 'file') {
                fs.writeFile(path, '');
            } else {
                fs.mkdir(path);
            }
        },
        dir(pathname) {
            return fs.readdir(pathname).then(async names => {
                const result = {files:[], dirs: []};
                await Promise.all(names.map(name => {
                    const fullname = path.join(pathname, name);
                    return fs.stat(fullname).then(info => {
                        if (info.isFile()) {
                            result.files.push(name);
                        } else if (info.isDirectory()) {
                            result.dirs.push(name);
                        }
                    });
                }));
                return result;
            });
        },
        remove(name) {
            return fs.unlink(name);
        },
        rename(src, dest) {
            console.log({src, dest});
            return fs.rename(src, dest);
        },
        open(filename) {
            fetch(`./__fs__${filename}`)
                .then(res => res.text())
                .then(text => {
                    alert(text);
                });
        }
    });
}
