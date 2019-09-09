pragma solidity ^0.4.10;

import "./Event.sol";

// This is just a simple example of a coin-like contract.
// It is not standards compatible and cannot be expected to talk to other
// coin/token contracts. If you want to create a standards-compliant
// token, see: https://github.com/ConsenSys/Tokens. Cheers!

contract EventManager {
	address public master;
	address[] public events;

	// eventIssuer => eventAddress[]
	mapping(address => address[]) private eventIssuerLookupTable;

	// ticketOwner => ticketAddress[]
	mapping(address => address[]) private ticketOwnerLookupTable;

	event EventCreated(address _eventAddress);

	function EventManager() {
		master = msg.sender;
	}

	function createEvent(string _eventName,
		int _maxTickets, uint _usdPrice,
		uint _startDate, uint _endDate
	) {
		Event ev = new Event(address(this), master,
			msg.sender, _eventName, int(_maxTickets), _usdPrice, _startDate, _endDate
		);
		address eventAddress = address(ev);
		events.push(eventAddress);
		eventIssuerLookupTable[msg.sender].push(eventAddress);

		// dispatch an event
		EventCreated(eventAddress);
	}

	function getEvents() constant returns(address[]) {
		return events;
	}

	function getEventsByOwner(address _owner) constant returns(address[]) {
		return eventIssuerLookupTable[_owner];
	}

	function getNumEventsByOwner(address _owner) constant returns(uint numEvents) {
		return eventIssuerLookupTable[_owner].length;
	}

	function getOwnerTickets(address _owner) constant returns(address[]) {
		return ticketOwnerLookupTable[_owner];
	}

	function setTicketOwner(address _ticket, address _owner) {
		// TODO: require sent by ticket
		ticketOwnerLookupTable[_owner].push(_ticket);
	}
}
