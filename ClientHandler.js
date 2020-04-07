const { v4: uuidv4 } = require('uuid');

class ClientHandler {
    constructor(webSocket) {
        this.webSocket = webSocket;
        this.callbacks = {};
        this.currentUser = {
            username: null,
            status: 'offline'
        };


        webSocket.on('message', (rawMessage) => {
            const parsedMessage = JSON.parse(rawMessage);

            switch (parsedMessage.type) {
                case 'message':
                    const targetMessage = this.attachMessageId(parsedMessage);
                    this.invokeCallback('message', targetMessage);
                    break;
                case 'user-connect':
                    const username = parsedMessage.username;
                    this.currentUser = {
                        ...this.currentUser,
                        username,
                        status: 'online'
                    };

                    this.invokeCallback('received-username', username)
                    break;
                case 'user-status-change':
                    const { status } = parsedMessage;
                    this.currentUser.status = status;
                    this.invokeCallback('user-status-change', status);
                    break;
                default:
                    break;
            }
        });

        webSocket.on('close', this.kill);
    }

    attachMessageId = (parsedMessage) => {
        const messageUuid = uuidv4();

        const targetMessage = {
            id: messageUuid,
            ...parsedMessage
        };

        return targetMessage;
    };

    invokeCallback = (type, param) => {
        const callbackToRun = this.callbacks[type];

        if (callbackToRun) {
            callbackToRun(param);
        }
    };

    on = (type, callback) => {
        if (!this.callbacks[type]) {
            this.callbacks[type] = callback;
        }
    }

    kill = () => {
        this.currentUser.status = 'offline';
        this.invokeCallback('close');
        this.webSocket = null;
    }

    send = (message) => {
        if (this.webSocket !== null) {
            let finalMessage;

            if (typeof (message) === 'object') {
                finalMessage = JSON.stringify(message)
            }
            else {
                finalMessage = message;
            }

            this.webSocket.send(finalMessage);
        }
    };

    get user() {
        return this.currentUser;
    }

    get isAvailable() {
        return this.webSocket !== null && this.currentUser.status !== 'offline';
    }
};

module.exports = ClientHandler;