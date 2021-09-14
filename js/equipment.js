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

	// TODO: Add an assortment of bonuses to test!
};