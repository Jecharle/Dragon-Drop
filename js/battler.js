/***************************************************
 Base class for static battler objects
 ***************************************************/
class Battler {
    constructor() {
        console.log("Battlers are static objects, do not instantiate");
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
        return [
            TestAttackSkill,
            TestHealSkill
        ];
    }
    
    // TODO: Other static properties?

    static Style() { // TEMP
        return '';
    }
};

/***************************************************
 Temporary battler objects
 ***************************************************/
class Ball extends Battler {
    static Style(){
        return 'ball';
    }
}
class Ball2 extends Battler {
    static Style(){
        return 'ball2';
    }
    static SkillList() {
        return [
            TestAttackSkill
        ]
    }
}