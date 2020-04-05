const ws = require('ws');
const express = require('express');
const cors = require('cors');
const utils = require('./utils');

const ClientHandler = require('./ClientHandler');

const PORT = process.env.PORT || 8080;
const clients = {};

const app = express();
app.use(cors());

const server = app.listen(PORT, () => console.log(`Listening on ${PORT}`));
const wss = new ws.Server({ server });

const onConnect = (ws) => {
    const clientHandler = new ClientHandler(ws);

    console.log("New client: " + ws);

    const broadcastMessage = (message) => {
        cObject.entries(clients)
            .filter(([username, handler]) => handler.isAvailable && username !== clientHandler.user.username)
            .forEach(([, handler]) => handler.send(message));
    };

    clientHandler.on('received-username', (username) => {
        let broadcastMessageType;

        if (clients[username]) {
            broadcastMessageType = 'user-status-change';

        } else {
            broadcastMessageType = 'user-joined';
        }

        clients[username] = clientHandler;

        broadcastMessage(JSON.stringify({
            type: broadcastMessageType,
            ...clientHandler.user
        }));
    });

    clientHandler.on('message', message => broadcastMessage(JSON.stringify(message)));

    clientHandler.on('user-status-change', () => {
        broadcastMessage(JSON.stringify({
            type: 'user-status-change',
            ...clientHandler.user
        }));
    });

    clientHandler.on('close', () => {
        broadcastMessage(JSON.stringify({
            type: 'user-status-change',
            ...clientHandler.user
        }));
    });

};

wss.on('connection', onConnect);


app.get('/users', (req, res) => res.send(Object.values(clients).map(handler => handler.user)));

app.get('/user/:username', (req, res) => {
    const handler = clients[req.params.username];

    if (handler) {
        res.send(handler.user);
    }
    else {
        res.status(404).send('User not found');
    }
});
