pragma solidity ^0.4.18;


import './CreToken.sol';
import './LendOffer.sol';


interface JJCoinInterface {
    function balanceOf(address) public constant returns (uint);

    function transferFrom(address, address, uint) public returns (bool);

    function transfer(address, uint) public;
}


interface ColTokenInterface {
    function transferOwnershipFrom(address, address, uint) public returns (bool);

    function transferOwnership(address, uint) public;

    function getObjectOwner(uint) public constant returns (address);
}


contract JJLendOffer {

    // state variables
    JJCoinInterface jjbank;

    CreToken jjcredit;

    ColTokenInterface jjcollateral;

    address public owner;

    uint public waitingForBorrowerNum;

    uint public waitingForPaybackNum;

    uint public closedNum;

    uint public totalAccountNum;

    mapping (uint => address) allAccountList;

    mapping (address => address[]) historyPerAccount;

    uint creTokenRate = 1000;

    // functions
    function JJLendOffer() public {
        jjcredit = new CreToken();
        owner = msg.sender;
    }

    function setUpJJCoin(address jjCoinAddress) public onlyByOwner {
        jjbank = JJCoinInterface(jjCoinAddress);
    }

    function setUpColToken(address colTokenAddress) public onlyByOwner {
        jjcollateral = ColTokenInterface(colTokenAddress);
    }

    function postLendOffer(uint _lend_jjcoin,
    uint _payback_jjcoin, uint _expired_time, string _requirement) public setUpReady returns (bool success) {
        address lender = msg.sender;
        jjbank.transferFrom(lender, this, _lend_jjcoin);

        LendOffer offer = new LendOffer();
        offer.setData(lender, _lend_jjcoin, _payback_jjcoin, _expired_time, _requirement);

        if (historyPerAccount[lender].length == 0) {
            allAccountList[totalAccountNum] = lender;
            totalAccountNum ++;
        }
        historyPerAccount[lender].push(offer);
        waitingForBorrowerNum++;
        success = true;
    }

    function cancelLendOffer(address _offer) public setUpReady returns (bool success) {
        LendOffer offer = LendOffer(_offer);
        address lender = offer.lender();
        require(lender == msg.sender);

        offer.cancelOffer();
        jjbank.transfer(lender, offer.lend_jjcoin());
        success = true;
    }


    function applyForLoan(address _offer, uint _col_token) public setUpReady returns (bool success) {
        LendOffer offer = LendOffer(_offer);
        address borrower = msg.sender;
        address lender = offer.lender();
        require(lender != borrower);
        require(borrower == jjcollateral.getObjectOwner(_col_token));

        offer.apply(borrower, _col_token);
        success = true;
    }


    function acceptBorrower(address _offer, address _borrower) public setUpReady returns (bool success) {
        LendOffer offer = LendOffer(_offer);
        address lender = offer.lender();
        uint amount = offer.lend_jjcoin();
        uint col_token = offer.borrowerColToken(_borrower);
        require(lender == msg.sender);
        require(lender != _borrower);
        jjcollateral.transferOwnershipFrom(_borrower, this, col_token);

        offer.accept(_borrower);
        jjbank.transfer(_borrower, amount);

        historyPerAccount[_borrower].push(offer);
        waitingForBorrowerNum --;
        waitingForPaybackNum ++;
        success = true;
    }

    function paybackLoan(address _offer) public setUpReady returns (bool success){
        LendOffer offer = LendOffer(_offer);
        address borrower = offer.borrower();
        address lender = offer.lender();
        uint amount = offer.payback_jjcoin();
        require(borrower == msg.sender);
        require(jjbank.balanceOf(borrower) >= amount);

        offer.payBack();
        jjbank.transferFrom(borrower, lender, amount);
        jjcollateral.transferOwnership(borrower, offer.col_token());
        waitingForPaybackNum --;
        closedNum ++;
        jjcredit.issueTokens(borrower, amount / creTokenRate);
        success = true;
    }

    function defaultLoan(address _offer) public setUpReady returns (bool success) {
        LendOffer offer = LendOffer(_offer);
        address borrower = offer.borrower();
        address lender = offer.lender();

        offer.timeOut();
        jjcollateral.transferOwnership(lender, offer.col_token());
        waitingForPaybackNum --;
        closedNum ++;
        jjcredit.burnTokens(borrower);
        success = true;
    }

    function getUserOffer(address account, string state) public constant setUpReady returns (address[]){
        LendOffer curOffer;
        uint arraySize = getArraySize(state);
        address[] memory offerList = new address[](arraySize);
        address[] memory offerForUser = historyPerAccount[account];
        uint allIndex = 0;
        uint ansIndex = 0;
        while (allIndex < offerForUser.length && ansIndex < arraySize) {
            address offerId = offerForUser[allIndex];
            curOffer = LendOffer(offerId);
            if (_onlyInOfferState(curOffer, state)) {
                offerList[ansIndex] = offerId;
                ansIndex ++;
            }
            allIndex ++;
        }
        return offerList;
    }

    function _onlyInOfferState(LendOffer _offer, string _state) internal constant returns (bool){
        if (keccak256(_state) == keccak256('waitingForBorrower')) {
            return _offer.isWaitingForBorrower();
        }
        else if (keccak256(_state) == keccak256('waitingForPayback')) {
            return _offer.isWaitingForPayback();
        }
        else if (keccak256(_state) == keccak256('closed')) {
            return _offer.isClosed();
        }
    }

    function getOfferDetails(address offerId) public constant returns (
    address borrower,
    uint lend_jjcoin,
    uint payback_jjcoin,
    uint expired_period,
    uint col_token,
    uint start,
    address lender){
        LendOffer offer = LendOffer(offerId);
        return offer.getDetails();
    }

    function getArraySize(string _state) internal constant returns (uint){
        if (keccak256(_state) == keccak256('waitingForBorrower')) {
            return waitingForBorrowerNum;
        }
        else if (keccak256(_state) == keccak256('waitingForPayback')) {
            return waitingForPaybackNum;
        }
        else if (keccak256(_state) == keccak256('closed')) {
            return closedNum;
        }
    }

    function getJJCoinAddr() public constant returns (address) {
        return jjbank;
    }

    function getJJCollateralAddr() public constant returns (address) {
        return jjcollateral;
    }

    function getCredit(address _user) public constant returns (uint) {
        return jjcredit.balanceOf(_user);
    }

    // modifers

    modifier onlyByOwner(){
        require(msg.sender == owner);
        _;
    }

    modifier setUpReady(){
        require(address(jjbank) != 0x0);
        require(address(jjcollateral) != 0x0);
        require(address(jjcredit) != 0x0);
        _;
    }

}