const ws = require('ws');
const express = require('express');
const cors = require('cors');
const utils = require('./utils');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 8080;
const clients = new Set();

const app = express();
app.use(cors());

const server = app.listen(PORT, () => console.log(`Listening on ${PORT}`));
const wss = new ws.Server({ server });

const attachMessageId = (parsedMessage) => {
    const messageUuid = uuidv4();

    const targetMessage = {
        id: messageUuid,
        ...parsedMessage
    };

    return targetMessage;
};

const getActiveUsers = () => [...clients]
    .map(utils.formatClient);

const getClient = username => [...clients].find(client => client.username === username);

const getUser = (username) => {
    const client = getClient(username);

    if (client) {
        return utils.formatClient(client);
    }

    return null
};

const onConnect = (ws) => {
    let currentClient = null;

    const broadcastMessage = (message) => {
        [...clients]
            .filter(client => client.socket !== ws)
            .forEach(client => client.socket.send(message));
    };

    console.log("New client: " + ws);
    ws.send(JSON.stringify({
        type: 'users-list',
        users: getActiveUsers()
    }));

    ws.on('message', (rawMessage) => {
        const parsedMessage = JSON.parse(rawMessage);
        const username = parsedMessage.username;

        switch (parsedMessage.type) {
            case 'message':
                const targetMessage = attachMessageId(parsedMessage);
                const targetMessageString = JSON.stringify(targetMessage);
                broadcastMessage(targetMessageString);
                break;
            case 'user-connect':
                const existingClient = getClient(username);
                let broadcastMessageType;

                if (!existingClient) {
                    userId = uuidv4();
                    currentClient = {
                        username,
                        userId,
                    };

                    clients.add(currentClient);
                    broadcastMessageType = 'user-joined';
                }
                else {
                    currentClient = getClient(username);
                    broadcastMessageType = 'user-status-change';
                }

                currentClient.socket = ws;
                currentClient.status = 'online'

                broadcastMessage(JSON.stringify({
                    type: broadcastMessageType,
                    ...utils.formatClient(currentClient)
                }));

                break;
            case 'user-status-change':
                const { status } = parsedMessage;
                currentClient.status = status;

                broadcastMessage(JSON.stringify({
                    type: 'user-status-change',
                    ...utils.formatClient(currentClient)
                }));

                break;
            default:
                break;
        }
    });

    ws.on('close', () => {
        console.log(ws + ' closed');
        currentClient.status = 'offline';

        broadcastMessage(JSON.stringify({
            type: 'user-status-change',
            status: 'offline',
            ...utils.formatClient(currentClient)
        }));
    })
};

wss.on('connection', onConnect);


app.get('/users', (req, res) => res.send([...clients].map(utils.formatClient)));

app.get('/user/:username', (req, res) => {
    const user = getUser(req.params.username);

    if (user) {
        res.send(user);
    }
    else {
        res.status(404).send('User not found');
    }
});
