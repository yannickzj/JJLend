pragma solidity ^0.4.18;


import './CreToken.sol';
import './BorrowRequest.sol';


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


contract JJLendRequest {

    // state variables
    JJCoinInterface jjbank;

    CreToken jjcredit;

    ColTokenInterface jjcollateral;

    address private owner;

    uint public waitingForLenderNum;

    uint public waitingForBorrowerNum;

    uint public waitingForPaybackNum;

    uint public closedNum;

    uint public totalAccountNum;

    mapping (uint => address) allAccountList;

    mapping (address => address[]) historyPerAccount;

    uint creTokenRate = 1000;

    // functions
    function JJLendRequest() public {
        jjcredit = new CreToken();
        owner = msg.sender;
    }

    function setUpJJCoin(address jjCoinAddress) public onlyByOwner {
        jjbank = JJCoinInterface(jjCoinAddress);
    }

    function setUpColToken(address colTokenAddress) public onlyByOwner {
        jjcollateral = ColTokenInterface(colTokenAddress);
    }

    function postBorrowRequest(uint _borrow_jjcoin,
    uint _payback_jjcoin, uint _expired_time, uint _col_token) public setUpReady returns (bool success){
        address borrower = msg.sender;
        jjcollateral.transferOwnershipFrom(msg.sender, this, _col_token);
        BorrowRequest request = new BorrowRequest(borrower, _borrow_jjcoin, _payback_jjcoin, _expired_time, _col_token);

        Create(borrower, _borrow_jjcoin, _payback_jjcoin, _expired_time, _col_token);

        if (historyPerAccount[borrower].length == 0) {
            allAccountList[totalAccountNum] = borrower;
            totalAccountNum ++;
        }
        historyPerAccount[borrower].push(request);
        waitingForLenderNum ++;
        success = true;
    }

    function acceptBorrowRequest(address _request) public setUpReady returns (bool success){
        BorrowRequest request = BorrowRequest(_request);
        address borrower = request.borrower();
        address lender = msg.sender;
        uint amount = request.borrow_jjcoin();
        require(borrower != lender);
        require(jjbank.balanceOf(lender) > amount);

        if (historyPerAccount[lender].length == 0) {
            allAccountList[totalAccountNum] = lender;
            totalAccountNum ++;
        }

        request.reachAgreement(lender);
        jjbank.transferFrom(lender, borrower, amount);
        historyPerAccount[lender].push(request);
        waitingForLenderNum --;
        waitingForPaybackNum ++;
        Accept(_request, lender);
        success = true;
    }

    function paybackLoan(address _request) public setUpReady returns (bool success){
        BorrowRequest request = BorrowRequest(_request);
        address borrower = request.borrower();
        address lender = request.lender();
        uint amount = request.payback_jjcoin();
        require(borrower == msg.sender);
        require(jjbank.balanceOf(borrower) >= amount);

        request.payBack();
        jjbank.transferFrom(borrower, lender, amount);
        jjcollateral.transferOwnership(borrower, request.col_token());
        waitingForPaybackNum --;
        closedNum ++;
        jjcredit.issueTokens(borrower, amount / creTokenRate);
        Payback(_request);
        success = true;
    }

    function defaultLoan(address _request) public setUpReady returns (bool success) {
        BorrowRequest request = BorrowRequest(_request);
        address borrower = request.borrower();
        address lender = request.lender();

        request.timeOut();
        jjcollateral.transferOwnership(lender, request.col_token());
        waitingForPaybackNum --;
        closedNum ++;
        jjcredit.burnTokens(borrower);
        success = true;
    }

    function cancelBorrowRequest(address _request) public setUpReady returns (bool success){
        BorrowRequest request = BorrowRequest(_request);
        address borrower = request.borrower();
        require(borrower == msg.sender);

        request.cancelRequest();
        jjcollateral.transferOwnership(borrower, request.col_token());
        success = true;
    }


    function getAll() public setUpReady view returns (address[]){
        uint arraySize = waitingForPaybackNum + waitingForLenderNum + closedNum;
        uint ansIndex = 0;
        address[] memory requestList = new address[](arraySize);
        address[] memory result = getAllRequest('waitingForLender');
        for (uint index = 0; index < result.length; index ++) {
            requestList[ansIndex] = result[index];
            ansIndex ++;
        }
        result = getAllRequest('waitingForPayback');
        for (index = 0; index < result.length; index ++) {
            requestList[ansIndex] = result[index];
            ansIndex ++;
        }
        result = getAllRequest('closed');
        for (index = 0; index < result.length; index ++) {
            requestList[ansIndex] = result[index];
            ansIndex ++;
        }
        return requestList;
    }

    function getAllRequest(string state) public setUpReady view returns (address[]){
        uint arraySize = getArraySize(state);
        address[] memory requestList = new address[](arraySize);
        address[] memory result;
        uint userIndex = 0;
        uint ansIndex = 0;
        while (userIndex < totalAccountNum && ansIndex < arraySize) {
            result = getUserRequest(allAccountList[userIndex], state);
            for (uint index = 0; index < result.length; index ++) {
                requestList[ansIndex] = result[index];
                ansIndex ++;
            }
            userIndex ++;
        }
        return requestList;
    }

    function getUserRequest(address account, string state) public constant setUpReady returns (address[]){
        BorrowRequest curRequest;
        uint arraySize = getArraySize(state);
        address[] memory requestList = new address[](arraySize);
        address[] memory requestForUser = historyPerAccount[account];
        uint allIndex = 0;
        uint ansIndex = 0;
        while (allIndex < requestForUser.length && ansIndex < arraySize) {
            address requestId = requestForUser[allIndex];
            curRequest = BorrowRequest(requestId);
            if (_onlyInRequestState(curRequest, state)) {
                requestList[ansIndex] = requestId;
                ansIndex ++;
            }
            allIndex ++;
        }
        return requestList;
    }

    function _onlyInRequestState(BorrowRequest _request, string _state) internal constant returns (bool){
        if (keccak256(_state) == keccak256('waitingForLender')) {
            return _request.isWaitingForLender();
        }
        else if (keccak256(_state) == keccak256('waitingForPayback')) {
            return _request.isWaitingForPayback();
        }
        else if (keccak256(_state) == keccak256('closed')) {
            return _request.isClosed();
        }
    }

    function getRequestDetails(address requestId) public constant returns (
    address borrower,
    uint borrow_jjcoin,
    uint payback_jjcoin,
    uint expired_period,
    uint col_token,
    uint start,
    address lender){
        BorrowRequest request = BorrowRequest(requestId);
        return request.getDetails();
    }

    function getArraySize(string _state) internal constant returns (uint){
        if (keccak256(_state) == keccak256('waitingForLender')) {
            return waitingForLenderNum;
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

    // events
    event Request(address indexed _from, uint _borrowAmount, uint _paybackAmount, uint _time, uint _token);
    event Create(address indexed _borrower, uint _borrow_jjcoin, uint _payback_jjcoin, uint _expired_period, uint _col_token);
    event Accept(address indexed _request, address indexed _lender);
    event Payback(address indexed _request);
    event Timeout(address indexed _request);

}