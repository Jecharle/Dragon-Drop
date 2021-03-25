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
		if (!this._members.includes(member)) {
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

	static getPieces() {
		var pieces = [];
		this.members.forEach(member => {
			if (member.alive && pieces.length < this.partySize){
				pieces.push(member.getPiece());
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

	getPiece() {
		// TODO: Fill out the skill list here
		return new TestMeleeUnit(this); // TEMP
	}

	set dead(value) {
		this.alive = !value;
	}
	get dead() {
		return !this.alive;
	}
}

class TestMeleePartyMember extends PartyMember {
	getPiece() {
		return new TestMeleeUnit(this);
	}
}

class TestSupportPartyMember extends PartyMember {
	getPiece() {
		return new TestSupportUnit(this);
	}
}