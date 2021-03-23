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

	_effects(target) {
		var targetPiece = target.piece;
		targetPiece.takeDamage(this.power);
		targetPiece.push(this.user.square, 1);
		targetPiece.dieIfDead();
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
	_effects(target) {
		target.piece.heal(2);
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
	_effects(target) {
		var wall = new TestRockObject();
		target.parent.movePiece(wall, target);
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
	_effects(target) {
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

	_effects(target) {
		// TODO: Standardize this for use with future AoE skills?
		target.parent.getAoE(this, target).forEach(square => {
			if (square && square.piece && square.piece.targetable) {
				square.piece.takeDamage(this.power);
				square.piece.dieIfDead();
			}
		});
	}
};