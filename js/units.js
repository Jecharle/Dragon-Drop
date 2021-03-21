/***************************************************
 Subtypes of ControllablePiece
***************************************************/
class TestMeleeUnit extends ControllablePiece {
	constructor() {
		super();
		this.style = 'ball';
		this.size = 1;
	}

	_setStats() {
		this._maxHp = 5;
		this._moveRange = 3;
	}

	_setSkills() {
		this._skills = [
			new TestAttackSkill(this),
		]
	}
};

class TestSupportUnit extends ControllablePiece {
	constructor() {
		super();
		this.style = 'ball3';
		this.size = 1;
	}

	_setStats() {
		this._maxHp = 3;
		this._moveRange = 2;
	}

	_setSkills() {
		this._skills = [
			new TestAttackSkill(this),
			new TestHealSkill(this),
			new TestBuildSkill(this),
		]
	}
};

class TestEnemyUnit extends ControllablePiece {
	constructor() {
		super();
		this.style = 'ball2';
		this.size = 1;
	}

	_setStats() {
		this._maxHp = 5;
		this._moveRange = 2;
	}

	_setSkills() {
		this._skills = [
			new TestAttackSkill(this),
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
		this.size = 1;
	}

	_setStats() {
		this._maxHp = 1;
	}
}