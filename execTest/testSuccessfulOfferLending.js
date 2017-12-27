var JJCoinContract = artifacts.require("./JJCoin.sol");
var JJLendOfferContract = artifacts.require("./JJLendOffer.sol");
var ColTokenContract = artifacts.require("./ColToken.sol");
const assert = require('assert');


module.exports = function(callback) {

    var start = new Date();
    var startTime = start.getTime();

    var jjCoin;
    var colToken;
    var jjLendOffer;

    var jjcoinCreator;
    var coltokenCreator;
    var jjlendCreator;
    var borrower1;
    var borrower2;
    var lender;
    web3.eth.getAccounts(function(err,res) {
        accounts = res;
        jjcoinCreator = accounts[0];
        coltokenCreator = accounts[1];
        jjlendCreator = accounts[2];
        borrower1 = accounts[3];
        borrower2 = accounts[4];
        lender = accounts[5];
    });

    var waitForBorrower = "waitingForBorrower";

    var colValue1 = 10000;
    var colName1 = "car1";
    var colInfolink1 = "https://borrower1_car1.com";
    var colID1;
    var colValue2 = 100000;
    var colName2 = "car2";
    var colInfolink2 = "https://borrower2_car2.com";
    var colID2;

    var lenderBuy = 2000000;
    var borrowerBuy = 100000;

    var lendJJCoin = 1000;
    var paybackJJCoin = 1100;
    var expiredTime = 10;
    var requirement = "should be a car";
    var lendOfferID;

    return JJCoinContract.new().then(function (instance) {


        console.info("Successful offer lending");
        console.info("============================================================");
        console.info("Step 1: initialization");
        jjCoin = instance;
        console.info("JJCoin address: " + jjCoin.address);
        return ColTokenContract.new({from: coltokenCreator});
    }).then(function (instance) {
        colToken = instance;
        console.info("ColToken address: " + colToken.address);
        return JJLendOfferContract.new({from: jjlendCreator});
    }).then(function (instance) {
        jjLendOffer = instance;
        console.info("JJLend address: " + jjLendOffer.address);
        return jjLendOffer.setUpJJCoin(jjCoin.address, {from: jjlendCreator});
    }).then(function () {
        console.info("JJLend set up JJCoin!");
        return jjLendOffer.setUpColToken(colToken.address, {from: jjlendCreator});
    }).then(function () {
        console.info("JJLend set up ColToken!");
        return colToken.register(borrower1, colValue1, colName1, colInfolink1, {from: coltokenCreator});
    }).then(function () {
        return colToken.numObject.call();
    }).then(function (val) {
        colID1 = val.toNumber() - 1;
        assert.equal(0, colID1, "borrower1's colID1 does not match");
        console.info("borrower1 collateral ID: " + colID1);
        return colToken.register(borrower2, colValue2, colName2, colInfolink2, {from: coltokenCreator});
    }).then(function () {
        return colToken.numObject.call();
    }).then(function (val) {
        colID2 = val.toNumber() - 1;
        assert.equal(1, colID2, "borrower2's colID2 does not match");
        console.info("borrower2 collateral ID: " + colID2);
        return jjCoin.buy({from: lender, value: lenderBuy});
    }).then(function () {
        return jjCoin.balanceOf(lender, {from: lender});
    }).then(function (val) {
        assert.equal(lenderBuy / 1000, val.toNumber(), "lender's balance does not match");
        console.info("lender JJCoin balance: " + val.toNumber());
        return jjCoin.buy({from: borrower1, value: borrowerBuy});
    }).then(function () {
        return jjCoin.balanceOf(borrower1, {from: borrower1});
    }).then(function (val) {
        assert.equal(borrowerBuy / 1000, val.toNumber(), "borrower1's balance does not match");
        console.info("borrower1 JJCoin balance: " + val.toNumber());
        return jjCoin.buy({from: borrower2, value: borrowerBuy});
    }).then(function () {
        return jjCoin.balanceOf(borrower2, {from: borrower2});
    }).then(function (val) {
        assert.equal(borrowerBuy / 1000, val.toNumber(), "borrower2's balance does not match");
        console.info("borrower2 JJCoin balance: " + val.toNumber());
        console.info("============================================================");


    }).then(function () {
        console.info("Step 2: lender posts lending offer");
        return jjCoin.approve(jjLendOffer.address, lendJJCoin, {from: lender});
    }).then(function () {
        return jjCoin.allowanceOf(lender, jjLendOffer.address);
    }).then(function (val) {
        console.info("lender allows " + val.toNumber() + " JJCoin to JJLend");
        return jjLendOffer.postLendOffer(lendJJCoin, paybackJJCoin, expiredTime, requirement, {from: lender});
    }).then(function () {
        console.info("lender successfully post lending offer!");
        return jjLendOffer.getUserOffer(lender, waitForBorrower);
    }).then(function (result) {
        if (result.length == 0) {
            lendOfferID = result;
        } else {
            lendOfferID = result[result.length - 1];
        }
        console.info("lender new offer: " + lendOfferID);
        return jjCoin.balanceOf(lender, {from: lender});
    }).then(function (val) {
        console.info("lender JJCoin balance: " + val.toNumber());
        return jjCoin.balanceOf(jjLendOffer.address, {from: jjLendOffer.address});
    }).then(function (val) {
        console.info("JJLendOffer JJCoin balance: " + val.toNumber());
        return jjLendOffer.getOfferDetails(lendOfferID);
    }).then(function (result) {
        console.info("offer details: {");
        console.info("    borrower: " + result[0]);
        console.info("    lendJJCoin: " + result[1].toNumber());
        console.info("    paybackJJCoin: " + result[2].toNumber());
        console.info("    expiredTime(s): " + result[3].toNumber());
        console.info("    collateral: " + result[4].toNumber());
        console.info("    startTime: " + result[5].toNumber());
        //console.info("    requirement: " + result[6]);
        console.info("    lender: " + result[6]);
        console.info("}");
        console.info("============================================================");


    }).then(function () {
        console.info("Step 3: borrowers apply for loan");
        return colToken.approve(jjLendOffer.address, colID1, {from: borrower1});
    }).then(function () {
        return colToken.allowanceOf(borrower1, colID1);
    }).then(function (val) {
        assert.equal(jjLendOffer.address, val);
        console.info("borrower1 allows collateral[" + colID1 + "] to JJLendOffer: " + (val == jjLendOffer.address));
    }).then(function () {
        return colToken.getObjectOwner(colID1);
    }).then(function (val) {
        assert.equal(borrower1, val);
        console.info("collateral[" + colID1 + "] owned by borrower1: " + (val == borrower1));
        return jjLendOffer.applyForLoan(lendOfferID, colID1, {from: borrower1});
    }).then(function () {
        console.info("borrower1 successfully apply for loan!");
        return colToken.approve(jjLendOffer.address, colID2, {from: borrower2});
    }).then(function () {
        return colToken.allowanceOf(borrower2, colID2);
    }).then(function (val) {
        assert.equal(jjLendOffer.address, val);
        console.info("borrower2 allows collateral[" + colID2 + "] to JJLendOffer: " + (val == jjLendOffer.address));
    }).then(function () {
        return colToken.getObjectOwner(colID2);
    }).then(function (val) {
        assert.equal(borrower2, val);
        console.info("collateral[" + colID2 + "] owned by borrower2: " + (val == borrower2));
        return jjLendOffer.applyForLoan(lendOfferID, colID2, {from: borrower2});
    }).then(function () {
        console.info("borrower2 successfully apply for loan!");
        console.info("============================================================");


    }).then(function () {
        console.info("Step 4: lender accepts borrower2's application");
        return jjLendOffer.acceptBorrower(lendOfferID, borrower2, {from: lender});
    }).then(function () {
        console.info("lender successfully accepted borrower2!");
        return jjCoin.balanceOf(borrower2, {from: borrower2});
    }).then(function (val) {
        console.info("borrower2 JJCoin balance: " + val.toNumber());
        return jjCoin.balanceOf(jjLendOffer.address, {from: jjLendOffer.address});
    }).then(function (val) {
        console.info("JJLendOffer JJCoin balance: " + val.toNumber());
        return jjLendOffer.getOfferDetails(lendOfferID);
    }).then(function (result) {
        console.info("offer details: {");
        console.info("    borrower: " + result[0]);
        console.info("    lendJJCoin: " + result[1].toNumber());
        console.info("    paybackJJCoin: " + result[2].toNumber());
        console.info("    expiredTime(s): " + result[3].toNumber());
        console.info("    collateral: " + result[4].toNumber());
        console.info("    startTime: " + result[5].toNumber());
        //console.info("    requirement: " + result[6]);
        console.info("    lender: " + result[6]);
        console.info("}");
    }).then(function () {
        return colToken.getObjectOwner(colID2);
    }).then(function (val) {
        assert.equal(jjLendOffer.address, val);
        console.info("collateral[" + colID2 + "] owned by JJLendOffer: " + (val == jjLendOffer.address));
        console.info("============================================================");


    }).then(function () {
        console.info("Step 5: borrower2 paybacks the loan");
        return jjCoin.approve(jjLendOffer.address, paybackJJCoin, {from: borrower2});
    }).then(function () {
        return jjCoin.allowanceOf(borrower2, jjLendOffer.address);
    }).then(function (val) {
        assert(paybackJJCoin, val);
        console.info("borrower2 allows " + val.toNumber() + " JJCoin to JJLendOffer");
        return jjLendOffer.paybackLoan(lendOfferID, {from: borrower2});
    }).then(function () {
        console.info("borrower2 successfully paid back loan!")
        return jjCoin.balanceOf(borrower2, {from: borrower2});
    }).then(function (val) {
        console.info("borrower2 JJCoin balance: " + val.toNumber());
        return jjCoin.balanceOf(lender, {from: lender});
    }).then(function (val) {
        console.info("lender JJCoin balance: " + val.toNumber());
        return colToken.getObjectOwner(colID2);
    }).then(function (val) {
        assert.equal(borrower2, val);
        console.info("collateral[" + colID2 + "] returned to borrower2: " + (val == borrower2));
        return jjLendOffer.getCredit(borrower2);
    }).then(function (val) {
        assert.equal(lendJJCoin / 1000, val.toNumber());
        console.info("borrower2 CreToken: " + val.toNumber());
        console.info("============================================================");

        var end = new Date();
        var endTime = end.getTime();
        console.info("Elapsed time: " + (endTime - startTime) / 1000.0 + "s");
    });
};

