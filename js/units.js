/***************************************************
 Subtypes of ControllablePiece
***************************************************/
class TestMeleeUnit extends ControllablePiece {
	constructor(partyMember) {
		super(partyMember);
		this.style = 'melee-unit';
	}

	get _name() {
		return "Melee Fighter";
	}
	get _description() {
		return "Specialize in close-range combat";
	}

	_setStats() {
		this._maxHp = 6;
		this._moveRange = 3;
	}

	_setSkills() {
		this._skills = [
			new TestAttackSkill(this),
			new TestMoveSkill(this),
		]
	}
};

class TestSupportUnit extends ControllablePiece {
	constructor(partyMember) {
		super(partyMember);
		this.style = 'support-unit';
		this._moveStyle = 'teleport';
	}

	get _name() {
		return "Support Unit";
	}
	get _description() {
		return "Low health, but a variety of long-range abilities";
	}

	_setStats() {
		this._maxHp = 4;
		this._moveRange = 2;
	}

	_setSkills() {
		this._skills = [
			new TestAreaSkill(this),
			new TestHealSkill(this),
			new TestBuildSkill(this),
		]
	}
};

class TestEnemyUnit extends ControllablePiece {
	constructor(partyMember) {
		super(partyMember);
		this.style = 'enemy-unit';
	}

	get _name() {
		return "Monster";
	}
	get _description() {
		return "Specialize in close-range combat";
	}

	_setStats() {
		this._maxHp = 2;
		this._moveRange = 2;
	}

	_setSkills() {
		this._skills = [
			new TestAttackSkill(this),
			new TestAreaSkill(this),
		]
	}
};

/***************************************************
 Subtypes of TargetablePiece
***************************************************/
class TestRockObject extends ControllablePiece {
	constructor() {
		super();
		this.style = 'rock';
	}

	get _name() {
		return "Barrier";
	}
	get _description() {
		return "An obstacle used to control the terrain";
	}

	_setStats() {
		this._maxHp = 2;
		this._moveRange = 0;
	}
}