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
		this.el.classList.add('x'+this._size); // crude way to set the size

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

	_drag(ev) {
		ev.dataTransfer.setData("text", ev.target.id);
	}
	_drop(ev) {
		ev.dataTransfer.clearData("text");
	}
};

// type constants
Piece.None = 0;
Piece.Unit = 1;
Piece.Skill = 2;

/***************************************************
 Targetable piece
 ***************************************************/
class TargetablePiece extends Piece {
	constructor(size) {
		super(size);
		this.targetable = true;
	}

	/* TODO: Volatile stats and statuses are all stored on the piece
		base stats and unchangeable attributes come from a non-piece 'battler' entity */ 

	// TODO: Lots

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
		return 0;
	}
	hp() {
		return 0;
	}
	hpRate() {
		if (this.maxHp() == 0) return this.hp();
		else return this.hp() / this.maxHp();
	}

	takeDamage(power, attr) {
		alert(power+" damage!");
		return power;
	}
	heal(power, attr) {
		alert(power+" healing!");
		return power;
	}

	// movement effects
	/*push(dist, dir, attr) {
		return 0;
	}
	pull(dist, dir, attr) {
		return -this.push(-dist, dir, attr);
	}*/

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
 Controllable piece
 ***************************************************/
class ControllablePiece extends TargetablePiece {
	constructor(style, moveRange, size) {
		super(size);
		this._moveRange = moveRange != undefined ? moveRange : 3; // TEMP

		// these will end up being state-dependent, and such
		this.el.classList.add(style);
		this.el.onclick = this._click;

		// TEMP
		this._skills = [
			new TestAttackPiece(this),
			new TestHealPiece(this)
		];

		this.endTurn();
	}

	// TODO: Update selectability routinely

	moveRange() {
		if (this.moved) return 0;
		else return this._moveRange;
	}

	skills() {
		return this._skills;
	}

	startTurn() {
		this.moved = false;
		this.acted = false;
		this.setSelectable(true);
	}
	endTurn() {
		this.moved = false;
		this.acted = false;
		this.setSelectable(false);
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
	setSelectable(selectable) {
		if (selectable) {
			this.el.setAttribute("draggable", true);
			this.el.classList.add('selectable');
		} else {
			this.el.setAttribute("draggable", false);
			this.el.classList.remove('selectable');
		}
	}

	_click(ev) {
		ev.stopPropagation();
		var piece = ev.target.obj;
		var scene = Game.scene();
		if (scene) scene.selectPiece(piece);
	}
	_drag(ev) {
		super._drag(ev);
		var piece = ev.target.obj;
		var scene = Game.scene();
		if (scene) scene.selectPiece(piece, true);
	}
};

/***************************************************
 Skill use piece
 ***************************************************/
class SkillPiece extends Piece {
	constructor(user) {
		super(1);
		this.user = user;
		this.el.classList.add('skill');
		this.el.onclick = this._click;
		this.el.setAttribute("draggable", true);
		this.el.classList.add('selectable');
	}

	range() {
		return 1;
	}
	shape() {
		return Shape.Line;
	}

	// TODO: Update selectability routinely

	canUse() {
		if (this.user.acted) return false;
		else return true;
	}

	use(target) {
		if (!this._validTarget(target)) return false;

		this._cost();
		this._effects(target);
		return true;
	}

	_validTarget(target) {
		return false;
	}
	_effects(target) {

	}
	_cost() {
		this.user.acted = true;
	}

	// actions on the piece
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

	// event handler functions
	_click(ev) {
		ev.stopPropagation();
		var piece = ev.target.obj;
		var scene = Game.scene();
		if (scene) scene.selectPiece(piece);
	}
	_drag(ev) {
		super._drag(ev);
		var piece = ev.target.obj;
		var scene = Game.scene();
		if (scene) scene.selectPiece(piece, true);
	}
};

/***************************************************
 Test attack skill
 ***************************************************/
 class TestAttackPiece extends SkillPiece {
	constructor(user) {
		super(user);
		this.el.style.backgroundColor = 'red';
	}

	range() {
		return 1;
	}

	// validate target
	_validTarget(target) {
		if (target.piece && target.piece.targetable) {
			return true;
		}
		return false;
	}

	// apply effects
	_effects(target) {
		target.piece.takeDamage(1);
	}
};

/***************************************************
 Test heal skill
 ***************************************************/
 class TestHealPiece extends SkillPiece {
	constructor(user) {
		super(user);
		this.el.style.backgroundColor = 'green';
	}

	range() {
		return 2;
	}

	// validate target
	_validTarget(target) {
		if (target.piece && target.piece.targetable) {
			return true;
		}
		return false;
	}

	// apply effects
	_effects(target) {
		target.piece.heal(1);
	}
};