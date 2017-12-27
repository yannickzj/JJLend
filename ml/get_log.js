var JJLend = artifacts.require("./JJLendRequest.sol");
var JJCoin = artifacts.require("./JJCoin.sol");
var ColToken = artifacts.require("./ColToken.sol");


module.exports = function(callback) {
    var jjlend, jjcoin, coltoken;

    var p1 = JJLend.deployed().then(function(addr){jjlend = addr});
    var p2 = JJCoin.deployed().then(function(addr){jjcoin = addr});
    var p3 = ColToken.deployed().then(function(addr){coltoken = addr});

    var account0 = web3.eth.accounts[0];

    console.log("acc0 " + account0);

    Promise.all([p1, p2, p3]).then(function() {
        console.log("jjcoin transfer");
        var allEvent = jjcoin.Transfer({}, {fromBlock: 0, toBlock: 'latest'});
        allEvent.get(function(error, logs){
            logs.forEach(function(log){
                console.log("coin: " + JSON.stringify(log.args));
            });
        });

        console.log("coltoken transfer");
        allEvent = coltoken.TransferOwnership({}, {fromBlock: 0, toBlock: 'latest'});
        allEvent.get(function(error, logs){
            logs.forEach(function(log){
                console.log("col: " + JSON.stringify(log.args));
            });
        });

        console.log("jjlend");
        allEvent = jjlend.Create({}, {fromBlock: 0, toBlock: 'latest'});
        allEvent.get(function(error, logs){
            logs.forEach(function(log){
                console.log("jjlend create: " + JSON.stringify(log.args));
            });
        });
        allEvent = jjlend.Accept({}, {fromBlock: 0, toBlock: 'latest'});
        allEvent.get(function(error, logs){
            logs.forEach(function(log){
                console.log("jjlend accept: " + JSON.stringify(log.args));
            });
        });
        allEvent = jjlend.Payback({}, {fromBlock: 0, toBlock: 'latest'});
        allEvent.get(function(error, logs){
            logs.forEach(function(log){
                console.log("jjlend payback: " + JSON.stringify(log.args));
            });
        });
    });
};