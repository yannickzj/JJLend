pragma solidity ^0.4.18;


import './SafeMath.sol';


contract LendOffer {

    using SafeMath for uint;

    enum State {
    Init,
    Cancelled,
    WaitingForBorrower,
    WaitingForPayback,
    Expired,
    Finished
    }

    address public creator = 0x0;

    State public currentState;

    address public borrower = 0x0;

    address public lender = 0x0;

    uint public lend_jjcoin;

    uint public payback_jjcoin;

    uint public expired_period;

    uint public col_token;

    uint public start = 0;

    string public requirement;

    mapping (address => uint) public borrowerColToken;

    address[] candidate;

    function LendOffer() public {
        creator = msg.sender;
        currentState = State.Init;
    }

    function setData(address _lender, uint _lend_jjcoin, uint _payback_jjcoin, uint _expired_period, string _requirement)
    public onlyCreator onlyInState(State.Init) {
        lender = _lender;
        lend_jjcoin = _lend_jjcoin;
        payback_jjcoin = _payback_jjcoin;
        expired_period = _expired_period;
        requirement = _requirement;
        currentState = State.WaitingForBorrower;
    }

    function apply(address _borrower, uint _col_token) public onlyCreator onlyInState(State.WaitingForBorrower) {
        candidate.push(_borrower);
        borrowerColToken[_borrower] = _col_token;
    }

    function accept(address _borrower) public onlyCreator onlyInState(State.WaitingForBorrower) {
        borrower = _borrower;
        col_token = borrowerColToken[_borrower];
        start = now;
        currentState = State.WaitingForPayback;
    }

    function cancelOffer() public onlyCreator onlyInState(State.WaitingForBorrower) {
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

    function isWaitingForBorrower() public view returns (bool succeess){
        return currentState == State.WaitingForBorrower;
    }

    function isWaitingForPayback() public view returns (bool succeess){
        return currentState == State.WaitingForPayback;
    }

    function isClosed() public view returns (bool succeess){
        return currentState == State.Expired || currentState == State.Finished;
    }

    function getDetails() public view returns (address _borrower,
    uint _lend_jjcoin,
    uint _payback_jjcoin,
    uint _expired_period,
    uint _col_token,
    uint _start,
    address _lender){
        return (borrower, lend_jjcoin, payback_jjcoin, expired_period, col_token, start, lender);
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