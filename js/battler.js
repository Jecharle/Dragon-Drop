/***************************************************
 Base class for static battler objects
***************************************************/
class Battler {
	constructor() {
		console.log("Battlers are static objects, do not instantiate");
	}

	static Name = "Battler";
	static Size = 1;
	static MaxHp = 5;
	static MoveRange = 2;
	static SkillList = [];
	
	// TODO: Other static properties, like attributes?

	static Style = ''; // TEMP
};

// TODO: Non-static battlers for customizable party members

/***************************************************
 Temporary battler objects
***************************************************/
class Rock extends Battler {
	static Style = 'rock';
	static MaxHp = 1;
	static MoveRange = 0;
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
	static MaxHp = 3;
	static SkillList = [
		TestAttackSkill,
		TestHealSkill,
		TestBuildSkill
	];
}