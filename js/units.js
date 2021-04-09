/***************************************************
 Subtypes of ControllablePiece
***************************************************/
class TestMeleeUnit extends ControllablePiece {
	constructor(partyMember) {
		super(partyMember);
		this.style = 'melee-unit';
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
class TestRockObject extends TargetablePiece {
	constructor() {
		super();
		this.style = 'rock';
	}

	_setStats() {
		this._maxHp = 2;
	}
}