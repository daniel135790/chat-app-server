const ws = require('ws');
const {v4: uuidv4} = require('uuid');

const PORT = process.env.PORT || 8080;
const wss = new ws.Server({port: PORT});

const clients = new Set();

const attachMessageId = (rawMessage) => {
    const parsedMessage = JSON.parse(rawMessage);
    const messageUuid = uuidv4();

    const targetMessage = {
        id: messageUuid,
        ...parsedMessage
    };

    return targetMessage;
};

const onConnect = (ws) => {
    clients.add(ws);
    console.log("New client: " + ws);

    ws.on('message', (message) => {
        console.log(message);
        const targetMessage = attachMessageId(message);
        const targetMessageString = JSON.stringify(targetMessage);

        [...clients]
            .filter(client => client !== ws)
            .forEach(client => client.send(targetMessageString));
    });

    ws.on('close', () => {
        console.log(ws + ' closed');
        clients.delete(ws);
    })
};

wss.on('connection', onConnect);
