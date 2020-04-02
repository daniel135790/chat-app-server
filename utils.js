const formatClient = (client) => { 
    const { socket, ...formattedUser } = client;
    return formattedUser;
};

module.exports = {
    formatClient
};