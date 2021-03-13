/***************************************************
 Piece
 The root class for objects you can select, click,
 and drag around between containers
 ***************************************************/
 class Piece extends ElObj {
	constructor(size) {
		super();
		this.parent = null;
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
		this.parent = container;
	}

	select() { return false; }
	deselect() { }
	type() { return Piece.None; }
	static None = 0
	static Unit = 1
	static Skill = 2

	setSelectable(selectable) {
		if (selectable) {
			this.el.setAttribute("draggable", true);
			this.el.classList.add('selectable');
		} else {
			this.el.setAttribute("draggable", false);
			this.el.classList.remove('selectable');
		}
	}
	setUnselectable(unselectable) {
		if (unselectable) {
			this.el.classList.add('unselectable');
		} else {
			this.el.classList.remove('unselectable');
		}
	}

	_click(ev) {
		ev.stopPropagation();
		var piece = ev.target.obj;
		var scene = Game.scene();
		if (scene) scene.selectPiece(piece);
	}
	_drag(ev) {
		ev.dataTransfer.setData("text", ev.target.id);
		var piece = ev.target.obj;
		var scene = Game.scene();
		if (scene) scene.selectPiece(piece, true);
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
		this.setValue(startValue);
	}

	setValue(value) {
		this.el.innerHTML = ""+value;
	}

	elType() {
		return 'span';
	}
};

/***************************************************
 Targetable piece
 ***************************************************/
 class TargetablePiece extends Piece {
	constructor(battler) {
		super(battler.Size());
		this._battler = battler;
		this.targetable = true;
		this.square = null;
		this._setStats();

		this.el.classList.add(battler.Style()); // TEMP

		this._lifebar = new Lifebar(this.hpRate());
		this.el.appendChild(this._lifebar.el);
	}

	name() {
		return this._battler.Name();
	}

	/* TODO: Volatile stats and statuses are all stored on the piece
		base stats and unchangeable attributes come from a non-piece 'battler' entity */ 

	// TODO: Lots

	_setStats() {
		this._maxHp = this._battler.MaxHp();
		this.hp = this.maxHp();
	}

	setTeam(team) {
		if (this.team && this.team.contains(this)) {
			var index = this.team.indexOf(this);
			this.team.splice(index, 1);
		}
		this.team = team;
		if (team) {
			team.push(this);
		}
	}

	maxHp() {
		return this._maxHp;
	}
	hpRate() {
		if (this.maxHp() == 0) return this.hp;
		else return this.hp / this.maxHp();
	}
	dead() {
		return this.hp <= 0;
	}
	alive() {
		return !this.dead();
	}

	refresh() {
		this._lifebar.setValue(this.hpRate());
	}

	takeDamage(power, attr) {
		this.hp -= power;
		if (this.hp < 0) {
			this.hp = 0;
			// TODO: Die?
		}

		this.el.classList.add('damaged');
		this.el.onanimationend = ev => { // TEMP?
			ev.target.classList.remove('damaged');
			ev.target.onanimationend = null;
		};

		this._showPopup(power);
		this.refresh();
		return power;
	}
	heal(power, attr) {
		this.hp += power;
		if (this.hp > this.maxHp()) {
			this.hp = this.maxHp();
		}
		this._showPopup("+"+power);
		this.refresh();
		return power;
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

		this._subEl = document.createElement(this.elType());
		this._subEl.classList.add('inner-lifebar'); // TODO: Appropriate class
		this.el.appendChild(this._subEl);
		this.setValue(startValue);
	}

	elType() {
		return 'div';
	}

	setValue(value) {
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
		this._setSkills();

		this.endTurn(); // TEMP
	}

	_setStats() {
		super._setStats();
		this._moveRange = this._battler.MoveRange();
	}
	_setSkills() {
		this._skills = this._battler.SkillList().map(SkillType => {
			return new SkillType(this);
		});
	}

	moveRange() {
		if (this.moved) return 0;
		else return this._moveRange;
	}

	skills() {
		return this._skills;
	}

	startTurn() {
		this.setSelectable(true);
		this.refresh();
	}
	endTurn() {
		this.setMoved(false);
		this.setActed(false);
		this.setSelectable(false);
		this.setUnselectable(false);
		this._startSquare = null;
		this._skills.forEach(skill => skill.endTurn());
	}
	setMoved(value) {
		this.moved = value;
	}
	setActed(value) {
		this.acted = value;
	}

	move(target) {
		if (this.moved || this.square == target) return false;

		var oldSquare = this.square;
		if (target.parent.movePiece(this, target)) {
			this.setMoved(true);
			this._startSquare = oldSquare;
			this.refresh();
			return true;
		}
		return false;
	}
	undoMove() {
		if (!this.moved || !this._startSquare) return false;
		
		if (this._startSquare.parent.movePiece(this, this._startSquare)) {
			this.setMoved(false);
			this._startSquare = null;
			this.refresh();
			return true;
		}
		return false;
	}

	refresh() {
		super.refresh();
		this._refreshSkills();
		this.setUnselectable(this.moved && this.acted);
		// TODO: toggle Selectable, but only if you're in the active team?
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
	type() {
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

		this._tooltip = new Description(this.fullDescription());
		this.el.appendChild(this._tooltip.el);

		this.refresh();
	}

	fullDescription() {
		return `<strong>${this._name()}</strong><br>${this._description()}`;
	}
	_name() {
		return "Skill Name"
	}
	_description() {
		return "Skill description"
	}

	range() {
		return 1;
	}
	minRange() {
		return 1;
	}
	shape() {
		return Shape.Line;
	}
	shapeProps() {
		return {
			range: this.range(),
			minRange: this.minRange(),
		};
	}

	canUse() {
		if (this.user.acted || this.cooldown > 0) return false;
		else return true;
	}
	use(target) {
		if (!this._validTarget(target)) return false;

		this._cost();
		this._effects(target);

		this.user.refresh();
		return true;
	}
	_validTarget(target) {
		return false;
	}
	_effects(target) { }
	_cost() {
		this.user.setActed(true);
		this.cooldown = this._cooldownCost();
	}
	_cooldownCost() {
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
		this.setSelectable(usable);
		this.setUnselectable(!usable);
		this._cooldownLabel.setValue(this.cooldown || "");
		this._tooltip.setValue(this.fullDescription());
	}

	select() {
		if (!this.canUse()) return false;
		this.el.classList.add('selected');
		return true;
	}
	deselect() {
		this.el.classList.remove('selected');
	}
	type() {
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

	elType() {
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

	_name() {
		return "Attack";
	}
	_description() {
		return `Deals 1 damage and pushes the target 1 space`;
	}

	range() {
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

	_name() {
		return "Heal";
	}
	_description() {
		return `Restores 2 HP (${this._cooldownCost()}-turn cooldown)`;
	}

	range() {
		return 1;
	}
	minRange() {
		return 0;
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
	_cooldownCost() {
		return 2;
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

	_name() {
		return "Build";
	}
	_description() {
		return `Create a wall with 1 HP (${this._cooldownCost()}-turn cooldown)`;
	}

	range() {
		return 1;
	}
	shape() {
		return Shape.Square;
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
	_cooldownCost() {
		return 3;
	}
};