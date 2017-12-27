pragma solidity ^0.4.18;


import './SafeMath.sol';


contract BorrowRequest {

    enum State {
    Init,
    Cancelled,
    WaitingForLender,
    WaitingForPayback,
    Expired,
    Finished
    }

    using SafeMath for uint;

    address public creator = 0x0;

    State public currentState = State.Init;

    address public borrower;

    uint public borrow_jjcoin;

    uint public payback_jjcoin;

    uint public expired_period;

    uint public col_token;

    uint public start = 0;

    address public lender = 0x0;

    function BorrowRequest(address _borrower, uint _borrow_jjcoin, uint _payback_jjcoin,
    uint _expired_period, uint _col_token) public {
        creator = msg.sender;
        borrower = _borrower;
        borrow_jjcoin = _borrow_jjcoin;
        payback_jjcoin = _payback_jjcoin;
        expired_period = _expired_period;
        col_token = _col_token;
        currentState = State.WaitingForLender;
    }

    function reachAgreement(address _lender) public onlyCreator onlyInState(State.WaitingForLender) {
        lender = _lender;
        start = now;
        currentState = State.WaitingForPayback;
    }

    function cancelRequest() public onlyCreator onlyInState(State.WaitingForLender) {
        currentState = State.Cancelled;
    }

    function payBack() public onlyCreator onlyInState(State.WaitingForPayback) {
        require(start + expired_period >= now);
        currentState = State.Finished;
    }

    function timeOut() public onlyCreator onlyInState(State.WaitingForPayback) {
        require(start + expired_period < now);
        currentState = State.Expired;
    }

    function isWaitingForLender() public view returns (bool succeess){
        return currentState == State.WaitingForLender;
    }

    function isWaitingForPayback() public view returns (bool succeess){
        return currentState == State.WaitingForPayback;
    }

    function isClosed() public view returns (bool succeess){
        return currentState == State.Expired || currentState == State.Finished;
    }

    function getDetails() public view returns (address _borrower,
    uint _borrow_jjcoin,
    uint _payback_jjcoin,
    uint _expired_period,
    uint _col_token,
    uint _start,
    address _lender){
        return (borrower, borrow_jjcoin, payback_jjcoin, expired_period, col_token, start, lender);
    }

    // modifiers
    modifier onlyInState(State _state){
        require(currentState == _state);
        _;
    }

    modifier onlyCreator() {
        require(msg.sender == creator);
        _;
    }

}