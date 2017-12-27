pragma solidity ^0.4.18;


contract Token {

    // state variables
    mapping (address => uint) balances;

    mapping (address => mapping (address => uint)) allowance;

    uint allSupply = 0;

    // functions
    function balanceOf(address _owner) public constant returns (uint) {
        return balances[_owner];
    }

    function _transfer(address _from, address _to, uint _value) internal {
        require(_to != 0x0);
        require(balances[_from] >= _value);
        require(balances[_to] + _value > balances[_to]);

        uint previousBalances = balances[_from] + balances[_to];
        balances[_from] -= _value;
        balances[_to] += _value;

        Transfer(_from, _to, _value);
        assert(balances[_from] + balances[_to] == previousBalances);
    }

    function transfer(address _to, uint _value) public {
        _transfer(msg.sender, _to, _value);
    }

    function transferFrom(address _from, address _to, uint _value) public returns (bool success) {
        require(_value <= allowance[_from][msg.sender]);
        allowance[_from][msg.sender] -= _value;
        _transfer(_from, _to, _value);
        return true;
    }

    function approve(address _spender, uint _value) public returns (bool success) {
        allowance[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowanceOf(address _owner, address _spender) public constant returns (uint remaining) {
        return allowance[_owner][_spender];
    }

    function totalSupply() public constant returns (uint supply) {
        supply = allSupply;
        return;
    }

    // events
    event Transfer(address indexed _from, address indexed _to, uint _value);

    event Approval(address indexed _owner, address indexed _spender, uint _value);

}