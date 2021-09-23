/***************************************************
 Test attack skill
***************************************************/
class TestAttackSkill extends SkillCard {

	get name() {
		return "Attack";
	}
	get _description() {
		return `Damage the target and push them 1 space`;
	}

	get _showBanner() {
		return false;
	}

	_stats() {
		this.style = 'attack-skill';
		this._basePower = 2;
	}

	validTarget(target) {
		if (target.piece?.targetable) {
			return true;
		}
		return false;
	}

	async _unitEffects(unit, _target) {
		if (!unit.evade()) {
			unit.takeDamage(this.power);
			unit.push(this.user.square, 1, {animation: UnitPiece.Path});
		}
		await Game.asyncPause(200);
	}
};

/***************************************************
 Test ranged attack skill
***************************************************/
class TestRangedSkill extends TestAttackSkill {

	get name() {
		return "Ranged Attack";
	}

	_stats() {
		super._stats();
		this._range = 9;
		this._minRange = 2;
	}

	async _startEffects(target, _squares, _units) {
		this.user.addTimedClass(200, 'attack');
		this._showEffect(target, this.user.square, "test-shot-effect").animateMove(this.user.square);
		await Game.asyncPause(200);
	}
};

/***************************************************
 Test pull attack skill
***************************************************/
class TestPullSkill extends TestAttackSkill {

	get name() {
		return "Pull Attack";
	}
	get _description() {
		return `Damage the enemy and pull them 1 space<br/>Does not damage allies`;
	}

	_stats() {
		super._stats();
		this._range = 3;
		this._minRange = 1;
	}

	async _startEffects(target, _squares, _units) {
		this.user.addTimedClass(200, 'attack');
		this._showEffect(target, this.user.square, "test-shot-effect").animateMove(this.user.square, SpriteEffect.Return);
		await Game.asyncPause(200);
	}

	async _unitEffects(unit, _target) {
		if (this.user.isAlly(unit)) {
			unit.pull(this.user.square, 1, {animation: UnitPiece.Path, uphill: true});
		} else if (!unit.evade()) {
			unit.takeDamage(this.power);
			unit.pull(this.user.square, 1, {animation: UnitPiece.Path, uphill: true});
		}
		await Game.asyncPause(200);
	}
};

/***************************************************
 Test charge skill
***************************************************/
class TestRushSkill extends TestAttackSkill {


	get name() {
		return "Charge Attack";
	}
	get _description() {
		return `Approach the target and attack, pushing them back`;
	}

	get _showBanner() {
		return true;
	}

	_stats() {
		super._stats();
		this._basePower = 3;
		this._range = 3;
		this._minRange = 3;
		this._baseCooldown = 3;
	}

	_canSeeSquare(square) {
		return this.user.canStand(square);
	}

	async _startEffects(target) {
		var time = this.user.animateBump(target, this.user.square);
		this.user.addTimedClass(time, 'attack');
		this.user.pull(target, 2);

		this._showEffect(target, this.user.square, "test-attack-effect");

		await Game.asyncPause(time);
	}

	// TODO: Use if the enemy is otherwise out of range
};

/***************************************************
 Test area attack skill
***************************************************/
class TestAreaSkill extends TestAttackSkill {

	get name() {
		return "Area Attack";
	}
	get _description() {
		return `Damage targets in a small area and push them away from the center`;
	}

	get _showBanner() {
		return true;
	}

	_stats() {
		super._stats();
		this._range = 3;
		this._minRange = 2;
		this._los = false;
		this._area = 1;
		this._basePower = 1;
	}

	validTarget(target) {
		return !!target;
	}

	async _startEffects(target, _squares, _units) {
		this.user.addTimedClass(200, 'attack');
		this._showEffect(target, this.user.square, "test-arc-effect").animateMove(this.user.square, SpriteEffect.Arc);
		await Game.asyncPause(400);
	}

	async _unitEffects(unit, target) {
		if (!unit.evade()) {
			unit.takeDamage(this.power);
			unit.push(target, 1, {animation: UnitPiece.Path});
		}
		await Game.asyncPause(150);
	}

	async _endEffects(_target, _squares, _units) {
		await Game.asyncPause(200);
	}

	_aiBaseTargetScore(_target, _origin) {
		return -0.5; // AoE are lower priority unless they hit multiple targets
	}
};

/***************************************************
 Test heal skill
***************************************************/
class TestHealSkill extends SkillCard {

	get name() {
		return "Heal";
	}
	get _description() {
		return `Heal the target`;
	}
	get _effectText() {
		return [
			`${this.icon('life')} +${this.power}`
		];
	}

	_stats() {
		this.style = 'heal-skill';
		this._basePower = 2;
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
	async _startEffects(_target, _squares, _units) { }
	async _unitEffects(unit, _target) {
		this._showEffect(unit.square, this.user.square, "test-heal-effect");
		unit.heal(this.power);
		await Game.asyncPause(200);
	}

	_aiEnemyTargetScore(unit, square) {
		return -1.1*this._aiAllyTargetScore(unit, square);
	}
	_aiAllyTargetScore(unit, square) {
		return Math.min(this.power, unit.maxHp-unit.hp)
			+ unit.getStatus(UnitPiece.Poison)
			- unit.hpRate;
	}
};

/***************************************************
 Test buff skill
***************************************************/
class TestBuffSkill extends TestHealSkill {

	get name() {
		return "Buff";
	}
	get _description() {
		return `Increase the target's Defense and Speed<br>Next turn, Regenerate and increase Power`;
	}
	get _effectText() {
		return [
			`${this.icon('regenerate')} ${this.power}`,
			`${this.icon('defense', this.icon('up'))} \
			${this.icon('speed', this.icon('up'))} +1`,
			`${this.icon('power', this.icon('time'))} +2`,
		];
	}

	_stats() {
		super._stats();
		this.style = 'buff-skill';
		this._basePower = 2;
	}

	async _unitEffects(unit, _target) {
		this._showEffect(unit.square, this.user.square, "test-buff-effect");
		unit.addStatus(UnitPiece.Charge, 2);
		unit.addStatus(UnitPiece.Defense, 1);
		unit.addStatus(UnitPiece.Speed, 1);
		unit.addStatus(UnitPiece.Regenerate, this.power);
		await Game.asyncPause(200);
	}
};

/***************************************************
 Test debuff skill
***************************************************/
class TestDebuffSkill extends TestHealSkill {

	get name() {
		return "Debuff";
	}
	get _description() {
		return `Poison the target and decrease their Power, Defense, and Speed`;
	}
	get _effectText() {
		return [
			`${this.icon('poison')} ${this.power}`,
			`${this.icon('power', this.icon('down'))} \
			${this.icon('defense', this.icon('down'))} \
			${this.icon('speed', this.icon('down'))} -1`
		];
	}

	_stats() {
		super._stats();
		this.style = 'debuff-skill';
		this._basePower = 1;
	}

	async _unitEffects(unit, _target) {
		if (!unit.evade()) {
			this._showEffect(unit.square, this.user.square, "test-heal-effect");
			unit.addStatus(UnitPiece.Power, -1);
			unit.addStatus(UnitPiece.Defense, -1);
			unit.addStatus(UnitPiece.Speed, -1);
			unit.addStatus(UnitPiece.Poison, this.power);
		}
		await Game.asyncPause(200);
	}
};

/***************************************************
 Test defensive skill
***************************************************/
class TestGuardSkill extends TestHealSkill {
	get name() {
		return "Guard";
	}
	get _description() {
		return `Anchor the target and allow them to evade one attack`;
	}
	get _effectText() {
		return [
			`+ ${this.icon('evade')} ${this.icon('anchor')}`
		];
	}

	_stats() {
		super._stats();
		this.style = 'defense-skill';
	}

	async _unitEffects(unit, _target) {
		this._showEffect(unit.square, this.user.square, "test-heal-effect");
		unit.addStatus(UnitPiece.Anchor);
		unit.addStatus(UnitPiece.Evade);
		await Game.asyncPause(200);
	}
};

/***************************************************
 Test build skill
***************************************************/
class TestBuildSkill extends SkillCard {

	get name() {
		return "Build";
	}
	get _description() {
		return "Create a wall with 2 HP";
	}
	get _effectText() {
		return [];
	}

	_stats() {
		this.style = 'build-skill';
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
	async _startEffects(_target, _squares, _units) { }
	async _squareEffects(square, _target) {
		var wall = new TestRockObject();
		wall.setTeam(this.user.team);
		square.parent.movePiece(wall, square);
		wall.addTimedClass(500, 'spawn');
		await Game.asyncPause(500);
	}
};

/***************************************************
 Test move skill
***************************************************/
class TestMoveSkill extends SkillCard {

	get name() {
		return "Regroup";
	}
	get _description() {
		return "Jump to a square adjacent to an ally";
	}
	get _rangeText() {
		return "Special";
	}
	get _effectText() {
		return [];
	}

	_stats() {
		this.style = 'move-skill';
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
	async _startEffects(target, _squares, _units) {
		var startSquare = this.user.square;
		target.parent.movePiece(this.user, target);
		var time = this.user.animateMove([startSquare], UnitPiece.Jump);
		await Game.asyncPause(time);
	}
};

/***************************************************
 Test positioning skill
***************************************************/
class ThrowSkill extends SkillCard {
	get name() {
		return "Throw";
	}
	get _description() {
		return "Toss and adjacent unit to the target square";
	}
	get _effectText() {
		return [];
	}

	_stats() {
		this.style = 'move-skill';
		this._range = 4;
		this._minRange = 2;
		this._los = false;
		this._baseCooldown = 2;
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
		if (throwSquare?.piece?.shiftable
			&& Math.abs(throwSquare?.z - this.user.square.z) <= 1) {
			return true;
		}
		return false;
	}
	async _startEffects(target) {
		var time = this.user.animateBump(target);
		this.user.addTimedClass(time, 'attack');
		await Game.asyncPause(time/2);
	}
	async _unitEffects(unit, target) {
		var startSquare = unit.square;
		target.parent.movePiece(unit, target);

		var time = unit.animateMove([startSquare], UnitPiece.Jump);
		unit.addTimedClass(time+100, 'damaged');
		await Game.asyncPause(time+100);
	}
};

class ThrowSkill2 extends SkillCard {
	get name() {
		return "Throw 2";
	}
	get _description() {
		return "Launch the target backward";
	}

	_stats() {
		this.style = 'move-skill';
		this._basePower = 1;
		this._baseCooldown = 2;
	}

	inArea(origin, target) {
		var userSquare = this.user.square;
		return this._inLine(origin, target) &&
			this._ahead(origin, target, userSquare.direction(origin)) &&
			this._canSee(origin, target);
	}

	validTarget(target) {
		return (target.piece?.shiftable);
	}
	async _startEffects(target) {
		var time = this.user.animateBump(target);
		this.user.addTimedClass(time, 'attack');
		await Game.asyncPause(time/2);

		var unit = target.piece;
		unit.push(this.user.square, 10, {animation: UnitPiece.Path});
		await Game.asyncPause(200);
	}
	async _unitEffects(unit, _target) {
		if (!unit.evade()) {
			unit.takeDamage(this.power);
		}
	}
	async _endEffects(_target, _squares, _units) {
		await Game.asyncPause(200);
	}
};