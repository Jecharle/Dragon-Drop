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

	get range() {
		return 2;
	}

	_validTarget(target) {
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

	get range() {
		return 1;
	}
	get minRange() {
		return 0;
	}

	_basePower = 2;
	_baseCooldown = 2;

	_validTarget(target) {
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

	get range() {
		return 1;
	}
	get shape() {
		return Shape.Square;
	}

	_baseCooldown = 3;

	_validTarget(target) {
		if (!target.piece) {
			return true;
		}
		return false;
	}
	_effects(target) {
		var wall = new TargetablePiece(Rock);
		return target.parent.movePiece(wall, target);
	}
};