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

	static _partySize = 6
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

class PartyMember {
	constructor() {
		this.alive = true;
	}

	// TODO: Also provide the unit's skill list
	get name() {
		return "";
	}

	getUnit() {
		// TODO: also fill out the skill list?
		return null;
	}

	set dead(value) {
		this.alive = !value;
	}
	get dead() {
		return !this.alive;
	}
}

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