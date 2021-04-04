/***************************************************
 Piece
The root class for objects you can select, click,
and drag around between containers
***************************************************/
class Piece extends SpriteElObj {
	constructor() {
		super();
		this._parent = null;

		this.el.id = Piece.nextId();
		this.el.classList.add('piece');

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
		ev.dataTransfer.setDragImage(piece.spriteEl, 40, 56); // TEMP coordinates
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

		this.hp = this.maxHp;
		this._lifebar = new Lifebar(this.hp, this.maxHp);
		this.el.appendChild(this._lifebar.el);
	}

	get elClass() {
		return 'unit';
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
		if (!this.team || !piece) return false;
		return this.team.isAlly(piece.team);
	}
	isEnemy(piece) {
		if (!this.team || !piece) return false;
		return this.team.isEnemy(piece.team);
	}

	canStand(square) {
		if (square.blocksMove) return false;
		else return (square.piece == null || square.piece == this);
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
		return !this.dead;
	}

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
			setTimeout(() => this.el.classList.remove('damaged'), 1200);
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

		this.initialize();
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
		return this.alive && !this.homeSquare && !this.actionUsed && (this.moveRange > 0);
	}
	get canAct() {
		return this.alive && !this.actionUsed;
	}

	initialize() {
		this.myTurn = false;
		this.actionUsed = false;
		this.homeSquare = null;
		this.refresh();
	}
	startTurn() {
		this.myTurn = true;
		this.refresh();
	}
	endTurn() {
		this.myTurn = false;
		this.actionUsed = false;
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
	canPass(square) {
		if (square.blocksMove) return false;
		else return (square.piece == null || this.isAlly(square.piece));
	}
	move(target) {
		if (this.square == target) return false;

		var oldSquare = this.square;
		if (target.parent.movePiece(this, target)) {
			if (this.homeSquare == null) {
				this.homeSquare = oldSquare;
			} else if (target == this.homeSquare) {
				this.homeSquare = null;
			}
			this.face(target, target.path[0]);
			this.refresh();
			return true;
		}
		return false;
	}
	undoMove() {
		if (this.homeSquare == null) return false;
		
		if (this.homeSquare.parent.movePiece(this, this.homeSquare)) {
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

	aiMoveScore(square) {
		var nearestEnemyDistance = this._nearestTargetDistance(square, target => this.isEnemy(target.piece));
		return this._maxDistance() - nearestEnemyDistance;
	}

	get aiUnitScore() {
		// TEMP
		if (this.square) return -this._nearestTargetDistance(this.square, target => this.isEnemy(target.piece));
		else return 0;
	}

	get aiBestSkill() {
		// TEMP
		return this.skills.find(skill => skill.canUse());
	}

	// proximity nearest / most nearby squares matching a target function

	_maxDistance() {
		var board = this.parent;
		return board.h + board.w;
	}

	_nearestTargetDistance(origin, targetFunction) {
		var board = origin.parent;
		var nearestDistance = board._squares.reduce((nearest, square) => {
			if (targetFunction.call(this, square)) {
				var distance = Math.abs(square.x - origin.x) + Math.abs(square.y - origin.y);
				return Math.min(nearest, distance);
			}
			return nearest;
		}, this._maxDistance());
		return nearestDistance;
	}

	// TODO: Make this into something sensible?
	_averageTargetDistance(origin, targetFunction) {
		var board = origin.parent;
		var targetCount = 0;
		var totalDistance = board._squares.reduce((sum, square) => {
			if (targetFunction.call(this, square)){
				var distance = Math.abs(square.x - origin.x) + Math.abs(square.y - origin.y);
				targetCount += 1;
				return sum + distance;
			}
			return sum;
		}, 0);
		return targetCount > 0 ? (totalDistance / targetCount) : 0;
	}
};

/***************************************************
 Skill piece
***************************************************/
class SkillPiece extends Piece {
	constructor(user) {
		super();
		this.user = user;
		this._setStats();
		this.cooldown = 0;
		this.usesLeft = this.maxUses;

		this._cooldownLabel = new CooldownLabel("");
		this.el.appendChild(this._cooldownLabel.el);

		this._tooltip = new SkillDescription(this.fullDescription);
		this.el.appendChild(this._tooltip.el);

		this.refresh();
	}

	_setStats() {
		this._range = 1;
		this._minRange = 1;
		this._area = 0;
		this._baseCooldown = 0;
		this._maxUses = 0;
		this._basePower = 1;
	}

	get elClass() {
		return 'skill';
	}

	get fullDescription() {
		var desc = `<strong>${this._name}</strong><br>${this._description}`;
		if (this.hasLimitedUses) {
			desc += `<br><em><strong>${this.usesLeft}</strong> use${this.usesLeft == 1 ? "" : "s"}</em>`;
		}
		if (this.hasCooldown) {
			if (this.cooldown > 0) {
				desc += `<br><em>Ready in ${this.cooldown} turn${this.cooldown == 1 ? "" : "s"}</em>`;
			} else {
				desc += `<br><em>${this.cooldownCost} turn cooldown</em>`;
			}
		}
		return desc;
	}

	get _name() {
		return "[Skill name]";
	}
	get _description() {
		return "[Skill description]";
	}

	get range() {
		return this._range;
	}
	get minRange() {
		return this._minRange;
	}
	inRange(origin, target) {
		return this._inCircle(origin, target, this.range)
			&& !this._inCircle(origin, target, this.minRange-1);
	}

	get area() {
		return this._area;
	}
	inArea(origin, target) {
		return this._inCircle(origin, target, this.area);
	}

	get cooldownCost() {
		return this._baseCooldown;
	}
	get hasCooldown() {
		return this.cooldownCost > 0;
	}

	get maxUses() {
		return this._maxUses;
	}
	get hasLimitedUses() {
		return this.maxUses > 0;
	}

	get power() {
		return this._basePower;
	}

	canUse() {
		return this.user.canAct && this.cooldown <= 0 && (!this.hasLimitedUses || this.usesLeft);
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
		return !!target;
	}
	_affectedSquares(target) {
		if (!target) return [];

		return target.parent.getAoE(this, target);
	}
	_affectedUnits(squares) {
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
		this.user.actionUsed = true;
		if (this.hasCooldown) this.cooldown = this.cooldownCost;
		if (this.hasLimitedUses) this.usesLeft--;
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
		// TEMP - two separate labels?
		if (this.cooldown > 0) {
			this._cooldownLabel.value = this.cooldown;
		} else if (this.hasLimitedUses) {
			this._cooldownLabel.value = "x"+this.usesLeft;
		} else {
			this._cooldownLabel.value = "";
		}
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

	aiTargetScore(square) {
		var area = this._affectedSquares(square);
		return area.reduce((totalScore, square) => {
			if (this.user.isEnemy(square.piece)) return totalScore + 1;
			else if (this.user.isAlly(square.piece)) return totalScore - 1;
			else return totalScore;
		}, 0);
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
	_canSeeSquare(square) {
		return (!square.blocksSight && !square.piece);
	}

	_canSee(origin, target) {
		if (!origin || !target || origin.parent != target.parent) return false;
		
		var board = origin.parent;
		var x = origin.x;
		var y = origin.y;
		var tx = target.x;
		var ty = target.y;

		while (true) {
			// It's not a straight line, but good enough for how I'm using it
			if (x < tx) x++;
			else if (x > tx) x--;
			if (y < ty) y++;
			else if (y > ty) y--;

			if (x == tx && y == ty) return true;
			var square = board.at(x, y);
			if (square && !this._canSeeSquare(square)) return false;
		}
	}
	_nearTarget(_origin, target, targetFunction) {
		if (!target) return false;
		return target.parent.getAdjacent(target).some(square => {
			return (targetFunction && targetFunction.call(this.user, square));
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