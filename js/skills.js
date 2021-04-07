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
		return 200;
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

	_setStats() {
		super._setStats();
		this._basePower = 2;
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
	_unitEffects(unit, _target) {
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

	get _name() {
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
	_squareEffects(square, _target) {
		var wall = new TestRockObject();
		square.parent.movePiece(wall, square);
		wall._addTimedClass('spawn', 500);
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

	get _name() {
		return "Teleport";
	}
	get _description() {
		return "Move to a square adjacent to another unit";
	}

	_setStats() {
		super._setStats();
		this._baseCooldown = 3;
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
	_startEffects(target, _squares, _pieces) {
		var startSquare = this.user.square;
		target.parent.movePiece(this.user, target);
		this.user.animateMove(target, [startSquare], "teleport");
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

	get _name() {
		return "Area Attack";
	}
	get _description() {
		return `Deal ${this.power} damage to all targets around the center and push them away`;
	}

	_setStats() {
		super._setStats();
		this._range = 3;
		this._minRange = 2;
		this._area = 1;
	}

	inArea(origin, target) {
		return this._inCircle(origin, target, this.area);
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
};