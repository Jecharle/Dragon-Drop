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
		if (container) container.addPiece(this);
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
 Unit piece
***************************************************/
class UnitPiece extends Piece {
	constructor(partyMember) {
		super();
		this._team = null;
		this._partyMember = partyMember;
		this.square = null;
		this.size = 1;
		this._moveStyle = "path";

		this._setStats();
		this._setSkills();

		this.hp = this.maxHp;
		this._lifebar = new Lifebar(this.hp, this.maxHp);
		this.el.appendChild(this._lifebar.el);

		this.initialize();
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
		this._moveRange = 2;
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
			this._showDeathAnimation();
			this.setParent(null);
			this.setTeam(null);
			if (this._partyMember) this._partyMember.alive = false;
		}
	}

	refresh() {
		this._lifebar.maxValue = this.maxHp;
		this._lifebar.value = this.hp;

		this._refreshSkills();
		this._setUnselectable(!this.canMove && !this.canAct && this.myTurn);
		this._setSelectable(this.myTurn && (this.canMove || this.canAct));
	}

	takeDamage(power, _props) {
		this.hp -= power;

		if (power > 0) {
			this._addTimedClass(1200, 'damaged', 'hp-change');
		}

		this.refresh();
		return power;
	}
	heal(power, _props) {
		this.hp += power;

		if (power > 0) {
			this._addTimedClass(1200, 'hp-change');
		}

		this.refresh();
		return power;
	}
	_showPopup(value) {
		var popup = new PopupText(value);
		this.el.appendChild(popup.el);
	}
	_addTimedClass(duration, ...classList) {
		this.el.classList.add(...classList);
		setTimeout(() => this.el.classList.remove(...classList), duration);
	}
	_showDeathAnimation() {
		if (!this.square) return;
		var spriteEffect = new SpriteEffect(2000, "unit", this.style, "dead");
		if (this._facing > 0) spriteEffect.el.classList.add("left");
		this.square.el.appendChild(spriteEffect.el);
	}


	push(origin, distance, props) {
		if (!this.parent) return 0;
		var previousSquare = this.square;
		var distanceMoved = this.parent.shiftPiece(this, origin, distance);
		if (props?.animation) {
			this.animateMove([previousSquare], props.animation);
		}
		return distanceMoved;
	}
	pull(origin, distance, props) {
		return this.push(origin, -distance, props);
	}
	swap(piece, props) {
		if (!this.parent) return false;
		if (this.parent.swapPieces(this, piece)) {
			if (props?.animation) {
				this.animateMove([piece.square], props.animation);
			}
			if (props?.animation2) {
				piece.animateMove([this.square], props.animation2);
			}
			return true;
		}
		return false;
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

	_setSkills() {
		this._skills = [];
	}

	get _name() {
		return "[Unit name]";
	}
	get _description() {
		return "[Unit description]";
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
		this._facing = 0;
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
			this._facing = 180;
		} else if (facing > 0) {
			this.el.classList.remove('left');
			this._facing = 0;
		}
	}
	animateMove(path, type) {
		var moveTime = 0;
		switch (type) {
			case "jump":
				moveTime = this._animateJump(path)
				break;

			case "teleport":
				moveTime = this._animateTeleport(path);
				break;

			default:
			case "path":
				moveTime = this._animatePath(path);
				break;
		}
		this._addTimedClass(moveTime, 'moving');
	}
	_animatePath(path) {
		var target = this.square;

		var keyframes = [{}];
		path.forEach(square => {
			var dx = 64*(square.x - target.x - square.y + target.y);
			var dy = 32*(square.x - target.x + square.y - target.y);
			var dz = dy;

			keyframes.push({
				transform: `translate3d(${dx}px, ${dy}px, ${dz}px) rotateY(${this._facing}deg)`
			});
		});
		keyframes.reverse();
		var time = 100*keyframes.length
		this.spriteEl.animate(keyframes, {duration: time, easing: "linear"});		
		return time;
	}
	_animateJump(path) {
		var target = this.square;
		var origin = path[path.length-1];

		var dx = 64*(origin.x - target.x - origin.y + target.y);
		var dy = 32*(origin.x - target.x + origin.y - target.y);
		var dz = dy;
		var time = 400;

		var keyframes = [
			{ transform: `translate3d(${dx}px, ${dy}px, ${dz}px) rotateY(${this._facing}deg)` },
			{ }
		];
		this.spriteEl.animate(keyframes, {duration: time, easing: "linear"});

		var jumpframes = [
			{ },
			{ bottom: "128px" }
		];
		this.spriteEl.animate(jumpframes, {duration: time/2, iterations: 2, direction: "alternate", easing: "ease-out"});
		return time;
	}
	_animateTeleport(path) {
		var target = this.square;
		var origin = path[path.length-1];

		var dx = 64*(origin.x - target.x - origin.y + target.y);
		var dy = 32*(origin.x - target.x + origin.y - target.y);
		var dz = dy;
		var time = 400;

		var keyframes = [
			{ transform: `translate3d(${dx}px, ${dy}px, ${dz}px) rotateY(${this._facing}deg)` },
			{ transform: `translate3d(${dx}px, ${dy}px, ${dz}px) rotateY(90deg) scaleY(1.5)` },
			{ transform: `translate3d(0, 0, 0) rotateY(90deg) scaleY(1.5)` },
			{ }
		];
		this.spriteEl.animate(keyframes, {duration: time, easing: "linear"});
		return time;
	}

	animateBump(target, origin) {
		var direction = this.parent.getDirection(this.square, target);
		var dx = 32*(direction[0] - direction[1]);
		var dy = 16*(direction[0] + direction[1]);
		var dz = dy;
		var time = 200;

		var keyframes = [
			{ },
			{ transform: `translate3d(${dx}px, ${dy}px, ${dz}px) rotateY(${this._facing}deg)` },
			{ }
		];
		if (origin) {
			dx = 32*(origin.x - this.square.x - origin.y + this.square.y);
			dy = 16*(origin.x - this.square.x + origin.y - this.square.y);
			dz = dy;
			keyframes[0] = { transform: `translate3d(${dx}px, ${dy}px, ${dz}px) rotateY(${this._facing}deg)` };
		}
		this.spriteEl.animate(keyframes, {duration: time, easing: "ease-out"});
		// TODO: Add attacking style, or leave that elsewhere?
	}

	canPass(square) {
		if (square.blocksMove) return false;
		else return (square.piece == null || this.isAlly(square.piece));
	}

	move(target) {
		if (this.square == target) return false;

		var oldSquare = this.square;
		if (target.parent.movePiece(this, target)) {
			this.homeSquare = oldSquare;
			this.animateMove(target.path, this._moveStyle);
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

	get aiUnitScore() {
		if (this.square) return -this._nearestPieceDistance(this.square, piece => this.isEnemy(piece));
		else return 0;
	}

	_aiGetBestSkill(square) {
		return this.skills.reduce((best, skill) => {
			if (!skill.canUse()) return best;

			var newSkill = skill.aiGetBestTarget(square);
			newSkill.skill = skill;
			if (newSkill.target && newSkill.score > best.score) return newSkill;
			
			return best;
		},
		{
			skill: null, target: null, score: 0
		});
	}

	// assumes the unit has been selected, and move range is visible
	aiCalculate() {

		var bestPlan = this.parent.squares.reduce((best, square) => {
			// square must be reachable
			if (square.invalid || !square.path) return best;
			// in range trumps out of range (already in-range)
			if (best.move?.inRange && !square.inRange) return best;
			
			var newPlan = this._aiGetBestSkill(square);
			newPlan.move = square;
			if (!newPlan.target || newPlan.score <= 0) return best;

			// in range trumps out of range
			if (newPlan.move.inRange && !best.move?.inRange) return newPlan;
			// better score wins
			if (newPlan.score > best.score) return newPlan;
			// equal score, fewer moves wins
			if (newPlan.score == best.score && newPlan.move.movesLeft > best.move.movesLeft) return newPlan;
			
			return best;
		},
		{
			move: null, skill: null, target: null, score: 0
		});

		this.aiMoveTarget = bestPlan.move;

		if (!this.aiMoveTarget.invalid && this.aiMoveTarget.inRange) {
			this.aiSkill = bestPlan.skill;
			this.aiSkillTarget = bestPlan.target;	
		} else  {
			// can't reach the target this turn
			this.aiMoveTarget = this.aiMoveTarget.path.find(square => square.inRange && !square.invalid);
			this.aiSkill = null;
			this.aiSkillTarget = null;
		}
	}

	// distance to nearby units of interest

	_maxDistance() {
		var board = this.parent;
		return board.h + board.w;
	}

	_nearestPieceDistance(origin, targetFunction) {
		var nearestDistance = origin.parent.pieces.reduce((nearest, piece) => {
			if (targetFunction.call(this, piece)) {
				var distance = Math.abs(piece.square.x - origin.x) + Math.abs(piece.square.y - origin.y);
				return Math.min(nearest, distance);
			}
			return nearest;
		}, this._maxDistance());
		return nearestDistance;
	}

	_averagePieceDistance(origin, targetFunction) {
		var targetCount = 0;
		var totalDistance = origin.parent.pieces.reduce((sum, piece) => {
			if (targetFunction.call(this, piece)){
				var distance = Math.abs(piece.square.x - origin.x) + Math.abs(piece.square.y - origin.y);
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
	use(target, callback) {
		if (!this.validTarget(target)) callback(false);
		this.user.face(target);

		this._target = target;
		this._squares = this._affectedSquares(this._target);
		this._units = this._affectedUnits(this._squares);
		
		var waitTime = this._startEffects(this._target, this._squares, this._units);
		setTimeout(() => this._squareEffectIterator(this._squares.values(), callback), waitTime);
	}
	_squareEffectIterator(squareIterator, callback) {
		var next = squareIterator.next();
		var waitTime = 0;
		if (next.value) {
			waitTime = this._squareEffects(next.value, this._target);
		}
		if (next.done) {
			this._unitEffectIterator(this._units.values(), callback);
		} else {
			setTimeout(() => this._squareEffectIterator(squareIterator, callback), waitTime);
		}
	}
	_unitEffectIterator(unitIterator, callback) {
		var next = unitIterator.next();
		var waitTime = 0;
		if (next.value) {
			waitTime = this._unitEffects(next.value, this._target);
		}
		if (next.done) {
			this._finishUse(callback);
		} else {
			setTimeout(() => this._unitEffectIterator(unitIterator, callback), waitTime);
		}
	}
	_finishUse(callback) {
		this._endEffects(this._target, this._squares, this._units);
		this._payCost();
		this._units.forEach(piece => piece.dieIfDead());
		this.user.refresh();
		
		this._target = null;
		this._units = null;
		this._squares = null;
		if (callback) callback(true);
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

	_startEffects(target, _squares, _units) {
		this.user.animateBump(target);

		if (target.x < this.user.square.x || target.y > this.user.square.y) this._showEffect(target, "test-attack-effect", "left");
		else this._showEffect(target, "test-attack-effect");
		
		return 100;
	}

	_squareEffects(_square, _target) { return 0; }
	_unitEffects(_unit, _target) { return 0; }
	_endEffects(_target, _squares, _units) { return 0; }

	_showEffect(square, ...styles) {
		if (!square) return;
		var vfx = new SpriteEffect(1000, "unit", ...styles);
		square.el.appendChild(vfx.el);
	}

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

	_aiBaseTargetScore(target) {
		return 0;
	}
	_aiAreaTargetScore(square) {
		if (this.user.isEnemy(square.piece)) return 1;
		else if (this.user.isAlly(square.piece)) return -0.9;
		else if (square.piece) return 0.1;
		else return 0;
	}
	_aiTargetScore(target) {
		var area = this._affectedSquares(target);
		return area.reduce((totalScore, square) => {
			return totalScore + this._aiAreaTargetScore(square);
		}, this._aiBaseTargetScore(target));
	}

	aiGetBestTarget(origin) {
		var best = origin.parent.squares.reduce((best, target) => {
			if (!this.validTarget(target) || !this.inRange(origin, target)) return best;

			var score = this._aiTargetScore(target);
			if (score >= best.score){
				 return {
					target: target,
					score: score
				};
			}
			return best;
		},
		{
			target: null,
			score: 0
		});
		return best;
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