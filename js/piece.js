/***************************************************
 Piece
The root class for objects you can select, click,
and drag around between containers
***************************************************/
class Piece extends ElObj {
	constructor(size) {
		super();
		this._parent = null;
		this._size = size || 1;

		this.el.id = Piece.nextId();
		this.el.classList.add('piece');
		this.el.classList.add('x'+this._size); // TEMP

		// TODO: Safe to assume this is always viable?
		this.el.onclick = this._click;
		this.el.ondragstart = this._drag;
		this.el.ondragend = this._drop;
	}

	static _id = Math.floor(Math.random()*1000);
	static nextId() {
		return "piece" + Piece._id++;
	}

	idMatch(id) {
		return (!id || id == this.el.id);
	}

	size() { return this._size; }

	setParent(container) {
		if (this.parent && this.parent != container) {
			this.parent.removePiece(this);
		}
		this._parent = container;
	}
	get parent() {
		return this._parent;
	}

	select() { return false; }
	deselect() { }
	get type() { return Piece.None; }
	static None = 0
	static Unit = 1
	static Skill = 2

	_setSelectable(selectable) {
		this.el.setAttribute("draggable", Boolean(selectable));
		if (selectable) {
			this.el.classList.add('selectable');
		} else {
			this.el.classList.remove('selectable');
		}
	}
	_setUnselectable(unselectable) {
		if (unselectable) {
			this.el.classList.add('unselectable');
		} else {
			this.el.classList.remove('unselectable');
		}
	}

	_click(ev) {
		ev.stopPropagation();
		var piece = ev.target.obj;
		if (Game.scene) Game.scene.selectPiece(piece);
	}
	_drag(ev) {
		ev.dataTransfer.setData("text", ev.target.id);
		var piece = ev.target.obj;
		if (Game.scene) Game.scene.selectPiece(piece, true);
	}
	_drop(ev) {
		ev.dataTransfer.clearData("text");
		// the drop target handles the rest
	}
};

/***************************************************
 Detail
The root class for popup numbers, cooldowns,
lifebars, and other displays on pieces
***************************************************/
class Detail extends ElObj {
	constructor(startValue) {
		super();
		this.value = startValue;
	}

	set value(value) {
		this.el.innerHTML = ""+value;
	}

	get elType() {
		return 'span';
	}
};

/***************************************************
 Targetable piece
***************************************************/
class TargetablePiece extends Piece {
	constructor(battler) {
		super(battler.Size);
		this._battler = battler;
		this._square = null;
		this._team = null;
		this._setupStats();

		this.el.classList.add(battler.Style); // TEMP

		this._lifebar = new Lifebar(this.hpRate());
		this.el.appendChild(this._lifebar.el);
	}

	get name() {
		return this._battler.Name;
	}

	get targetable() {
		return true;
	}

	/* TODO: Volatile stats and statuses are all stored on the piece
		base stats and unchangeable attributes come from a non-piece 'battler' entity */ 

	// TODO: Lots

	_setupStats() {
		this._maxHp = this._battler.MaxHp;
		this.hp = this.maxHp;
	}

	get square() {
		return this._square;
	}
	set square(value) {
		this._square = value;
	}

	get team() {
		return this._team;
	}
	setTeam(team) {
		if (this._team && this._team.contains(this)) {
			var index = this._team.indexOf(this);
			this._team.splice(index, 1);
		}
		if (team) {
			team.push(this);
		}
		this._team = team;
	}

	get maxHp() {
		return this._maxHp;
	}
	hpRate() {
		if (this.maxHp == 0) return this.hp;
		else return this.hp / this.maxHp;
	}
	dead() {
		return this.hp <= 0;
	}
	alive() {
		return !this.dead();
	}

	refresh() {
		this._lifebar.value = this.hpRate();
	}

	takeDamage(power, attr) {
		this.hp -= power;
		if (this.hp < 0) {
			this.hp = 0;
			// TODO: Die?
		}

		this.el.classList.add('damaged');
		this.el.addEventListener('animationend', this._removeDamageAnimation);

		this._showPopup(power);
		this.refresh();
		return power;
	}
	heal(power, attr) {
		this.hp += power;
		if (this.hp > this.maxHp) {
			this.hp = this.maxHp;
		}
		this._showPopup("+"+power);
		this.refresh();
		return power;
	}
	_removeDamageAnimation(ev) {
		ev.target.classList.remove('damaged');
		ev.target.removeEventListener('animationend', this._removeDamageAnimation);
	}
	_showPopup(value) {
		var popup = new PopupText(value);
		this.el.appendChild(popup.el);
	}

	push(origin, dist, attr) {
		return this.parent.slidePiece(this, origin, dist);
	}
	pull(origin, dist, attr) {
		return this.push(origin, -dist, attr);
	}
	swap(piece) {
		return this.parent.swapPieces(this, piece);
	}

	// status effects
	/*
	TODO: statuses get stored by name in a dictionary
	getStatus(name) {
		return false;
	}
	addStatus(effect) {
		return false;
	}
	removeStatus(name) {
		return false;
	}*/
};

/***************************************************
 TargetablePiece -> Lifebar
***************************************************/
class Lifebar extends Detail {
	constructor(startValue) {
		super(-1);
		this.el.classList.add('lifebar'); // TODO: Appropriate class

		this._subEl = document.createElement(this.elType);
		this._subEl.classList.add('inner-lifebar'); // TODO: Appropriate class
		this.el.appendChild(this._subEl);
		this.value = startValue;
	}

	get elType() {
		return 'div';
	}

	set value(value) {
		if (value >= 0 && value <= 1) {
			this._subEl.style.width = String(Math.floor(value*100))+"%";
		}
	}
}

/***************************************************
 TargetablePiece -> PopupText
***************************************************/
class PopupText extends Detail {
	constructor(startValue) {
		super(startValue);
		this.el.classList.add('popup-text');
		this.el.onanimationend = ev => {
			ev.target.parentElement.removeChild(ev.target);
		};
	}
}

/***************************************************
 Controllable piece
***************************************************/
class ControllablePiece extends TargetablePiece {
	constructor(battler) {
		super(battler);
		this.el.classList.add('unit');

		this._setupSkills();
		this.endTurn(); // TEMP
	}

	_setupStats() {
		super._setupStats();
		this._moveRange = this._battler.MoveRange;
	}
	_setupSkills() {
		this._skills = this._battler.SkillList.map(SkillType => {
			return new SkillType(this);
		});
	}

	get moveRange() {
		if (this.moved) return 0;
		else return this._moveRange;
	}

	get skills() {
		return this._skills;
	}

	startTurn() {
		this.myTurn = true;
		this.refresh();
	}
	endTurn() {
		this.myTurn = false;
		this.moved = false;
		this.acted = false;
		this._startSquare = null;
		this._skills.forEach(skill => skill.endTurn());
		this.refresh();
	}

	get moved() {
		return this._moved;
	}
	set moved(value) {
		this._moved = value;
	}
	get acted() {
		return this._acted;
	}
	set acted(value) {
		this._acted = value;
	}
	get myTurn() {
		return this._myTurn;
	}
	set myTurn(value) {
		this._myTurn = value;
	}

	move(target) {
		if (this.moved || this.square == target) return false;

		var oldSquare = this.square;
		if (target.parent.movePiece(this, target)) {
			this.moved = true;
			this._startSquare = oldSquare;
			this.refresh();
			return true;
		}
		return false;
	}
	undoMove() {
		if (!this.moved || !this._startSquare) return false;
		
		if (this._startSquare.parent.movePiece(this, this._startSquare)) {
			this.moved = false;
			this._startSquare = null;
			this.refresh();
			return true;
		}
		return false;
	}

	refresh() {
		super.refresh();
		this._refreshSkills();
		this._setUnselectable(this.moved && this.acted && this.myTurn);
		this._setSelectable(this.myTurn && !(this.moved && this.acted));
	}
	_refreshSkills() {
		this._skills.forEach(skill => skill.refresh());
	}

	select() {
		this.el.classList.add('selected');
		return true;
	}
	deselect() {
		this.el.classList.remove('selected');
	}
	get type() {
		return Piece.Unit;
	}
};

/***************************************************
 Skill use piece
***************************************************/
class SkillPiece extends Piece {
	constructor(user) {
		super(1);
		this.user = user;
		this.cooldown = 0;
		this.el.classList.add('skill');

		this._cooldownLabel = new Label("");
		this.el.appendChild(this._cooldownLabel.el);

		this._tooltip = new Description(this.fullDescription);
		this.el.appendChild(this._tooltip.el);

		this.refresh();
	}

	get fullDescription() {
		var desc = `<strong>${this._name}</strong><br>${this._description}`;
		if (this._cooldownCost > 0) {
			desc += `<br><em>(${this._cooldownCost} turn cooldown)</em>`;
		}
		return desc;
	}
	get _name() {
		return "Skill Name"
	}
	get _description() {
		return "Skill description"
	}

	get range() {
		return 1;
	}
	get minRange() {
		return 1;
	}
	get shape() {
		return Shape.Line;
	}
	get shapeProps() {
		return {
			range: this.range,
			minRange: this.minRange,
		};
	}

	canUse() {
		if (this.user.acted || this.cooldown > 0) return false;
		else return true;
	}
	use(target) {
		if (!this._validTarget(target)) return false;

		this._payCost();
		this._effects(target);

		this.user.refresh();
		return true;
	}
	_validTarget(target) {
		return false;
	}
	_effects(target) { }
	_payCost() {
		this.user.acted = true;
		this.cooldown = this._cooldownCost;
	}
	get _cooldownCost() {
		return 0;
	}

	endTurn() {
		this.cooldown--;
		if (this.cooldown < 0) {
			this.cooldown = 0;
		}
	}

	refresh() {
		var usable = this.canUse();
		this._setSelectable(usable);
		this._setUnselectable(!usable);
		this._cooldownLabel.value = this.cooldown || "";
		this._tooltip.value = this.fullDescription;
	}

	select() {
		if (!this.canUse()) return false;
		this.el.classList.add('selected');
		return true;
	}
	deselect() {
		this.el.classList.remove('selected');
	}
	get type() {
		return Piece.Skill;
	}
};

/***************************************************
 SkillPiece -> Label
***************************************************/
class Label extends Detail {
	constructor(startValue) {
		super(startValue);
		this.el.classList.add('skill-use-label');
	}
}

/***************************************************
 SkillPiece -> Skill Description
***************************************************/
class Description extends Detail {
	constructor(startValue) {
		super(startValue);
		this.el.classList.add('skill-description');
	}

	get elType() {
		return 'div';
	}
}

/***************************************************
 Test attack skill
***************************************************/
class TestAttackSkill extends SkillPiece {
	constructor(user) {
		super(user);
		this.el.style.backgroundColor = 'red';
	}

	get _name() {
		return "Attack";
	}
	get _description() {
		return "Deal 1 damage and push the target 1 space";
	}

	get range() {
		return 2;
	}

	_validTarget(target) {
		if (target.piece && target.piece.targetable) {
			return true;
		}
		return false;
	}

	_effects(target) {
		var targetPiece = target.piece;
		targetPiece.takeDamage(1);
		targetPiece.push(this.user.square, 1);
	}
};

/***************************************************
 Test heal skill
***************************************************/
class TestHealSkill extends SkillPiece {
	constructor(user) {
		super(user);
		this.el.style.backgroundColor = 'green';
	}

	get _name() {
		return "Heal";
	}
	get _description() {
		return "Restore 2 HP";
	}

	get range() {
		return 1;
	}
	get minRange() {
		return 0;
	}

	get _cooldownCost() {
		return 2;
	}

	_validTarget(target) {
		if (target.piece && target.piece.targetable) {
			return true;
		}
		return false;
	}
	_effects(target) {
		target.piece.heal(2);
	}
};

/***************************************************
 Test build skill
***************************************************/
class TestBuildSkill extends SkillPiece {
	constructor(user) {
		super(user);
		this.el.style.backgroundColor = 'purple';
	}

	get _name() {
		return "Build";
	}
	get _description() {
		return "Create a wall with 1 HP";
	}

	get range() {
		return 1;
	}
	get shape() {
		return Shape.Square;
	}

	get _cooldownCost() {
		return 3;
	}

	_validTarget(target) {
		if (!target.piece) {
			return true;
		}
		return false;
	}
	_effects(target) {
		var wall = new TargetablePiece(Rock);
		return target.parent.movePiece(wall, target);
	}
};