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

		// advanced element setup
		this.el.id = Piece.nextId();
		this.el.classList.add('piece');
		this.el.classList.add('x'+this._size); // crude way to set the size

		// drag and drop handling
		this.el.draggable = false;
		this.el.ondragstart = this._drag;
		this.el.ondragend = this._drop;
	}

	// static tracker for element IDs
	static _id = Math.floor(Math.random()*1000);
	static nextId() {
		return "piece" + Piece._id++;
	}

	// size of the piece
	size() { return this._size; }

	// update the parent container
	setParent(container) {
		if (this.parent && this.parent != container) {
			this.parent.removePiece(this);
		}
		this.parent = container;
	}

	// piece can be selected or deselected
	select() { return false; }
	deselect() { }
	action() { return ""; }

	// handle drag and drop
	_drag(ev) {
		ev.dataTransfer.setData("text", ev.target.id);
	}
	_drop(ev) {
		ev.dataTransfer.clearData("text");
	}
};

/***************************************************
 Targetable piece
 ***************************************************/
class TargetablePiece extends Piece {
	constructor(size) {
		super(size);
		this.targetable = true;
	}

	/* TODO: Current stats and state are all stored on the piece
		base stats and non-changing attributes come from a non-piece entity*/ 

	// TODO: Lots

	// HP, damage, and healing
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
		window.alert(power+" damage!");
		return power;
	}
	heal(power, attr) {
		window.alert(power+" healed!");
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
	// TODO: get current statuses
	// TODO: check for a status?

	addStatus(effect) {
		return false;
	}
	removeStatus(effect) {
		return false;
	}*/
};

/***************************************************
 Moveable piece
 ***************************************************/
class ControllablePiece extends TargetablePiece {
	constructor(type, moveRange, size) {
		super(size);
		this.type = type;
		this._moveRange = moveRange != undefined ? moveRange : 3; // TEMP

		// these will end up being state-dependent, and such
		this.el.classList.add(type);
		this.el.onclick = this._click;
		if (this._moveRange) this.el.draggable = true; // TEMP
	}

	// the piece is now moveable
	moveRange() {
		return this._moveRange;
	}

	// actions on the piece
	select() {
		this.el.classList.add('selected');
		return true;
	}
	deselect() {
		this.el.classList.remove('selected');
	}
	action() {
		return "move";
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
 Skill use piece
 ***************************************************/
class SkillPiece extends Piece {
	constructor(user) {
		super(1);
		this.user = user;
		this.el.classList.add('skill');
		this.el.onclick = this._click;
		this.el.draggable = true;
	}

	range() {
		return 1;
	}

	shape() {
		return null; // TEMP
	}

	// TODO: Action requirements

	// apply effects
	use(target) {
		if (target.piece && target.piece.targetable) {
			target.piece.takeDamage(1);
			return true;
		}
		return false;
	}

	// actions on the piece
	select() {
		this.el.classList.add('selected');
		return true;
	}
	deselect() {
		this.el.classList.remove('selected');
	}
	action() {
		return "skill";
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