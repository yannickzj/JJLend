var JJCoinContract = artifacts.require("./JJCoin.sol");
var JJLendContract = artifacts.require("./JJLendRequest.sol");
var ColTokenContract = artifacts.require("./ColToken.sol");
const assert = require('assert');

function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

module.exports = function(callback) {

    var start = new Date();
    var startTime = start.getTime();

    var jjCoin;
    var colToken;
    var jjLend;

    var jjcoinCreator;
    var coltokenCreator;
    var jjlendCreator;
    var someone;
    var borrower;
    var lender;
    web3.eth.getAccounts(function(err,res) {
        accounts = res;
        jjcoinCreator = accounts[0];
        coltokenCreator = accounts[1];
        jjlendCreator = accounts[2];
        borrower = accounts[3];
        lender = accounts[4];
        someone = accounts[5]
    });

    var waitForLender = "waitingForLender";

    var colValue = 10000;
    var colName = "car";
    var colInfolink = "https://borrower_car.com";
    var colID;

    var lenderBuy = 2000000;
    var borrowerBuy = 100000;

    var borrowJJCoin = 1000;
    var paybackJJCoin = 1100;
    var expiredTime = 1;
    var waitTime = 2000;
    var borrowerRequestID;

    return JJCoinContract.new().then(function (instance) {


        console.info("Default request lending");
        console.info("============================================================");
        console.info("Step 1: initialization");
        jjCoin = instance;
        console.info("JJCoin address: " + jjCoin.address);
        return ColTokenContract.new({from: coltokenCreator});
    }).then(function (instance) {
        colToken = instance;
        console.info("ColToken address: " + colToken.address);
        return JJLendContract.new({from: jjlendCreator});
    }).then(function (instance) {
        jjLend = instance;
        console.info("JJLend address: " + jjLend.address);
        return jjLend.setUpJJCoin(jjCoin.address, {from: jjlendCreator});
    }).then(function () {
        console.info("JJLend set up JJCoin!");
        return jjLend.setUpColToken(colToken.address, {from: jjlendCreator});
    }).then(function () {
        console.info("JJLend set up ColToken!");
        return colToken.register(borrower, colValue, colName, colInfolink, {from: coltokenCreator});
    }).then(function () {
        return colToken.numObject.call();
    }).then(function (val) {
        colID = val.toNumber() - 1;
        assert.equal(0, colID, "borrower's colID does not match");
        console.info("borrower collateral ID: " + colID);
        return jjCoin.buy({from: lender, value: lenderBuy});
    }).then(function () {
        return jjCoin.balanceOf(lender, {from: lender});
    }).then(function (val) {
        assert.equal(lenderBuy / 1000, val.toNumber(), "lender's balance does not match");
        console.info("lender JJCoin balance: " + val.toNumber());
        return jjCoin.buy({from: borrower, value: borrowerBuy});
    }).then(function () {
        return jjCoin.balanceOf(borrower, {from: borrower});
    }).then(function (val) {
        assert.equal(borrowerBuy / 1000, val.toNumber(), "borrower's balance does not match");
        console.info("borrower JJCoin balance: " + val.toNumber());
        console.info("============================================================");


    }).then(function () {
        console.info("Step 2: borrower posts the request");
        return colToken.approve(jjLend.address, colID, {from: borrower});
    }).then(function () {
        return colToken.allowanceOf(borrower, colID);
    }).then(function (val) {
        assert.equal(jjLend.address, val);
        console.info("borrower allows collateral[" + colID + "] to JJLend: " + (val == jjLend.address));
    }).then(function () {
        return colToken.getObjectOwner(colID);
    }).then(function (val) {
        assert.equal(borrower, val);
        console.info("collateral[" + colID + "] owned by borrower: " + (val == borrower));
        return jjLend.postBorrowRequest(borrowJJCoin, paybackJJCoin, expiredTime, colID, {from: borrower});
    }).then(function () {
        console.info("borrower successfully posted request!");
        return jjLend.getUserRequest(borrower, waitForLender);
    }).then(function (result) {
        if (result.length == 0) {
            borrowerRequestID = result;
        } else {
            borrowerRequestID = result[result.length - 1];
        }
        console.info("borrower new request: " + borrowerRequestID);
        return jjLend.getRequestDetails(borrowerRequestID);
    }).then(function (result) {
        console.info("request details: {");
        console.info("    borrower: " + result[0]);
        console.info("    borrowJJCoin: " + result[1].toNumber());
        console.info("    paybackJJCoin: " + result[2].toNumber());
        console.info("    expiredTime(s): " + result[3].toNumber());
        console.info("    collateral: " + result[4].toNumber());
        console.info("    startTime: " + result[5].toNumber());
        console.info("    lender: " + result[6]);
        console.info("}");
    }).then(function () {
        return colToken.getObjectOwner(colID);
    }).then(function (val) {
        assert.equal(jjLend.address, val);
        console.info("collateral[" + colID + "] owned by JJLend: " + (val == jjLend.address));
        console.info("============================================================");


    }).then(function () {
        console.info("Step 3: lender accepts the request");
        return jjCoin.approve(jjLend.address, borrowJJCoin, {from: lender});
    }).then(function () {
        return jjCoin.allowanceOf(lender, jjLend.address);
    }).then(function (val) {
        console.info("lender allows " + val.toNumber() + " JJCoin to JJLend");
        return jjLend.acceptBorrowRequest(borrowerRequestID, {from: lender});
    }).then(function () {
        console.info("lender successfully accepted borrower's request!");
        return jjCoin.balanceOf(borrower, {from: borrower});
    }).then(function (val) {
        console.info("borrower JJCoin balance: " + val.toNumber());
        return jjCoin.balanceOf(lender, {from: lender});
    }).then(function (val) {
        console.info("lender JJCoin balance: " + val.toNumber());
        return jjLend.getRequestDetails(borrowerRequestID);
    }).then(function (result) {
        console.info("request details: {");
        console.info("    borrower: " + result[0]);
        console.info("    borrowJJCoin: " + result[1].toNumber());
        console.info("    paybackJJCoin: " + result[2].toNumber());
        console.info("    expiredTime(s): " + result[3].toNumber());
        console.info("    collateral: " + result[4].toNumber());
        console.info("    startTime: " + result[5].toNumber());
        console.info("    lender: " + result[6]);
        console.info("}");
    }).then(function () {
        return colToken.getObjectOwner(colID);
    }).then(function (val) {
        assert.equal(jjLend.address, val);
        console.info("collateral[" + colID + "] owned by JJLend: " + (val == jjLend.address));
        console.info("============================================================");


    }).then(function () {
        return sleep(waitTime);
    }).then(function () {
        console.info("Step 4: loan default");
        return jjLend.defaultLoan(borrowerRequestID, {from: someone});
    }).then(function () {
        console.info("collateral owned by lender!")
        return jjCoin.balanceOf(borrower, {from: borrower});
    }).then(function (val) {
        console.info("borrower JJCoin balance: " + val.toNumber());
        return jjCoin.balanceOf(lender, {from: lender});
    }).then(function (val) {
        console.info("lender JJCoin balance: " + val.toNumber());
    }).then(function () {
        return colToken.getObjectOwner(colID);
    }).then(function (val) {
        assert.equal(lender, val);
        console.info("collateral[" + colID + "] returned to lender: " + (val == lender));
        return jjLend.getCredit(borrower);
    }).then(function (val) {
        assert.equal(0, val.toNumber())
        console.info("borrower CreToken: " + val.toNumber());
        console.info("============================================================");

        var end = new Date();
        var endTime = end.getTime();
        console.info("Elapsed time: " + (endTime - startTime - waitTime) / 1000.0 + "s");
    });
};

