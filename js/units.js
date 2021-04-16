/***************************************************
 Subtypes of UnitPiece
***************************************************/
class TestMeleeUnit extends UnitPiece {
	
	get name() {
		return "Melee Fighter";
	}
	get _description() {
		return "Specialize in close-range combat";
	}

	_setStats() {
		this.style = 'melee-unit';
		this._maxHp = 6;
		this._moveRange = 3;
	}

	_setSkills() {
		this._skills = [
			new TestAttackSkill(this),
			new TestRushSkill(this),
			new TestMoveSkill(this)
		]
	}
};

class TestSupportUnit extends UnitPiece {
	
	get name() {
		return "Support Unit";
	}
	get _description() {
		return "Low health, but a variety of long-range abilities";
	}

	_setStats() {
		this.style = 'support-unit';
		this._moveStyle = 'teleport';
		this._maxHp = 4;
		this._moveRange = 2;
	}

	_setSkills() {
		this._skills = [
			new TestRangedSkill(this),
			new TestHealSkill(this),
			new TestBuildSkill(this),
		]
	}
};

class TestPositionUnit extends UnitPiece {

	get name() {
		return "Positioning Unit";
	}
	get _description() {
		return "Low damage, but specialized in repositioning allies and enemies";
	}

	_setStats() {
		this.style = 'position-unit';
		this._maxHp = 4;
		this._moveRange = 4;
	}

	_setSkills() {
		this._skills = [
			new TestAreaSkill(this),
			new TestPositionSkill(this),
		]
	}
};

class TestEnemyUnit extends UnitPiece {
	
	get name() {
		return "Monster";
	}
	get _description() {
		return "Specialize in close-range combat";
	}

	_setStats() {
		this.style = 'enemy-unit';
		this._maxHp = 4;
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
 "Unit" subtypes that don't move or have actions
***************************************************/
class ObjectPiece extends UnitPiece {
	get canMove() { return false; }
	get canAct() { return false; }
	get moveRange() { return 0; }
	select() { return false; }
	_setSelectable() { }
}

class TestRockObject extends ObjectPiece {

	get name() {
		return "Barrier";
	}
	get _description() {
		return "An obstacle used to control the battlefield";
	}

	_setStats() {
		this.style = 'rock';
		this._maxHp = 2;
	}
}