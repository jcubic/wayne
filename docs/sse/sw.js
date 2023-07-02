import { Wayne } from 'https://cdn.jsdelivr.net/npm/@jcubic/wayne';

const app = new Wayne();
let stream;
let hub;

class EventEmitter {
    constructor() {
        this.handlers = {};
    }
    on(event, handler) {
        if (!this.handlers[event]) {
            this.handlers[event] = [];
        }
        this.handlers[event].push(handler);
    }
    emit(event, data) {
        if (this.handlers[event]) {
            this.handlers[event].forEach(handler => {
                handler(data);
            });
        }
    }
    is_empty(event) {
        return Boolean(this.handlers[event] && this.handlers[event].length);
    }
    off(event, handler = null) {
        if (handler === null) {
            delete this.handlers[event];
        } else {
            const handlers = this.handlers[event];
            if (handlers) {
                this.handlers[event] = handlers.filter(h => {
                    return handler !== h;
                });
            }
        }
    }
}

app.get('/stream', (req, res) => {
    if (!hub) {
        init();
    }
    function handler(data) {
        stream.send({ event: 'time', data });
    }
    const stream = res.sse({
        onClose() {
            hub.off('data', handler);
            if (hub.is_empty('data')) {
                stream.close();
                hub = stream = null;
            }
        }
    });
    hub.on('data', handler);
});

function init() {
    stream = new EventSource('https://jcubic.pl/stream.php');
    hub = new EventEmitter();
    stream.addEventListener('time', (event) => {
        hub.emit('data', event.data);
    });
}

// take control of uncontrolled clients on first load
// ref: https://web.dev/service-worker-lifecycle/#clientsclaim
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

