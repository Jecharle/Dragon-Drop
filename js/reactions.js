/***************************************************
 Test counter attack skill
***************************************************/
class TestCounterReaction extends OnHitReaction {

	get name() {
		return "Counter";
	}
	get _description() {
		return "Retaliate when attacked";
	}

	_stats() {
		this._range = 2;
		this._basePower = 1;
	}

	validTarget(target) {
		if (target.piece?.targetable && this.user.isEnemy(target.piece)) {
			return true;
		}
		return false;
	}

	async _startEffects(target, _squares, _units) {
		await Game.asyncPause(300);
		this.user.animateBump(target);
		this.user.addTimedClass(200, 'attack');

		this._showEffect(target, this.user.square, "test-attack-effect");
		
		await Game.asyncPause(100);
	}

	async _unitEffects(unit, _target) {
		if (!unit.evade()) {
			unit.takeDamage(this.power);
		}
		await Game.asyncPause(200);
	}
};

/***************************************************
 Test low HP power buff
***************************************************/
class TestRageReaction extends OnTurnStartReaction {

	get name() {
		return "Rage";
	}
	get _description() {
		return "Increase Power below 50% HP";
	}

	canReact() {
		return super.canReact() && this.user.hpRate <= 0.5;
	}

	async _unitEffects(unit, _target) {
		this._showEffect(unit.square, unit.square, "test-buff-effect");
		unit.addStatus(UnitPiece.Power, 1);
		await Game.asyncPause(400);
	}
};

/***************************************************
 Test death blast
***************************************************/
class TestExplodeReaction extends OnDeathReaction {

	get name() {
		return "Explode";
	}
	get _description() {
		return "Explode on death";
	}

	_stats() {
		this._basePower = 1;
		this._area = 1;
	}

	async _startEffects(_target, _squares, _units) {
		await Game.asyncPause(300);
	}

	async _squareEffects(square, target) {
		if (square == target) return;
		this._showEffect(square, this.user.square, "test-shot-effect").animateMove(this.user.square);
	}

	async _unitEffects(unit, _target) {
		if (!unit.evade()) {
			unit.takeDamage(this.power);
		}
		await Game.asyncPause(200);
	}
};