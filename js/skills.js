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
		unit.push(this.user.square, 1, {animation: UnitPiece.Path});
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

	get name() {
		return "Ranged Attack";
	}

	_setStats() {
		super._setStats();
		this._range = 9;
		this._minRange = 2;
	}

	_startEffects(target, _squares, _units) {
		this.user.addTimedClass(200, 'attack');
		this._showEffect(target, this.user.square, "test-shot-effect").animateMove(this.user.square);
		return 200;
	}
};

/***************************************************
 Test ranged attack skill
***************************************************/
class TestPullSkill extends TestAttackSkill {
	constructor(user) {
		super(user);
		this.style = 'attack-skill';
	}

	get name() {
		return "Pull Attack";
	}
	get _description() {
		return `Deal ${this.power} damage and pull the target 1 space<br/>Does not damage allies`;
	}

	_setStats() {
		super._setStats();
		this._range = 2;
		this._minRange = 1;
	}

	_startEffects(target, _squares, _units) {
		this.user.addTimedClass(200, 'attack');
		this._showEffect(target, this.user.square, "test-shot-effect").animateMove(this.user.square, SpriteEffect.Return);
		return 200;
	}

	_unitEffects(unit, _target) {
		if (!this.user.isAlly(unit)) unit.takeDamage(this.power);
		unit.pull(this.user.square, 1, {animation: UnitPiece.Path});
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

	get name() {
		return "Heal";
	}
	get _description() {
		return `Restore ${this.power} HP`;
	}

	_setStats() {
		super._setStats();
		this._basePower = 4;
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
		this._showEffect(unit.square, this.user.square, "test-heal-effect");
		unit.heal(this.power);
		return 200;
	}
};

/***************************************************
 Test buff skill
***************************************************/
class TestBuffSkill extends SkillPiece {
	constructor(user) {
		super(user);
		this.style = 'buff-skill';
	}

	get name() {
		return "Buff";
	}
	get _description() {
		return `Increase attack, defense, and speed by 1`;
	}

	_setStats() {
		super._setStats();
		this._baseCooldown = 2;
		this._range = 2;
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
		this._showEffect(unit.square, this.user.square, "test-heal-effect");
		unit.buffPower(1);
		unit.buffDefense(1);
		unit.buffSpeed(1);
		return 200;
	}
};

/***************************************************
 Test debuff skill
***************************************************/
class TestDebuffSkill extends SkillPiece {
	constructor(user) {
		super(user);
		this.style = 'debuff-skill';
	}

	get name() {
		return "Debuff";
	}
	get _description() {
		return `Decrease attack, defense, and speed by 1`;
	}

	_setStats() {
		super._setStats();
		this._baseCooldown = 2;
		this._range = 2;
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
		this._showEffect(unit.square, this.user.square, "test-heal-effect");
		unit.debuffPower(1);
		unit.debuffDefense(1);
		unit.debuffSpeed(1);
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
		wall.addTimedClass(500, 'spawn');
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
		return "Jump to a square adjacent to an ally";
	}

	_setStats() {
		super._setStats();
		this._baseCooldown = 2;
	}

	inRange(origin, target) {
		return target != origin
			&& target.parent.canFit(this.user, target)
			&& this._nearTarget(origin, target, square => (this.user.isAlly(square.piece) && square.piece != this.user));
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
		var time = this.user.animateMove([startSquare], UnitPiece.Jump);
		return time;
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

	_startEffects(target, _squares, _units) {
		this.user.addTimedClass(200, 'attack');
		this._showEffect(target, this.user.square, "test-arc-effect").animateMove(this.user.square, SpriteEffect.Arc);
		return 400;
	}

	_unitEffects(unit, target) {
		unit.takeDamage(this.power);
		unit.push(target, 1, {animation: UnitPiece.Path});
		return 150;
	}

	_endEffects(_target, _squares, _units) {
		return 200;
	}

	_aiBaseTargetScore(_target) {
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
		this._basePower = 3;
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
		var time = this.user.animateBump(target, this.user.square);
		this.user.addTimedClass(time, 'attack');
		this.user.pull(target, 2);

		this._showEffect(target, this.user.square, "test-attack-effect");

		return time;
	}
	_unitEffects(unit) {
		unit.takeDamage(this.power);
		unit.push(this.user.square, 1, { animation: UnitPiece.Path });
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
		return "Toss the unit in front of you to the target square";
	}

	_setStats() {
		super._setStats();
		this._range = 4;
		this._minRange = 2;
		this._baseCooldown = 2;
	}

	inRange(origin, target) {
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
	_startEffects(target) {
		var time = this.user.animateBump(target);
		this.user.addTimedClass(time, 'attack');
		return time/2;
	}
	_unitEffects(unit, target) {
		var startSquare = unit.square;
		target.parent.movePiece(unit, target);

		var time = unit.animateMove([startSquare], UnitPiece.Jump);
		unit.addTimedClass(time+100, 'damaged');
		return time+100;
	}
};