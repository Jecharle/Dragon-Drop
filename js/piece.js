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

	get type() { return Piece.None; }
	static get None() { return 0; }
	static get Unit() { return 1; }
	static get Skill() { return 2; }
	static get Map() { return 3; }

	//#region parent
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
	//#endregion parent

	//#region refresh
	refresh() { }
	_setSelectable(selectable) {
		this.el.setAttribute("draggable", Boolean(selectable));
		if (selectable) {
			this.el.classList.add('selectable');
			this.el.classList.remove('viewable');
		} else {
			this.el.classList.remove('selectable');
			this.el.classList.add('viewable');
		}
	}
	_setUnselectable(unselectable) {
		if (unselectable) {
			this.el.classList.add('unselectable');
		} else {
			this.el.classList.remove('unselectable');
		}
	}
	//#endregion

	//#region input events
	select() { return false; }
	deselect() { }

	_click(ev) {
		ev.stopPropagation();
		var piece = ev.currentTarget.obj;
		if (Game.scene) Game.scene.pieceEvent(piece);
	}
	_drag(ev) {
		ev.dataTransfer.setData("piece", ev.currentTarget.id);
		var piece = ev.currentTarget.obj;
		ev.dataTransfer.setDragImage(piece.spriteEl, 40, 56); // TEMP until I make it detect the size
		if (Game.scene) Game.scene.pieceEvent(piece, true);
	}
	_drop(ev) {
		ev.dataTransfer.clearData("piece");
		// the drop target handles the rest
	}
	//#endregion input events
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

		this._initialize();
	}

	get elClass() {
		return 'unit';
	}

	get type() {
		return Piece.Unit;
	}

	get targetable() {
		return true;
	}

	//#region text
	get name() {
		return "[Unit name]";
	}
	get characterName() {
		return this._partyMember?.name || this.name;
	}
	get _description() {
		return "[Unit description]";
	}
	get fullDescription() {
		var description = `<strong>${this.name}</strong><br>${this._description}`;
		return description;
	}
	//#endregion text

	//#region setup
	_setStats() {
		this._maxHp = 1;
		this._moveRange = 2;
	}
	_setSkills() {
		this._skills = [];
	}
	_initialize() {
		this.myTurn = false;
		this.actionUsed = false;
		this.homeSquare = null;
		this._facing = 1;
		this.refresh();
	}
	//#endregion setup

	//#region attributes
	get size() { return this._size; }
	set size(value) {
		if (this._size > 1) {
			this.el.classList.remove("x"+this.size);
		}
		this._size = value;
		if (this._size > 1) {
			this.el.classList.add("x"+this.size);
		}
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

	get moveRange() {
		return this._moveRange;
	}

	get skills() {
		return this._skills;
	}
	//#endregion attributes

	//#region refresh
	refresh() {
		this._lifebar.maxValue = this.maxHp;
		this._lifebar.value = this.hp;

		this._refreshSkills();
		this._setUnselectable(!this.canMove && !this.canAct && this.myTurn);
		this._setSelectable(this.myTurn && (this.canMove || this.canAct));
	}
	_refreshSkills() {
		this._skills.forEach(skill => skill.refresh());
	}
	dieIfDead() {
		if (this.dead) {
			this._showDeathAnimation();
			this.setParent(null);
			this.setTeam(null);
			if (this._partyMember) this._partyMember.alive = false;
		}
	}
	//#endregion refresh

	//#region effects
	takeDamage(power, _props) {
		this.hp -= power;

		if (power > 0) {
			this.addTimedClass(450, 'damaged');
			this.addTimedClass(1200, 'hp-change');
		}

		this.refresh();
		return power;
	}
	heal(power, _props) {
		this.hp += power;

		if (power > 0) {
			this.addTimedClass(1200, 'hp-change');
		}

		this.refresh();
		return power;
	}

	push(origin, distance, props) {
		if (!this.parent) return 0;
		var previousSquare = this.square;
		var distanceMoved = this.parent.shiftPiece(this, origin, distance, props);
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
	//#endregion effects

	//#region turn state
	get canMove() {
		return this.alive && !this.homeSquare && !this.actionUsed;
	}
	get canAct() {
		return this.alive && !this.actionUsed;
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
	//#endregion turn state

	//#region move
	async move(target) {
		if (this.square == target) return false;

		var oldSquare = this.square;
		if (target.parent.movePiece(this, target)) {
			var moveTime = this.animateMove(target.path, this._moveStyle);
			this.addTimedClass(moveTime, 'moving');
			this.face(target, target.path[0]);
			await Game.asyncPause(moveTime);

			this.homeSquare = oldSquare;
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

	canStand(square) {
		if (square.blocksMove) return false;
		else return (square.piece == null || square.piece == this);
	}
	canPass(square) {
		if (square.blocksMove) return false;
		else return (square.piece == null || this.isAlly(square.piece));
	}
	//#endregion move

	//#region animate
	static get Path() { return 1; }
	static get Jump() { return 2; }
	static get Teleport() { return 3; }

	animateMove(path, type) {
		switch (type) {
			case UnitPiece.Jump:
				return this._animateJump(path)

			case UnitPiece.Teleport:
				return this._animateTeleport(path);

			default:
			case UnitPiece.Path:
				return this._animatePath(path);
		}
	}
	_animatePath(path) {
		var keyframes = [{}];
		var turnframes = [{}];
		var lastSquare = null, facing = this._facing;
		path.forEach(square => {
			keyframes.unshift({
				transform: square.screenPosition,
				zIndex: square.screenZ
			});
			if (lastSquare) {
				if (square.screenX > lastSquare.screenX) facing = -1;
				else if (square.screenX < lastSquare.screenX) facing = 1;
				turnframes.unshift({
					transform: `scaleX(${facing})`
				});
				turnframes.unshift({
					transform: `scaleX(${facing})`
				});
			}
			lastSquare = square;
		});
		turnframes.unshift({
			transform: `scaleX(${this._facing})`
		});
		var time = 200*(keyframes.length-1);
		this.el.animate(keyframes, {duration: time, easing: "linear"});	
		this.spriteEl.animate(turnframes, {duration: time, easing: "linear"});
		return time;
	}
	_animateJump(path) {
		var origin = path[path.length-1];
		var keyframes = [
			{
				transform: origin.screenPosition,
				zIndex: origin.screenZ
			},
			{ }
		];
		var time = 400;
		this.el.animate(keyframes, {duration: time, easing: "linear"});

		var jumpframes = [
			{ },
			{ bottom: "128px" }
		];
		this.spriteEl.animate(jumpframes, {duration: time/2, iterations: 2, direction: "alternate", easing: "ease-out"});
		return time;
	}
	_animateTeleport(path) {
		var origin = path[path.length-1];

		var time = 400;
		var keyframes = [
			{
				transform: origin.screenPosition,
				zIndex: origin.screenZ
			},
			{
				transform: origin.screenPosition,
				zIndex: origin.screenZ
			}
		];
		this.el.animate(keyframes, time/2);

		var twistframes = [
			{ transform: `scaleX(${this._facing})`},
			{ transform: `scaleX(0) scaleY(1.5)` },
			{ }
		];
		this.spriteEl.animate(twistframes, {duration: time, easing: "ease-in-out"});
		return time;
	}

	face(target, from) {
		if (!from) from = this.square;
		if (!from || !target || from.parent != target.parent) return;

		var facing = (target.x - target.y) - (from.x - from.y);
		if (facing < 0) {
			this.el.classList.add('left');
			this._facing = -1;
		} else if (facing > 0) {
			this.el.classList.remove('left');
			this._facing = 1;
		}
	}

	animateBump(target, origin) {
		var direction = this.square.direction(target);
		var dx = this.square.screenX + Square.screenX(...direction, 0) / 2;
		var dy = this.square.screenY + Square.screenY(...direction, 0) / 2;
		var dz = this.square.screenZ + Square.screenZ(...direction, 0) / 2;
		var time = 200;

		var keyframes = [
			{ },
			{
				transform: `translate(${dx}px, ${dy}px)`,
				zIndex: dz
			},
			{ }
		];
		if (origin) {
			keyframes[0] = { 
				transform: origin.screenPosition,
				zIndex: origin.screenZ
			};
		}
		this.el.animate(keyframes, {duration: time, easing: "ease-out"});
		return time;
	}

	_showDeathAnimation() {
		if (!this.square) return;
		var vfx = new SpriteEffect(this.square, 1000, "unit", this.style, "dead");
		if (this._facing < 0) vfx.el.classList.add("left");
		this.square.parent.el.appendChild(vfx.el);
	}
	//#endregion animate

	//#region input events
	select() {
		this.el.classList.add('selected');
		return true;
	}
	deselect() {
		this.el.classList.remove('selected');
	}
	//#endregion input events

	//#region ai
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
	aiCalculate() {
		// assumes the unit has been selected, and move range is visible
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

	_maxDistance() {
		var board = this.parent;
		return board.h + board.w;
	}
	_nearestPieceDistance(origin, targetFunction) {
		var nearestDistance = origin.parent.pieces.reduce((nearest, piece) => {
			if (targetFunction.call(this, piece)) {
				var distance = origin.distance(piece.square);
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
				var distance = origin.distance(piece.square);
				targetCount += 1;
				return sum + distance;
			}
			return sum;
		}, 0);
		return targetCount > 0 ? (totalDistance / targetCount) : 0;
	}
	//#endregion ai
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

	get elClass() {
		return 'skill';
	}

	get type() {
		return Piece.Skill;
	}

	//#region text
	get name() {
		return "[Skill name]";
	}
	get _description() {
		return "[Skill description]";
	}
	get fullDescription() {
		var description = `<strong>${this.name}</strong><br>${this._description}`;
		if (this.hasLimitedUses) {
			description += `<br><em><strong>${this.usesLeft}</strong> use${this.usesLeft == 1 ? "" : "s"}</em>`;
		}
		if (this.hasCooldown) {
			if (this.cooldown > 0) {
				description += `<br><em>Ready in ${this.cooldown} turn${this.cooldown == 1 ? "" : "s"}</em>`;
			} else {
				description += `<br><em>${this.cooldownCost} turn cooldown</em>`;
			}
		}
		return description;
	}
	//#endregion text

	//#region attributes
	get range() {
		return this._range;
	}
	get minRange() {
		return this._minRange;
	}

	get area() {
		return this._area;
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

	_setStats() {
		this._range = 1;
		this._minRange = 1;
		this._area = 0;
		this._baseCooldown = 0;
		this._maxUses = 0;
		this._basePower = 2;
	}
	//#endregion attributes

	//#region selection
	canUse() {
		return this.user.myTurn && this.user.canAct
		&& this.cooldown <= 0 && (!this.hasLimitedUses || this.usesLeft);
	}
	inRange(origin, target) {
		var distance = origin.distance(target);
		return distance <= this.range && distance >= this.minRange;
	}
	validTarget(target) {
		return !!target;
	}
	inArea(origin, target) {
		return origin.distance(target) <= this.area;
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
	_targetOrder(squareA, squareB) {
		return this._target.distance(squareA) - this._target.distance(squareB);
	}

	endTurn() {
		this.cooldown--;
		if (this.cooldown < 0) {
			this.cooldown = 0;
		}
	}
	//#endregion selection

	//#region use skill
	async use(target) {
		if (!target || !this.canUse() || !this.validTarget(target)) return false;
		this.user.face(target);

		this._target = target;
		this._squares = this._affectedSquares(this._target);
		this._squares.sort((squareA, squareB) => this._targetOrder(squareA, squareB));
		this._units = this._affectedUnits(this._squares);
		
		var waitTime = this._startEffects(this._target, this._squares, this._units);
		await Game.asyncPause(waitTime);
		
		for (var i = 0; i < this._squares.length; i++) {
			waitTime = this._squareEffects(this._squares[i], this._target);
			await Game.asyncPause(waitTime);
		}

		for (var i = 0; i < this._units.length; i++) {
			waitTime = this._unitEffects(this._units[i], this._target);
			await Game.asyncPause(waitTime);
		}
		
		waitTime = this._endEffects(this._target, this._squares, this._units);
		await Game.asyncPause(waitTime);

		this._payCost();
		this._units.forEach(piece => piece.dieIfDead());
		this.user.refresh();
		
		this._target = null;
		this._units = null;
		this._squares = null;

		return true;
	}

	_startEffects(target, _squares, _units) {
		this.user.animateBump(target);
		this.user.addTimedClass(200, 'attack');

		this._showEffect(target, this.user.square, "test-attack-effect");
		
		return 100;
	}
	_squareEffects(_square, _target) { return 0; }
	_unitEffects(_unit, _target) { return 0; }
	_endEffects(_target, _squares, _units) { return 0; }

	_payCost() {
		this.user.actionUsed = true;
		if (this.hasCooldown) this.cooldown = this.cooldownCost;
		if (this.hasLimitedUses) this.usesLeft--;
	}
	//#endregion use skill

	//#region animate
	_showEffect(target, origin, ...styles) {
		if (!target) return;
		var vfx = new SpriteEffect(target, 1000, 'sprite-effect', ...styles);
		if (origin && target.screenX < origin.screenX) vfx.el.classList.toggle('left');
		target.parent.el.appendChild(vfx.el);
		return vfx;
	}
	//#endregion animate

	//#region refresh
	refresh() {
		var usable = this.canUse();
		this._setSelectable(usable);
		this._setUnselectable(!usable);
		this._refreshLabels();
	}
	_refreshLabels() {
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
	//#endregion refresh

	//#region input events
	select() {
		if (!this.canUse()) return false;
		this.el.classList.add('selected');
		return true;
	}
	deselect() {
		this.el.classList.remove('selected');
	}
	//#endregion input events

	//#region ai
	_aiBaseTargetScore(target) {
		return 0;
	}
	_aiAreaTargetScore(square) {
		if (this.user.isEnemy(square.piece)) return this.power;
		else if (this.user.isAlly(square.piece)) return -this.power*0.9;
		else if (square.piece) return this.power*0.1;
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
	//#endregion ai

	//#region range / area shapes

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
	//#endregion range / area shapes

	//#region directional areas
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
	//#endregion directional areas
};

/***************************************************
 Map Piece
***************************************************/
class MapPiece extends Piece {

	constructor() {
		super();
		this.node = null;

		this.el.draggable = true;
		this.el.classList.add('selectable');

		this.refresh();
	}

	get type() { return Piece.Map; }

	get elClass() {
		return 'map-piece';
	}

	//#region movement
	async move(node) {
		if (!node || this.node == node) return false;
		
		this.setParent(node.parent);
		if (!this.parent.el.contains(this.el)) this.parent.el.appendChild(this.el);

		this.node = node;
		this.el.style.transform = this.node.screenPosition;
		this.el.style.zIndex = this.node.screenZ;

		if (node.path) {
			var time = this.animateMovement(node.path);
			await Game.asyncPause(time);
		}

		return true;
	}
	//#endregion movement

	//#region animate
	animateMovement(path) {
		var keyframes = [{}];
		path.forEach(square => {
			keyframes.unshift({
				transform: square.screenPosition,
				zIndex: square.screenZ
			});
		});
		var time = 500*(keyframes.length-1);
		this.el.animate(keyframes, {duration: time, easing: "linear"});
		return time;
	}
	//#endregion movement

	//#region refresh
	refresh() {
		if (this.node) {
			this.el.style.transform = this.node.screenPosition;
			this.el.style.zIndex = this.node.screenZ;
		}
	}
	//#endregion refresh
}