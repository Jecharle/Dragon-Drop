/***************************************************
 Test basic equipment skill
***************************************************/
class TestEquip extends Equipment {
	get name() {
		return "Lucky Charm";
	}
	get _description() {
		return `Applies many bonuses`;
	}

	// hp bonus
	/*get maxHpBonus() {
		return 2;
	}*/

	// speed bonus
	/*get speedBonus() {
		return 1;
	}*/

	// grant heal skill
	/*_setSkills(user) {
		this._skills = [
			new TestHealSkill(user)
		];
	}*/

	// grant a counter attack
	/*_setReactions(user) {
		this._reactions = [
			new TestCounterReaction(user)
		];
	}*/

	// resist defense up and attack down
	/*resistsStatus(effect, value) {
		if (effect == UnitPiece.Power && value < 0) return true;
		if (effect == UnitPiece.Defense && value > 0) return true;
		return false;
	}*/

	// prevent shifting
	/*get unshiftable() {
		return true;
	}*/
};

// TODO: ensure equips can differ per character