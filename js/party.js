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

	// TODO: Party buffs, special items, etc?

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
	constructor() {
		this.alive = true;
	}

	get name() {
		return "";
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

class TestMeleePartyMember extends PartyMember {
	get name() { return "Alice"; }

	getUnit() {
		return new TestMeleeUnit(this.getEquipment(), this);
	}
}

class TestSupportPartyMember extends PartyMember {
	get name() { return "Bob"; }

	getUnit() {
		return new TestSupportUnit(this.getEquipment(),this);
	}
}

class TestPositionPartyMember extends PartyMember {
	get name() { return "Carol"; }

	getUnit() {
		return new TestPositionUnit(this.getEquipment(),this);
	}
}

class TestStatusPartyMember extends PartyMember {
	get name() { return "Dan"; }

	getUnit() {
		return new TestStatusUnit(this.getEquipment(),this);
	}
}