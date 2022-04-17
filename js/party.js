/***************************************************
(Static) Stores the player's party members and
resources between stages
***************************************************/
class Party {
	constructor() {
		console.log("Party object is static, do not instantiate");
	}

	static _members = []
	static get members() {
		return this._members;
	}
	static add(member) {
		if (!this._members.includes(member) && this._members.length < this.partySize) {
			this._members.push(member);
			return true;
		}
		return false;
	}
	static remove(member) {
		var index = this._members.indexOf(member);
		if (index > -1) {
			this._members.splice(index, 1);
			return true;
		}
		return false;
	}

	static _partySize = 4
	static get partySize() {
		return this._partySize;
	}

	static get alive() {
		return this.members.some(member => member.alive);
	}

	static getUnits() {
		var pieces = [];
		this.members.forEach(member => {
			if (member.alive){
				pieces.push(member.getUnit());
			}
		});
		return pieces;
	}
}

/***************************************************
Members of the party that generate units
***************************************************/
class PartyMember {
	constructor(level) {
		this.alive = true;
		this.level = level || 0;
	}

	get name() {
		return "";
	}

	_equipCount = 2;
	get equipCount() {
		return this._equipCount;
	}

	getEquipment() {
		return [new TestEquip()];
	}

	getUnit() {
		return null;
	}

	set dead(value) {
		this.alive = !value;
	}
	get dead() {
		return !this.alive;
	}
}

/***************************************************
 Index function for looking up types by name
***************************************************/
PartyMember.parseMember = function(string) {
	if (!string) return PartyMember;
	switch (string.toLowerCase()) {
		case "testmelee":
			return TestMeleePartyMember;
		
		case "testsupport":
			return TestSupportPartyMember;
		
		case "testposition":
			return TestPositionPartyMember;
		
		case "teststatus":
			return TestStatusPartyMember;

		// something has gone wrong
		default:
			return PartyMember;
	}
};

class TestMeleePartyMember extends PartyMember {
	get name() { return "Alice"; }

	getUnit() {
		return new TestMeleeUnit(this);
	}
}

class TestSupportPartyMember extends PartyMember {
	get name() { return "Bob"; }

	getUnit() {
		return new TestSupportUnit(this);
	}
}

class TestPositionPartyMember extends PartyMember {
	get name() { return "Carol"; }

	getUnit() {
		return new TestPositionUnit(this);
	}
}

class TestStatusPartyMember extends PartyMember {
	get name() { return "Dan"; }

	getUnit() {
		return new TestStatusUnit(this);
	}
}