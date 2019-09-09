pragma solidity ^0.4.10;

// This is just a simple example of a coin-like contract.
// It is not standards compatible and cannot be expected to talk to other
// coin/token contracts. If you want to create a standards-compliant
// token, see: https://github.com/ConsenSys/Tokens. Cheers!
import "./EventManager.sol";
import "./usingOraclize.sol";
import "./Event.sol";

contract Ticket is usingOraclize {
	address public terrapin;
	address public master;
	address public owner;
	address public issuer;
	address public eventAddress;

	bool public isRedeemed = false;
	bool public isForSale = true;
	uint public usdPrice;
	string public ticketType;

	bytes32 public oraclizeID;

	struct Tx { address sender; uint value; }
	mapping(bytes32 => Tx) public txIDs;

	/*Event*/
	event Log(uint num);
	event Bought(bool status);

	function Ticket(
		address _terrapin, address _master, address _issuer, address _owner,
		uint _usdPrice, string _ticketType, address _eventAddress
	) {
		// initialize oracle service
		OAR = OraclizeAddrResolverI(0x6f485C8BF6fc43eA212E93BBF8ce046C7f1cb475);
		terrapin = _terrapin;
		master = _master;
		issuer = _issuer;
		owner = _owner;
		usdPrice = _usdPrice; // in USD cents
		ticketType = _ticketType;
		eventAddress = _eventAddress;
	}

	function masterBuy(address _newOwner) {
		require(msg.sender == master);
		owner = _newOwner;
		isForSale = false;
	}

	function transferTicket(address _recipient) {
		require(msg.sender == owner || msg.sender == master);
		require(isRedeemed == false);
		owner = _recipient;
	}

	function setIsForSale(bool _isForSale) {
		require(msg.sender == owner || msg.sender == master);
		isForSale = _isForSale;
	}

	function redeemTicket() {
		require(msg.sender == issuer);
		require(isRedeemed == false);
		isRedeemed = true;
		isForSale = false;
	}

	function getBalance() constant returns (uint) { // should be 0
		return this.balance;
	}

	function setType(string _ticketType) {
		require(msg.sender == issuer || msg.sender == master);
		ticketType = _ticketType;
	}

	function setPrice(uint _usdPrice) {
		require(msg.sender == issuer || msg.sender == master);
		usdPrice = _usdPrice;
	}

	/* The following code isn't used for now*/
	function buyTicket() payable {
		require(isForSale);
		require(isRedeemed == false); // make sure ticket hasn't already been redeemed

		oraclizeID = oraclize_query("URL","json(https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD).USD");
		txIDs[oraclizeID] = Tx(msg.sender, msg.value);
		// need the ability to refund if oracalize doesn't work
	}
	function __callback(bytes32 _oraclizeID, string _result) {
		require(msg.sender == oraclize_cbAddress());
		uint etherPriceUSDCents = parseInt(_result, 2);

		uint pricePerCent = 1 ether / etherPriceUSDCents;
		uint amountRequired = pricePerCent * usdPrice;

		Tx tx = txIDs[_oraclizeID];

		if (tx.value < amountRequired) return tx.sender.transfer(tx.value); // refund user

		uint excessFunds = tx.value - amountRequired; // calculate any excess funds
		owner.transfer(amountRequired); // send ether to event creater
		tx.sender.transfer(excessFunds); // return any extra funds
		owner = tx.sender;
		isForSale = false; // ticket is not for sale anylonger
		/*Log(this.balance);*/
		Bought(true);
	}
}
