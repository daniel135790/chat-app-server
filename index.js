const ws = require("ws");
const wss = new ws.Server({port: 8080});

const clients = new Set();

const onConnect = (ws) => {
    clients.add(ws);
    console.log(ws);

    ws.on('message', (message) => {
        console.log(message);
        clients.forEach(client => client.send(message));
    });

    ws.on('close', () => {
        console.log(ws + ' closed');
        clients.delete(ws);
    })
};

wss.on('connection', onConnect);
