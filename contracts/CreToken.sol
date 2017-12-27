pragma solidity ^0.4.18;


import "./Token.sol";


contract CreToken is Token {

    // state variables
    string public name = "JJLendCreditToken";

    string public symbol = "CreToken";

    uint public decimals = 18;

    address public creator = 0x0;

    // functions
    function CreToken() public {
        creator = msg.sender;
    }

    function changeCreator(address newCreator) onlyCreator public {
        creator = newCreator;
    }

    function issueTokens(address forAddress, uint tokenAmount) public onlyCreator returns (bool success) {
        if (tokenAmount == 0) {
            return false;
        }

        balances[forAddress] += tokenAmount;
        allSupply += tokenAmount;

        return true;
    }

    function burnTokens(address forAddress) public onlyCreator returns (bool success) {
        allSupply -= balances[forAddress];
        balances[forAddress] = 0;
        return true;
    }

    // credit token cannot be transfered
    function transferFrom(address, address, uint) public returns (bool success){
        success = false;
        return;
    }

    // credit token cannot be transfered
    function transfer(address, uint) public {}

    // modifiers
    modifier onlyCreator(){
        require(msg.sender == creator);
        _;
    }

}