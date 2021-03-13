/***************************************************
 Base class for static battler objects
***************************************************/
class Battler {
	constructor() {
		console.log("Battlers are static objects, do not instantiate");
	}

	static Name() {
		"Battler";
	}
	static Size() {
		return 1;
	}
	static MaxHp() {
		return 5;
	}
	static MoveRange() {
		return 2;
	}
	static SkillList() {
		return [];
	}
	
	// TODO: Other static properties, like attributes?

	static Style() { // TEMP
		return '';
	}
};

// TODO: Customizable, non-static battlers available for customizations

/***************************************************
 Temporary battler objects
***************************************************/
class Rock extends Battler {
	static Style = 'rock';
	static MaxHp = 1;
	static MoveRange = 0;
	static SkillList = [];
}
class Ball extends Battler {
	static Style = 'ball';
	static MoveRange = 3;
	static SkillList = [
				TestAttackSkill
			];
}
class Ball2 extends Battler {
	static Style = 'ball2';
	static SkillList = [
				TestAttackSkill
			];
}
class Ball3 extends Battler {
	static Style = 'ball3';
	static SkillList = [
				TestAttackSkill,
				TestHealSkill,
				TestBuildSkill
			];
	static MaxHp = 3;
}