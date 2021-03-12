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
        return [
            TestAttackSkill,
            TestHealSkill
        ];
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
class Ball extends Battler {
    static Style(){
        return 'ball';
    }
    static MoveRange() {
        return 3;
    }
    static SkillList() {
        return [
            TestAttackSkill
        ]
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
class Ball3 extends Battler {
    static Style(){
        return 'ball3';
    }
    static MaxHp(){
        return 3;
    }
}