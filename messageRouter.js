const broadcast = (clients, message, fromUser) => {
    return Object.entries(clients)
        .filter(([username, handler]) => handler.isAvailable && username !== fromUser)
        .forEach(([, handler]) => handler.send(message));
};

const route = (clients, message) => {
    const { to, sender } = message;
    
    if (!to || to === 'global') {
        return broadcast(clients, message, sender);
    }

    const targetClient = clients[to];
    
    if (targetClient) {
        targetClient.send({
            ...message,
            isPersonal: true
        });
    }
    else {
        console.error('Target client not found: ' + to)
    }
};

module.exports = {
    route,
    broadcast
};