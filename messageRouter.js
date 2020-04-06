const broadcast = (clients, message, fromUser) => {
    return Object.entries(clients)
        .filter(([username, handler]) => handler.isAvailable && username !== fromUser)
        .forEach(([, handler]) => handler.send(message));
};

const route = (clients, message) => {
    const { to, sender } = message;
    
    if (!to) {
        return broadcast(clients, message, sender);
    }

    return clients[to].send({
        ...message,
        isPersonal: true
    });
};

module.exports = {
    route,
    broadcast
};