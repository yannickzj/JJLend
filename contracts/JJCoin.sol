pragma solidity ^0.4.18;


import "./Token.sol";


contract JJCoin is Token {

    // state variables
    string public name = "JJLendValueToken";

    string public symbol = "JJCoin";

    uint public decimals = 18;

    uint public buyPrice = 1000;

    uint public sellPrice = 1000;

    uint allSupply = 0;

    address public creator = 0x0;

    // functions
    function JJCoin() public {
        creator = msg.sender;
    }

    function getContractBalance() public constant onlyCreator returns (uint) {
        return this.balance;
    }

    function setPrice(uint newBuyPrice, uint newSellPrice) onlyCreator public {
        buyPrice = newBuyPrice;
        sellPrice = newSellPrice;
    }

    function buy() payable public {
        require(msg.value > 0);
        uint amount = msg.value / buyPrice;
        balances[msg.sender] += amount;
        allSupply += amount;
        Buy(msg.sender, buyPrice, amount);
    }

    function sell(uint amount) public {
        require(this.balance >= amount * sellPrice);
        balances[msg.sender] -= amount;
        allSupply -= amount;
        msg.sender.transfer(amount * sellPrice);
        Sell(msg.sender, sellPrice, amount);
    }

    // modifiers
    modifier onlyCreator(){
        require(msg.sender == creator);
        _;
    }

    // events
    event Buy(address indexed buyer, uint _price, uint _value);

    event Sell(address indexed seller, uint _price, uint _value);

}