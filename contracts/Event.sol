pragma solidity ^0.4.10;

import "./EventManager.sol";
import "./Ticket.sol";

import "./usingOraclize.sol";

// This is just a simple example of a coin-like contract.
// It is not standards compatible and cannot be expected to talk to other
// coin/token contracts. If you want to create a standards-compliant
// token, see: https://github.com/ConsenSys/Tokens. Cheers!

contract Event is usingOraclize {
	address public terrapin;
	address public master;
	address public owner;

	// userAddress -> owned tickets[]
	mapping (address => address[]) private ticketOwnerTickets;
	address[] private ticketOwnerIndex;

	address[] private tickets; // optimization

	uint public soldTickets = 0;

	string public name;
	uint public startDate; // unix timestamp
	uint public endDate; // unix timestamp

	// save transactions as they are received for oraclize
	struct Tx { address sender; uint value; string ticketType; }
	mapping(bytes32 => Tx) public txIDs;

	bytes32 public oraclizeID;

	// Venue Info
	string public venueName;
	string public venueAddress;
	string public venueCity;
	string public venueState;
	string public venueZip;

	// ticketType => price
	struct Type {
		uint price;
		int maxTickets; // -1 means unlimited
		uint soldTickets;
	}
	mapping (string => Type) private ticketTypes;

	event Log(uint num);
	event Bought(bool status);

	function Event(address _terrapin, address _master, address _owner, string _name,
		int _maxTickets, uint _usdPrice, uint _startDate, uint _endDate
	) {
		terrapin = _terrapin;
		master = _master;
		owner = _owner;
		name = _name;
		startDate = _startDate;
		endDate = _endDate;

		OAR = OraclizeAddrResolverI(0x6f485C8BF6fc43eA212E93BBF8ce046C7f1cb475);
		// default ticket type
		ticketTypes["GA"] = Type(_usdPrice, _maxTickets, 0);
	}

	function printTicket(address _ticketOwner, string _type) {
		require(msg.sender == owner || msg.sender == master /* || msg.sender == address(this) */);
		uint soldTickets = ticketTypes[_type].soldTickets;
		int maxTickets = ticketTypes[_type].maxTickets;
		require(int(soldTickets) <= maxTickets || maxTickets == -1);

		Ticket ticket = new Ticket(
			terrapin,
			master,
			owner,
			_ticketOwner,
			ticketTypes[_type].price,
			_type,
			address(this)
		);

		tickets.push(address(ticket));
		ticketTypes[_type].soldTickets++;
	}

	/* should be called by a user with control of their own wallet */
	function buyAndPrintTicket(string _type) payable {
		uint soldTickets = ticketTypes[_type].soldTickets;
		int maxTickets = ticketTypes[_type].maxTickets;
		require(int(soldTickets) <= maxTickets || maxTickets == -1);

		oraclizeID = oraclize_query("URL","json(https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD).USD");
		txIDs[oraclizeID] = Tx(msg.sender, msg.value, _type);
		// need the ability to refund if oracalize doesn't work
	}
	function __callback(bytes32 _oraclizeID, string _result) {
		require(msg.sender == oraclize_cbAddress());
		uint etherPriceUSDCents = parseInt(_result, 2);
		uint ticketPrice = ticketTypes[tx.ticketType].price;

		Tx tx = txIDs[_oraclizeID];

		uint weiPerCent = 1 ether / etherPriceUSDCents;
		/*Log(1 ether);*/
		/*Log(etherPriceUSDCents);
		Log(weiPerCent);*/
		Log(ticketTypes[tx.ticketType].price);
		uint amountRequired = weiPerCent * ticketTypes[tx.ticketType].price;

		/*Log(amountRequired);*/
		/*Log(tx.value);*/

		if (tx.value < amountRequired) return tx.sender.transfer(tx.value); // refund user

		uint excessFunds = tx.value - amountRequired; // calculate any excess funds
		owner.transfer(amountRequired); // send ether to event creater
		/*tx.sender.transfer(excessFunds); // return any extra funds*/

		/*Ticket ticket = new Ticket(
			terrapin,
			master,
			owner,
			tx.sender,
			ticketTypes[tx.ticketType].price,
			tx.ticketType,
			address(this)
		);

		tickets.push(address(ticket));
		ticketTypes[tx.ticketType].soldTickets++;*/

		/*Log(this.balance);*/
		Bought(true);
	}

	function addTicketType(string _type, uint _usdPrice, int _maxTickets) {
		require(msg.sender == owner || msg.sender == master);
		ticketTypes[_type] = Type(
			_usdPrice,
			_maxTickets,
			0
		);
	}

	function getRemainingTickets(string _type) constant returns(int remainingTickets) {
		return ticketTypes[_type].maxTickets - int(ticketTypes[_type].soldTickets);
	}

	function getTickets() constant returns(address[]) {
		return tickets;
	}

	function getTicketPrice(string _type) constant returns(uint usdPrice){
		return ticketTypes[_type].price;
	}

}
