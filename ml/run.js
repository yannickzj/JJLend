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
        return jjlend.setUpJJCoin(jjcoin.address);
    }).then(function(){
        return jjlend.setUpColToken(coltoken.address);
    }).then(function(){
        promise_list = [];
        for(var ind = 0; ind < 10; ind ++){
            var pro = coltoken.register(web3.eth.accounts[ind], 1000, "audi", "https://www.audi.ca/ca/web/en.html",
                {from: account0});
            promise_list.push(pro);
        }
        return Promise.all(promise_list);
    }).then(function(){
        promise_list = [];
        for (var ind = 0; ind < 10; ind++) {
            var pro = jjcoin.buy({value: 80000, from: web3.eth.accounts[ind]});
            promise_list.push(pro);
        }
        return Promise.all(promise_list);
    });
};