import * as React from 'react';
import { createRoot } from 'react-dom';
import { Wayne } from '@jcubic/wayne';
importScripts('https://cdn.jsdelivr.net/gh/jcubic/static/js/jsdom.min.js');
const { JSDOM } = jsdom;

const pathname = location.pathname.replace(/\/sw.js$/, '');

const Nav = () => {
    return (
        <ul>
          <li><a href={`${pathname}/`}>home</a></li>
          <li><a href={`${pathname}/__about__`}>about</a></li>
          <li><a href={`${pathname}/__contact__`}>contact</a></li>
          <li><a href={`${pathname}/source.jsx`}>Service Worker source</a></li>
        </ul>
    );
}

let globalSetPage;

const App = () => {
    const [page, setPage] = React.useState('root');
    React.useEffect(() => {
        globalSetPage = setPage;
    }, [setPage]);
    return (
        <>
          <Nav/>
          <p>Helo React + Wayne "{page}"</p>
        </>
    );
};

const dom = new JSDOM(`<!DOCTYPE html>
<html>
  <head><title>React App</title></head>
  <body>
    <div id="root"></div>
  </body>
</html>`);

self.window = dom.window;
self.document = self.window.document;

const root_node = document.getElementById('root');

const root = createRoot(root_node);
root.render(<App/>);

function html(res) {
    setTimeout(() => {
        const html = `<!DOCTYPE html>${document.documentElement.outerHTML}`;
        res.html(html);
    }, 0);
}

const app = new Wayne();

app.get('/__*__', (req, res) => {
    globalSetPage(req.params[0]);
    html(res);
});

app.get('/source.jsx', async (req, res) => {
    const text = await fetch('../sw.jsx').then(res => res.text());
    res.text(text);
});
