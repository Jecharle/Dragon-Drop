/***************************************************
 Index function for looking up types by name
***************************************************/
UnitPiece.parseUnitType = function(string) {
	if (!string) return UnitPiece;
	switch (string.toLowerCase()) {
		// playable units
		case "testmelee":
			return TestMeleeUnit;

		case "testsupport":
			return TestSupportUnit;

		case "testposition":
			return TestPositionUnit;
		
		case "teststatus":
			return TestStatusUnit;

		// enemies
		case "testenemy":
			return TestEnemyUnit;
		
		case "testenemysupport":
			return TestEnemySupportUnit;

		// inanimate object
		case "rockobject":
			return TestRockObject;

		// something has gone wrong
		default:
			return UnitPiece;
	}
};

/***************************************************
 "Unit" subtypes for player use
***************************************************/
class TestMeleeUnit extends UnitPiece {
	
	get name() {
		return "Melee Fighter";
	}
	get _description() {
		return "Specialize in close-range combat";
	}

	_stats() {
		this.style = 'melee-unit';
		this._maxHp = 8;
		this._moveRange = 3;
	}

	_setSkills() {
		this._skills = [
			new TestAttackSkill(this),
			new TestRushSkill(this),
			new TestMoveSkill(this),
			new TestBuildSkill(this)
		];
	}
};

class TestSupportUnit extends UnitPiece {
	
	get name() {
		return "Supporter";
	}
	get _description() {
		return "Low health, but can attack at range and use support skills";
	}

	_stats() {
		this.style = 'support-unit';
		this._maxHp = 6;
		this._moveRange = 2;
	}

	_setSkills() {
		this._skills = [
			new TestRangedSkill(this),
			new TestBuffSkill(this),
			new TestHealSkill(this)
		];
	}
};

class TestPositionUnit extends UnitPiece {

	get name() {
		return "Repositioner";
	}
	get _description() {
		return "Low damage, but specialized in moving allies and enemies";
	}

	_stats() {
		this.style = 'position-unit';
		this._maxHp = 6;
		this._moveRange = 3;
	}

	_setSkills() {
		this._skills = [
			new TestPullSkill(this),
			new TestAreaSkill(this),
			new ThrowSkill2(this),
		];
	}
};

class TestStatusUnit extends UnitPiece {

	get name() {
		return "Status User";
	}
	get _description() {
		return "Low damage, but can use buffs, debuffs, and statuses";
	}

	_stats() {
		this.style = 'status-unit';
		this._maxHp = 6;
		this._moveRange = 2;
	}

	_setSkills() {
		this._skills = [
			new TestAttackSkill(this),
			new TestBuffSkill(this),
			new TestDebuffSkill(this),
			new TestGuardSkill(this)
		];
	}
};

/***************************************************
 "Unit" subtypes meant for enemies
***************************************************/

class TestEnemyUnit extends UnitPiece {
	
	get name() {
		return "Monster";
	}
	get _description() {
		return "Specialize in close-range combat";
	}

	_stats() {
		this.style = 'enemy-unit';
		this._maxHp = 6;
		this._moveRange = 2;
	}

	_setSkills() {
		this._skills = [
			new TestAttackSkill(this),
			new TestAreaSkill(this),
		];
	}

	_setReactions() {
		this._reactions = [
			new TestRageReaction(this),
			new TestExplodeReaction(this),
		];
	}
};

class TestEnemySupportUnit extends UnitPiece {
	
	get name() {
		return "Support Monster";
	}
	get _description() {
		return "Low health, but can attack at range and use support skills";
	}

	_stats() {
		this.style = 'enemy-support-unit';
		this._maxHp = 4;
		this._moveRange = 3;
	}

	_setSkills() {
		this._skills = [
			new TestRangedSkill(this),
			// TODO: Support?
		];
	}
};

/***************************************************
 Object subtypes that don't move or have actions
***************************************************/
class TestRockObject extends ObjectPiece {
	get name() {
		return "Wall";
	}
	get _description() {
		return "Raises the defense of adjacent units<br>Explodes when destroyed";
	}

	get defense() {
		return super.defense + 1;
	}

	_stats() {
		this.style = 'rock';
		this._maxHp = 2;
	}

	_setReactions() {
		this._reactions = [
			new TestCoverReaction(this),
			new TestExplodeReaction(this),
		];
	}
}