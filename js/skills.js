/***************************************************
 Test attack skill
***************************************************/
class TestAttackSkill extends SkillPiece {
	constructor(user) {
		super(user);
		this.style = 'attack-skill';
	}

	get name() {
		return "Attack";
	}
	get _description() {
		return `Deal ${this.power} damage and push the target 1 space`;
	}

	inRange(origin, target) {
		return super.inRange(origin, target)
			&& this._inLine(origin, target)
			&& this._canSee(origin, target);
	}

	validTarget(target) {
		if (target.piece?.targetable) {
			return true;
		}
		return false;
	}

	_unitEffects(unit, _target) {
		unit.takeDamage(this.power);
		unit.push(this.user.square, 1);
		return 200;
	}
};

/***************************************************
 Test ranged attack skill
***************************************************/
class TestRangedSkill extends TestAttackSkill {
	constructor(user) {
		super(user);
		this.style = 'attack-skill';
	}

	_setStats() {
		super._setStats();
		this._range = 7;
		this._minRange = 2;
	}
};

/***************************************************
 Test heal skill
***************************************************/
class TestHealSkill extends SkillPiece {
	constructor(user) {
		super(user);
		this.style = 'heal-skill';
	}

	get name() {
		return "Heal";
	}
	get _description() {
		return `Restore ${this.power} HP`;
	}

	_setStats() {
		super._setStats();
		this._basePower = 3;
		this._baseCooldown = 2;
		this._range = 1;
		this._minRange = 0;
	}

	validTarget(target) {
		if (target.piece && target.piece.targetable) {
			return true;
		}
		return false;
	}
	_startEffects(_target, _squares, _units) {
		return 0;
	}
	_unitEffects(unit, _target) {
		this._showEffect(unit.square, "test-heal-effect");
		unit.heal(this.power);
		return 200;
	}
};

/***************************************************
 Test build skill
***************************************************/
class TestBuildSkill extends SkillPiece {
	constructor(user) {
		super(user);
		this.style = 'build-skill';
	}

	get name() {
		return "Build";
	}
	get _description() {
		return "Create a wall with 1 HP";
	}

	_setStats() {
		super._setStats();
		this._maxUses = 1;
	}

	inRange(origin, target) {
		return this._inSquare(origin, target, this.range)
			&& !this._inSquare(origin, target, this.minRange-1);
	}
	validTarget(target) {
		if (target.parent.canFit(this.user, target)) {
			return true;
		}
		return false;
	}
	_startEffects(_target, _squares, _units) {
		return 0;
	}
	_squareEffects(square, _target) {
		var wall = new TestRockObject();
		square.parent.movePiece(wall, square);
		wall._addTimedClass(500, 'spawn');
		return 500;
	}
};

/***************************************************
 Test move skill
***************************************************/
class TestMoveSkill extends SkillPiece {
	constructor(user) {
		super(user);
		this.style = 'move-skill';
	}

	get name() {
		return "Regroup";
	}
	get _description() {
		return "Jump to a square adjacent to another unit";
	}

	_setStats() {
		super._setStats();
		this._baseCooldown = 2;
	}

	inRange(origin, target) {
		// TODO: near a unit other than the user
		return target != origin
			&& target.parent.canFit(this.user, target)
			&& this._nearTarget(origin, target, square => (square.piece && square.piece != this.user));
	}

	validTarget(target) {
		if (target.parent.canFit(this.user, target)) {
			return true;
		}
		return false;
	}
	_startEffects(target, _squares, _units) {
		var startSquare = this.user.square;
		target.parent.movePiece(this.user, target);
		this.user.animateMove([startSquare], "jump");
		return 400;
	}
};

/***************************************************
 Test area skill
***************************************************/
class TestAreaSkill extends SkillPiece {
	constructor(user) {
		super(user);
		this.style = 'attack-skill';
	}

	get name() {
		return "Area Attack";
	}
	get _description() {
		return `Deal ${this.power} damage in a small area and push targets away from the center`;
	}

	_setStats() {
		super._setStats();
		this._range = 3;
		this._minRange = 2;
		this._area = 1;
		this._basePower = 1;
	}

	inRange(origin, target) {
		return super.inRange(origin, target)
			&& this._inLine(origin, target);
	}

	_unitEffects(unit, target) {
		unit.takeDamage(this.power);
		unit.push(target, 1);
		return 200;
	}

	_aiBaseTargetScore(target) {
		return -0.5; // AoE are lower priority unless they hit multiple targets
	}
};

/***************************************************
 Test charge skill
***************************************************/
class TestRushSkill extends SkillPiece {
	constructor(user) {
		super(user);
		this.style = 'attack-skill';
	}

	get name() {
		return "Charge Attack";
	}
	get _description() {
		return `Charge two spaces forward and deal ${this.power} damage to the target, pushing it back`;
	}

	_setStats() {
		super._setStats();
		this._basePower = 2;
		this._range = 3;
		this._minRange = 3;
		this._baseCooldown = 3;
	}

	_canSeeSquare(square) {
		return this.user.canStand(square);
	}

	validTarget(target) {
		if (target.piece?.targetable) {
			return true;
		}
		return false;
	}

	inRange(origin, target) {
		return super.inRange(origin, target)
			&& this._inLine(origin, target)
			&& this._canSee(origin, target);
	}

	_startEffects(target) {
		this.user.animateBump(target, this.user.square);
		this.user.pull(target, 2);

		if (target.x < this.user.square.x || target.y > this.user.square.y) this._showEffect(target, "test-attack-effect", "left");
		else this._showEffect(target, "test-attack-effect");

		return 100;
	}
	_unitEffects(unit) {
		unit.takeDamage(this.power);
		unit.push(this.user.square, 1);
		return 200;
	}

	/*_aiBaseTargetScore(target) {
		return -this.power*0.5; // TODO: Use if the enemy is otherwise out of range
	}*/
};

/***************************************************
 Test positioning skill
***************************************************/
class TestPositionSkill extends SkillPiece {
	constructor(user) {
		super(user);
		this.style = 'move-skill';
	}

	get name() {
		return "Throw";
	}
	get _description() {
		return "Throw the unit in front of you to the target square";
	}

	_setStats() {
		super._setStats();
		this._range = 4;
		this._minRange = 3;
		this._baseCooldown = 2;
	}

	inRange(origin, target) {
		// TODO: near a unit other than the user
		return super.inRange(origin, target)
			&& this._inLine(origin, target);
	}

	inArea(origin, target) {
		var userSquare = this.user.square;
		return target == origin
		|| (userSquare.distance(target) == 1
		&& this._ahead(userSquare, target, userSquare.direction(origin)));
	}

	validTarget(target) {
		if (!target.parent.canFit(this.user, target)) {
			return false;
		}
		var userSquare = this.user.square;
		var direction = userSquare.direction(target);
		var board = target.parent;
		var throwSquare = board.at(userSquare.x+direction[0], userSquare.y+direction[1]);
		if (throwSquare?.piece?.targetable) {
			return true;
		}
		return false;
	}
	_unitEffects(unit, target) {
		var startSquare = unit.square;
		target.parent.movePiece(unit, target);
		unit.animateMove([startSquare], "jump");
		return 400;
	}
};