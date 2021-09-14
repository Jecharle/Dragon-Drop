/***************************************************
 Test basic equipment skill
***************************************************/
class TestEquip extends Equipment {
	get name() {
		return "Lucky Charm";
	}
	get _description() {
		return `Increases max HP by 2`;
	}

	get maxHpBonus() {
		return 2;
	}

	// TODO: Also test status resistance, active skill, and reaction
	// And then ensure equips correctly go between characters
};