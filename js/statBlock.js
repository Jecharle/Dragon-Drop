/***************************************************
 Battler
 Base class for static unit stat block objects
***************************************************/
class StatBlock {
	constructor () {
		console.log("StatBlocks are static objects, do not instantiate");
	}
	static Name = "Unit Name"
	static Size = 1
	static Style = ""

	static MaxHp = 1
	static MoveRange = 2

	static Skills = []

	static Ai(unit, square) { return 0; }
};

// TODO: Make these into subclasses of Piece, if I can?

/***************************************************
 Temporary battler objects
***************************************************/
class Rock extends StatBlock {
	static Name = "Rock"
	static Style = 'rock'

	static MaxHp = 1
};

class Ball extends StatBlock {
	static Name = "Green Ball"
	static Style = 'ball'

	static MaxHp = 5
	static MoveRange = 3

	static Skills = [
		TestAttackSkill,
	]
};
class Ball3 extends StatBlock {
	static Name = "Light Green Ball"
	static Style = 'ball3'

	static MaxHp = 3
	static MoveRange = 2

	static Skills = [
		TestAttackSkill,
		TestHealSkill,
		TestBuildSkill,
	]
};

class Ball2 extends StatBlock {
	static Name = "Red Ball"
	static Style = 'ball2'

	static MaxHp = 5
	static MoveRange = 2

	static Skills = [
		TestAttackSkill,
	]
};