const ws = require('ws');
const express = require('express');
const cors = require('cors');

const messageRouter = require('./messageRouter');
const ClientHandler = require('./ClientHandler');

const PORT = process.env.PORT || 8080;
const clients = {};

const app = express();
app.use(cors());

const server = app.listen(PORT, () => console.log(`Listening on ${PORT}`));
const wss = new ws.Server({ server });

const onConnect = (ws) => {
    const clientHandler = new ClientHandler(ws);
    let currentUsername;

    console.log("New client: " + ws);

    clientHandler.on('received-username', (username) => {
        let broadcastMessageType;

        if (clients[username]) {
            broadcastMessageType = 'user-status-change';

        } else {
            broadcastMessageType = 'user-joined';
        }

        clients[username] = clientHandler;
        currentUsername = username;

        messageRouter.broadcast(clients, {
            type: broadcastMessageType,
            ...clientHandler.user
        }, username);
    });

    clientHandler.on('message', message => messageRouter.route(clients, message));

    clientHandler.on('user-status-change', () => {
        messageRouter.broadcast(clients, {
            type: 'user-status-change',
            ...clientHandler.user
        }, currentUsername);
    });

    clientHandler.on('close', () => {
        messageRouter.broadcast(clients, {
            type: 'user-status-change',
            ...clientHandler.user
        }, currentUsername);
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
