/***************************************************
 Test attack skill
***************************************************/
class TestAttackSkill extends SkillPiece {
	constructor(user) {
		super(user);
		this.style = 'attack-skill';
	}

	get _name() {
		return "Attack";
	}
	get _description() {
		return `Deal ${this.power} damage and push the target 1 space`;
	}

	_range = 2

	inRange(origin, target) {
		return super.inRange(origin, target)
			&& this._inLine(origin, target)
			&& this._canSee(origin, target);
	}

	validTarget(target) {
		if (target.piece && target.piece.targetable) {
			return true;
		}
		return false;
	}

	_unitEffects(unit, _target) {
		unit.takeDamage(this.power);
		unit.push(this.user.square, 1);
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

	get _name() {
		return "Heal";
	}
	get _description() {
		return `Restore ${this.power} HP`;
	}

	_basePower = 2;
	_baseCooldown = 2;
	_range = 1;
	_minRange = 0;

	validTarget(target) {
		if (target.piece && target.piece.targetable) {
			return true;
		}
		return false;
	}
	_unitEffects(unit, _target) {
		unit.heal(this.power);
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

	get _name() {
		return "Build";
	}
	get _description() {
		return "Create a wall with 1 HP";
	}

	_range = 1;
	_baseCooldown = 3;

	inRange(origin, target) {
		return this._inSquare(origin, target, this.range)
			&& !this._inSquare(origin, target, this.minRange-1);
	}
	validTarget(target) {
		if (target.parent.canFit(null, target, 1)) {
			return true;
		}
		return false;
	}
	_squareEffects(square, _target) {
		var wall = new TestRockObject();
		square.parent.movePiece(wall, square);
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

	get _name() {
		return "Teleport";
	}
	get _description() {
		return "Move to a square adjacent to another unit";
	}

	_baseCooldown = 3;

	inRange(origin, target) {
		return this._nearPiece(origin, target)
	}

	validTarget(target) {
		if (target.parent.canFit(this.user, target)) {
			return true;
		}
		return false;
	}
	_startEffects(target, _squares, _pieces) {
		target.parent.movePiece(this.user, target);
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

	get _name() {
		return "Area Attack";
	}
	get _description() {
		return `Deal ${this.power} damage to all targets in a small area`;
	}

	_range = 3
	_minRange = 2
	_area = 1

	inArea(origin, target) {
		var direction = origin.parent.getDirection(this.user.square, origin);
		return this._inSquare(origin, target, this.area)
			&& this._inLine(origin, target)
			&& this._beside(origin, target, direction);
	}

	inRange(origin, target) {
		return super.inRange(origin, target)
			&& this._inLine(origin, target);
	}

	_unitEffects(unit, _target) {
		unit.takeDamage(this.power);
		unit.push(this.user.square, 1);
	}
};