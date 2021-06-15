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