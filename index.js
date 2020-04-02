const ws = require('ws');
const express = require('express');
const utils = require('./utils');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 8080;

const server = express()
    .use((req, res) => res.send('Hello World'))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new ws.Server({ server });

const clients = new Set();

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
                userId = uuidv4();
                currentClient = {
                    username,
                    socket: ws,
                    userId,
                    status: 'online'
                };

                clients.add(currentClient);

                broadcastMessage(JSON.stringify({
                    type: 'user-joined',
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
        const { userId, username } = currentClient;

        broadcastMessage(JSON.stringify({
            type: 'user-left',
            userId,
            username
        }));

        clients.delete(currentClient);
    })
};

wss.on('connection', onConnect);
