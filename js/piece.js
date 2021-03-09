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

	setSelectable(selectable) {
		if (selectable) {
			this.el.setAttribute("draggable", true);
			this.el.classList.add('selectable');
		} else {
			this.el.setAttribute("draggable", false);
			this.el.classList.remove('selectable');
		}
	}

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
 Controllable piece
 ***************************************************/
class ControllablePiece extends TargetablePiece {
	constructor(style, moveRange, size) {
		super(size);
		this.square = null;

		this._moveRange = moveRange != undefined ? moveRange : 3; // TEMP

		// TODO: these will end up being state-dependent, possibly?
		this.el.classList.add(style);
		this.el.onclick = this._click;

		// TEMP
		this._skills = [
			new TestAttackSkill(this),
			new TestHealSkill(this)
		];

		this.endTurn(); // TEMP
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
		this.setSelectable(true);
	}
	endTurn() {
		this.setMoved(false);
		this.setActed(false);
		this.setSelectable(false);
		this._startSquare = null;
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
		this._refreshSkills();
		// TODO: Refresh your own selectability and styles?
	}
	_refreshSkills() {
		this._skills.forEach(skill => skill.setSelectable(skill.canUse()));
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
		this.setSelectable(this.canUse());
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

	canUse() {
		if (this.user.acted) return false;
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
	_effects(target) {

	}
	_cost() {
		this.user.setActed(true);
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
 class TestAttackSkill extends SkillPiece {
	constructor(user) {
		super(user);
		this.el.style.backgroundColor = 'red';
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

	range() {
		return 1;
	}

	_validTarget(target) {
		if (target.piece && target.piece.targetable) {
			return true;
		}
		return false;
	}

	_effects(target) {
		target.piece.heal(1);
	}
};