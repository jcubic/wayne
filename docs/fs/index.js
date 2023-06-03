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

function is_image(path) {
    return path.match(/(png|jpg)$/);
}

function fetch_text(url) {
    return fetch(url).then(res => res.text());
}

async function main() {
    function show_modal(type) {
        $dialog.attr('class', type);
        $dialog.get(0).showModal();
    }
    await fetch('./cover.png').then(res => res.arrayBuffer()).then(data => {
       return fs.writeFile('/image.png', data);
    });
    await fs.writeFile('/źdźbło', 'Zażółć źdżbło');
    await fs.writeFile('/zdzblo', 'Zażółć źdżbło');
    await fs.writeFile('/foo', 'Hello').then(async () => {
        try {
            await fs.stat('/bar');
        } catch(e) {
            await fs.mkdir('/bar');
        }
        return fs.writeFile('/bar/baz', 'Hello World');
    });
    const $dialog = $('dialog');
    const $img = $dialog.find('img');
    const $output = $dialog.find('pre');
    $dialog.on('click', 'button', () => {
        $dialog.get(0).close();
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
            return fs.rename(src, dest);
        },
        open(filename) {
            const path = `./__fs__${filename}`;
            if (is_image(filename)) {
                $img.attr('src', path);
                show_modal('image');
            } else {
                fetch_text(path).then(text => {
                    $output.text(text);
                    show_modal('text');
                });
            }
        }
    });
}


