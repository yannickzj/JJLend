var JJLend = artifacts.require("./JJLendRequest.sol");
var JJCoin = artifacts.require("./JJCoin.sol");
var ColToken = artifacts.require("./ColToken.sol");


module.exports = function(callback) {
    var jjlend, jjcoin, coltoken;

    var p1 = JJLend.deployed().then(function(addr){jjlend = addr});
    var p2 = JJCoin.deployed().then(function(addr){jjcoin = addr});
    var p3 = ColToken.deployed().then(function(addr){coltoken = addr});

    var account0 = web3.eth.accounts[0];
    var index1 = Math.floor(Math.random() * 10);
    var index2 = Math.floor(Math.random() * 10);
    while(index1 === index2 || index1 === 0 || index2 === 0){
        index1 = Math.floor(Math.random() * 10);
        index2 = Math.floor(Math.random() * 10);
    }
    console.log(index1 + " " + index2);
    var account1 = web3.eth.accounts[index1];
    var account2 = web3.eth.accounts[index2];

    console.log("acc0 " + account0);
    console.log("acc1 " + account1);
    console.log("acc2 " + account2);

    var coltokenIndex = index1;
    var requestAddr;

    Promise.all([p1, p2, p3]).then(function() {
        return coltoken.getObjectOwner(coltokenIndex);
    }).then(function(owner){
        console.log("col token: " + coltokenIndex + " " + owner);
        return coltoken.approve(jjlend.address, coltokenIndex, {from: account1});
    }).then(function(){
        return jjcoin.balanceOf(account1);
    }).then(function(balance){
        console.log("balance acc1: " + account1 + " " + balance);
        return jjcoin.balanceOf(account2);
    }).then(function(balance) {
        console.log("balance acc2: " + account2 + " " + balance);
        return jjlend.postBorrowRequest(10, 15, 600, coltokenIndex, {from: account1});
    }).then(function(){
        return jjlend.getUserRequest(account1, 'waitingForLender', {from: account0});
    }).then(function(result){
        var len = result.length;
        var addr = result[len - 1];
        requestAddr = addr;
        console.log(result);
        console.log(requestAddr);
        return jjlend.getRequestDetails(addr);
    }).then(function(details){
        console.log(details);
        console.log("stage 3");
        return jjcoin.approve(jjlend.address, 10, {from: account2});
    }).then(function() {
        console.log("request addr " + requestAddr);
        return jjlend.acceptBorrowRequest(requestAddr, {from: account2});
    }).then(function(){
        return jjlend.getUserRequest(account1, 'waitingForPayback', {from: account0});
    }).then(function(result){
        console.log("waiting for payback " + result);
        var len = result.length;
        var addr = result[len - 1];
        console.log(addr);
        return jjlend.getRequestDetails(addr);
    }).then(function(details){
        console.log(details);
        return jjcoin.balanceOf(account1);
    }).then(function(balance){
        console.log("balance acc1: " + account1 + " " + balance);
        return jjcoin.balanceOf(account2);
    }).then(function(balance) {
        console.log("balance acc2: " + account2 + " " + balance);
        console.log("stage 4");
        return jjcoin.approve(jjlend.address, 15, {from: account1});
    }).then(function(){
        return jjlend.paybackLoan(requestAddr, {from: account1});
    }).then(function(){
        return jjlend.getUserRequest(account1, 'closed', {from: account0});
    }).then(function(result){
        var len = result.length;
        var addr = result[len - 1];
        for(var ind = len - 2; ind > -1 && addr === '0x0000000000000000000000000000000000000000'; ind --){
            addr = result[ind];
        }
        console.log(addr);
        return jjlend.getRequestDetails(addr);
    }).then(function(details) {
        console.log(details);
        return jjcoin.balanceOf(account1);
    }).then(function(balance){
        console.log("balance acc1: " + account1 + " " + balance);
        return jjcoin.balanceOf(account2);
    }).then(function(balance) {
        console.log("balance acc2: " + account2 + " " + balance);
        return coltoken.getObjectOwner(coltokenIndex);
    }).then(function(owner){
        console.log("col token: " + coltokenIndex + " " + owner);
    });
};