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
	constructor(partyMember) {
		super();
		this._team = null;
		this._partyMember = partyMember;
		this.square = null;
		this.size = 1;

		this._setStats();

		// TODO: Make a proper "initialize" method for this?
		this.hp = this.maxHp;
		this._lifebar = new Lifebar(this.hp, this.maxHp);
		this.el.appendChild(this._lifebar.el);
	}

	get targetable() {
		return true;
	}

	get size() {
		return this._size;
	}
	set size(value) {
		if (this._size > 1) {
			this.el.classList.remove("x"+this.size);
		}
		this._size = value;
		if (this._size > 1) {
			this.el.classList.add("x"+this.size);
		}
	}

	_setStats() {
		this._maxHp = 1;
	}

	get team() {
		return this._team;
	}
	setTeam(team) {
		if (this._team) {
			this._team.remove(this);
		}
		this._team = team;
		if (this._team) {
			this._team.add(this);
		}
	}
	isAlly(piece) {
		if (!this.team) return false;
		return this.team.isAlly(piece.team);
	}
	isEnemy(piece) {
		if (!this.team) return false;
		return this.team.isEnemy(piece.team);
	}

	get hp() {
		return Math.max(Math.min(this._hp, this.maxHp), 0);
	}
	set hp(value) {
		this._hp = value;
		if (this._hp > this.maxHp) this._hp = this.maxHp;
		if (this._hp < 0) this._hp = 0;
	}
	get maxHp() {
		return Math.max(this._maxHp, 0);
	}
	get hpRate() {
		if (this.maxHp == 0) return 0;
		else return this.hp / this.maxHp;
	}
	get dead() {
		return this.hp <= 0;
	}
	get alive() {
		return !this.dead();
	}

	// TODO: Call this from somewhere standardized
		// But how to know which units to affect?
		// Separate "affected unit list" system for skills? Might help for AoE standardizing too
	dieIfDead() {
		if (this.dead) {
			this.setParent(null);
			this.setTeam(null);
			if (this._partyMember) this._partyMember.alive = false;
		}
	}

	refresh() {
		this._lifebar.maxValue = this.maxHp;
		this._lifebar.value = this.hp;
	}

	takeDamage(power, props) {
		this.hp -= power;

		if (!props || !props.noAnimation) {
			this.el.classList.add('damaged');
			setTimeout(() => this.el.classList.remove('damaged'), 1000);
		}

		this._showPopup(power);
		this.refresh();
		return power;
	}
	heal(power, props) {
		this.hp += power;
		this._showPopup("+"+power);
		this.refresh();
		return power;
	}
	_showPopup(value) {
		var popup = new PopupText(value);
		this.el.appendChild(popup.el);
	}

	push(origin, dist, props) {
		if (!this.parent) return 0;
		return this.parent.shiftPiece(this, origin, dist);
	}
	pull(origin, dist, props) {
		return this.push(origin, -dist, props);
	}
	swap(piece) {
		if (!this.parent) return false;
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

		this.endTurn(); // TEMP?
	}

	get elClass() {
		return 'unit';
	}

	_setStats() {
		super._setStats();
		this._moveRange = 2;
	}

	_setSkills() {
		this._skills = [];
	}

	get moveRange() {
		return this._moveRange;
	}

	get skills() {
		return this._skills;
	}

	get canMove() {
		return !this.moved && !this.acted;
	}
	get canAct() {
		return !this.acted;
	}

	startTurn() {
		this.myTurn = true;
		this.refresh();
	}
	endTurn() {
		this.myTurn = false;
		this.moved = false;
		this.acted = false;
		this.homeSquare = null;
		this._skills.forEach(skill => skill.endTurn());
		this.refresh();
	}

	face(target, from) {
		if (!from) from = this.square;
		if (!from || !target || from.parent != target.parent) return;

		var facing = (target.x - target.y) - (from.x - from.y);
		if (facing < 0) {
			this.el.classList.add('left');
		} else if (facing > 0) {
			this.el.classList.remove('left');
		}
	}
	move(target) {
		if (this.square == target) return false;

		var oldSquare = this.square;
		if (target.parent.movePiece(this, target)) {
			if (!this.moved) {
				this.moved = true;
				this.homeSquare = oldSquare;
			} else if (target == this.homeSquare) {
				this.moved = false;
				this.homeSquare = null;
			}
			this.face(target, this.homeSquare);
			this.refresh();
			return true;
		}
		return false;
	}
	undoMove() {
		if (!this.moved || !this.homeSquare) return false;
		
		if (this.homeSquare.parent.movePiece(this, this.homeSquare)) {
			this.moved = false;
			this.homeSquare = null;
			this.refresh();
			return true;
		}
		return false;
	}

	refresh() {
		super.refresh();
		this._refreshSkills();
		this._setUnselectable(!this.canMove && !this.canAct && this.myTurn);
		this._setSelectable(this.myTurn && (this.canMove || this.canAct));
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
 Skill piece
***************************************************/
class SkillPiece extends Piece {
	constructor(user) {
		super();
		this.user = user;
		this.cooldown = 0;

		this._cooldownLabel = new CooldownLabel("");
		this.el.appendChild(this._cooldownLabel.el);

		this._tooltip = new SkillDescription(this.fullDescription);
		this.el.appendChild(this._tooltip.el);

		this.refresh();
	}

	get elClass() {
		return 'skill';
	}

	get fullDescription() {
		var desc = `<strong>${this._name}</strong><br>${this._description}`;
		if (this._cooldownCost > 0) {
			desc += `<br><em>${this._cooldownCost} turn cooldown</em>`;
		}
		return desc;
	}

	get _name() {
		return "[Skill name]";
	}
	get _description() {
		return "[Skill description]";
	}

	_range = 1
	get range() {
		return this._range;
	}
	_minRange = 1
	get minRange() {
		return this._minRange;
	}
	inRange(origin, target) {
		return this._inCircle(origin, target, this.range)
			&& !this._inCircle(origin, target, this.minRange-1);
	}

	_area = 0;
	get area() {
		return this._area;
	}
	inArea(origin, target) {
		return this._inCircle(origin, target, this.area);
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
		return this.user.canAct && this.cooldown <= 0;
	}
	use(target) {
		if (!this.validTarget(target)) return false;
		this.user.face(target);
		
		this._payCost();

		var squares = this._affectedSquares(target);
		var units = this._affectedUnits(squares);
		this._startEffects(target, squares, units);
		squares.forEach(square => this._squareEffects(square, target));
		units.forEach(piece => this._unitEffects(piece, target));
		this._endEffects(target, squares, units);

		units.forEach(piece => piece.dieIfDead());
		this.user.refresh();
		return true;
	}

	validTarget(target) {
		return true;
	}
	_affectedSquares(target) {
		if (!target) return [];
		return target.parent.getAoE(this, target);
	}
	_affectedUnits(squares) {
		// TODO: Include a "validTargetUnit" logic in here somehow as well...?
		if (!squares) return [];
		var units = [];
		squares.forEach(square => {
			if (square.piece && square.piece.targetable && !units.includes(square.piece)) {
				units.push(square.piece);
			}
		});
		return units;
	}

	_startEffects(target, squares, units) { }
	_squareEffects(square, target) { }
	_unitEffects(unit, target) { }
	_endEffects(target, squares, units) { }

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

	// targeting shapes

	_inCircle(origin, target, size) {
		if (!origin || !target) return false;
		var dx = Math.abs(origin.x - target.x);
		var dy = Math.abs(origin.y - target.y);
		return (dx + dy <= size);
	}
	_inSquare(origin, target, size) {
		if (!origin || !target) return false;
		var dx = Math.abs(origin.x - target.x);
		var dy = Math.abs(origin.y - target.y);
		return (dx <= size && dy <= size);
	}
	_inLine(origin, target) {
		if (!origin || !target) return false;
		return (origin.x == target.x || origin.y == target.y);
	}
	_inCross(origin, target) {
		if (!origin || !target) return false;
		var dx = Math.abs(origin.x - target.x);
		var dy = Math.abs(origin.y - target.y);
		return (dx == dy);
	}

	// other targeting rules

	_canSee(origin, target, props) {
		if (!origin || !target || origin.parent != target.parent) return false;
		if (origin == target) return true;
		
		var board = origin.parent;

		var x = origin.x;
		var y = origin.y;
		var tx = target.x;
		var ty = target.y;
		while (true) {
			// It's not a straight line, but close enough for how I'm using it
			if (x < tx) x++;
			else if (x > tx) x--;
			if (y < ty) y++;
			else if (y > ty) y--;

			var square = board.at(x, y);
			if (square && (square.terrain & Square.BlockSight)) return false; // TODO: Use props to decide which terrain blocks?
			if (x == tx && y == ty) return true;
			if (square.piece) return false; // TODO: Use props to decide which pieces block
		}
	}
	_nearPiece(_origin, target, props) {
		if (!target) return false;
		return target.parent.getAdjacent(target).some(square => {
			if (square.piece) return true; // TODO: Use props to decide which pieces count
			else return false;
		});
	}

		// targeting directions (for area effects)

		_ahead(origin, target, direction) {
			var dx = target.x - origin.x;
			var dy = target.y - origin.y;
	
			var forward = dx * direction[0] + dy * direction[1];
			var sideways = Math.abs(dx * direction[1] - dy * direction[0]);
			return (forward >= 0 && forward >= sideways);
		}
		_behind(origin, target, direction) {
			var dx = target.x - origin.x;
			var dy = target.y - origin.y;
	
			var backward = -dx * direction[0] - dy * direction[1];
			var sideways = Math.abs(dx * direction[1] - dy * direction[0]);
			return (backward >= 0 && backward >= sideways);
		}
		_beside(origin, target, direction) {
			var dx = target.x - origin.x;
			var dy = target.y - origin.y;
	
			var forward = Math.abs(dx * direction[0] + dy * direction[1]);
			var sideways = Math.abs(dx * direction[1] - dy * direction[0]);
			return (sideways >= 0 && sideways >= forward);
		}
};