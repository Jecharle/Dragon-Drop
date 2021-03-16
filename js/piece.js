/***************************************************
 Piece
The root class for objects you can select, click,
and drag around between containers
***************************************************/
class Piece extends ElObj {
	constructor() {
		super();
		this._parent = null;

		this.el.id = Piece.nextId();
		this.el.classList.add('piece');

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
	static get None() { return 0; }
	static get Unit() { return 1; }
	static get Skill() { return 2; }

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
		ev.dataTransfer.setData("piece", ev.target.id);
		var piece = ev.target.obj;
		if (Game.scene) Game.scene.selectPiece(piece, true);
	}
	_drop(ev) {
		ev.dataTransfer.clearData("piece");
		// the drop target handles the rest
	}
};

/***************************************************
 Targetable piece
***************************************************/
class TargetablePiece extends Piece {
	constructor() {
		super();
		this._team = null;
		this.square = null;

		this._setStats();

		// TODO: Make a proper "initialize" method for this?
		this.hp = this.maxHp;
		this._lifebar = new Lifebar(this.hpRate);
		this.el.appendChild(this._lifebar.el);
	}

	get targetable() {
		return true;
	}

	get size() {
		return this._size;
	}
	set size(value) {
		if (this._size) {
			this.el.classList.remove("x"+this.size);
		}
		if (value) {
			this.el.classList.add("x"+this._size);
		}
		this._size = value;
	}

	_setStats() {
		this._maxHp = 1;
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
	get hpRate() {
		if (this.maxHp == 0) return this.hp;
		else return this.hp / this.maxHp;
	}
	get dead() {
		return this.hp <= 0;
	}
	get alive() {
		return !this.dead();
	}

	refresh() {
		this._lifebar.value = this.hpRate;
	}

	takeDamage(power, attr) {
		this.hp -= power;

		if (this.hp < 0) {
			this.hp = 0;
			// TODO: Die?
		}

		this.el.classList.add('damaged');
		this.el.addEventListener('animationend', this._removeDamagedAnimation);

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
	_removeDamagedAnimation(ev) {
		ev.target.classList.remove('damaged');
		ev.target.removeEventListener('animationend', this._removeDamagedAnimation);
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
	// TODO: status effects are stored in a dictionary, and occasionally looped through
	/*hasStatus(name) {
		return false;
	}
	addStatus(effect) {
		return false;
	}
	removeStatus(name) {
		return false;
	}
	statusList() {

	}*/
};

/***************************************************
 Controllable piece
***************************************************/
class ControllablePiece extends TargetablePiece {
	constructor() {
		super();
		this._setSkills();
		this.el.classList.add('unit');

		this.endTurn(); // TEMP?
	}

	_setStats() {
		super._setStats();
		this._moveRange = 2;
	}

	_setSkills() {
		this._skills = [];
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
		super();
		this.user = user;
		this.cooldown = 0;
		this.el.classList.add('skill');

		this._cooldownLabel = new CooldownLabel("");
		this.el.appendChild(this._cooldownLabel.el);

		this._tooltip = new SkillDescription(this.fullDescription);
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

	_name = "Skill Name"
	get _description() {
		return "Skill description"
	}

	_range = 1
	get range() {
		return this._range;
	}

	_minRange = 1
	get minRange() {
		return this._minRange;
	}

	_shape = Shape.Line
	get shape() {
		return this._shape;
	}
	get shapeProps() {
		return {
			range: this.range,
			minRange: this.minRange,
		};
	}

	_baseCooldown = 0
	get _cooldownCost() {
		return this._baseCooldown;
	}

	_basePower = 1
	get power() {
		return this._basePower;
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