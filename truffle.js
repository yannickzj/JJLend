module.exports = {
    networks: {
        development: {
            host: '127.0.0.1',
            port: 8545,
            //gas: 9000000000,
            network_id: '*' // Match any network id
        },
        ganache: {
            host: "127.0.0.1",
            port: 7545,
            //gas: 9000000000,
            network_id: 5777
        },
        private: {
            host: "127.0.0.1",
            port: 8101,
            //gas: 9000000000,
            network_id: 1024
        }
    }
};
