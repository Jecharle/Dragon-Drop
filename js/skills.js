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
	_shape = function(origin, target, props) {
		return Shape.Line(origin, target, props) && Shape.CanSee(origin, target, props);
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
	_shape = Shape.Square;
	_baseCooldown = 3;

	validTarget(target) {
		if (target.parent.canFit(null, target, 1)) {
			return true;
		}
		return false;
	}
	_effects(target) {
		var wall = new TestRockObject();
		return target.parent.movePiece(wall, target);
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
		return "Regroup";
	}
	get _description() {
		return "Teleport adjacent to another unit";
	}

	_range = 7;
	_shape = Shape.NearPiece;
	_baseCooldown = 3;

	validTarget(target) {
		if (target.parent.canFit(this.user, target)) {
			return true;
		}
		return false;
	}
	_effects(target) {
		return target.parent.movePiece(this.user, target);
	}
};