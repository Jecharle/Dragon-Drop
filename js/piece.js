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
		this.el.ondblclick = this._click;
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

	//#region piece type
	static get None() { return 0; }
	static get Unit() { return 1; }
	static get Skill() { return 2; }
	static get Map() { return 3; }

	get type() { return Piece.None; }
	//#endregion piece type

	//#region parent
	setParent(container) {
		if (this._parent && this._parent != container) {
			this._parent.removePiece(this);
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
		if (Game.scene) Game.scene.pieceEvent(piece, null, ev.type == 'dblclick');
	}
	_drag(ev) {
		ev.dataTransfer.setData("piece", ev.currentTarget.id);
		var piece = ev.currentTarget.obj;
		ev.dataTransfer.setDragImage(piece.spriteEl, 40, 56); // TEMP until I make it detect the size
		if (Game.scene) Game.scene.pieceEvent(piece, true);
		piece.el.classList.add('dragging');
	}
	_drop(ev) {
		ev.dataTransfer.clearData("piece");
		ev.currentTarget.classList.remove('dragging');
		// the drop target handles the rest
	}
	//#endregion input events
};

/***************************************************
 Unit piece
***************************************************/
class UnitPiece extends Piece {
	constructor(equipment, partyMember) {
		super();
		this._team = null;
		this._guest = false;
		this._partyMember = partyMember;
		this.square = null;

		this._equipment = equipment || [];
		this.equipment.forEach(equip => equip.setUser(this));

		this._defaultStats();
		this._stats();
		this._setSkills();
		this._setReactions();

		this.hp = this.maxHp;
		this._lifebar = new Lifebar(this.hp, this.maxHp);
		this.el.appendChild(this._lifebar.el);
		
		this._status = {};
		this._statusList = new StatusList(this._status);
		this.el.appendChild(this._statusList.el);

		this._results = [];

		this._shadowEl = document.createElement('div');
		this._shadowEl.classList.add('shadow');
		this.el.appendChild(this._shadowEl);

		this._facingEl = document.createElement('div');
		this._facingEl.classList.add('facing-arrow');
		this.el.appendChild(this._facingEl);

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
	icon(style, content) {
		return `<div class="icon ${style}">${content || ""}</div>`;
	}

	get name() {
		return "[Unit name]";
	}
	get characterName() {
		return this._partyMember?.name || this.name;
	}
	get _description() {
		return "[Unit description]";
	}
	get _values() {
		var list = [ this._moveText, this._hpText ];
		if (this.defense) list.push(this._defenseText);
		return list.join(" | ");
	}

	get _hpText() {
		return `${this.icon('life')} ${this.hp}/${this.maxHp}`;
	}
	get _moveText() {
		return `${this.icon('speed')} ${this.moveRange}`;
	}
	get _defenseText() {
		return `${this.icon('defense')} ${this.defense}`;
	}

	get fullDescription() {
		return `<strong>${this.name}</strong><p>${this._description}</p><strong>${this._values}</strong>`;
	}
	//#endregion text

	//#region setup
	_defaultStats() {
		this.size = 1;
		this._moveStyle = "path";
		this._maxHp = 2;
		this._moveRange = 0;
	}
	_stats() {
		this._moveRange = 2;
	}
	_setSkills() {
		this._skills = [];
	}
	_setReactions() {
		this._reactions = [];
	}
	_initialize() {
		this.myTurn = false;
		this.actionUsed = false;
		this.homeSquare = null;
		this._xFacing = 1;
		this._yFacing = 0;
		
		this._status = {};
		this._results = [];

		this.refresh();
	}
	//#endregion setup

	get equipment() {
		return this._equipment;
	}

	//#region attributes
	get direction() {
		return [this._xFacing, this._yFacing];
	}

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

	allowsMove(piece) {
		// whether you allow another piece to pass you
		return this.isAlly(piece);
	}

	get guest() {
		return this._guest;
	}
	setAsGuest() {
		this._guest = true;
	}

	get extra() {
		// extras are units that don't count toward victory or loss
		return false;
	}

	get aiImportance() {
		return 1.0;
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
		var equipBonus = this.equipment.reduce((bonus, equip) => {
			if (equip.maxHpBonus) bonus += equip.maxHpBonus;
			return bonus;
		}, 0);
		return Math.max(this._maxHp+equipBonus, 0);
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
		var equipBonus = this.equipment.reduce((bonus, equip) => {
			if (equip?.speedBonus) bonus += equip.speedBonus;
			return bonus;
		}, 0);
		return Math.max(this._moveRange + equipBonus + this.getStatus(UnitPiece.Speed), 0);
	}

	get powerBonus() {
		var equipBonus = this.equipment.reduce((bonus, equip) => {
			if (equip?.powerBonus) bonus += equip.powerBonus;
			return bonus;
		}, 0);
		return this.getStatus(UnitPiece.Power) + equipBonus;
	}

	get defense() {
		var equipBonus = this.equipment.reduce((bonus, equip) => {
			if (equip?.defenseBonus) bonus += equip.defenseBonus;
			return bonus;
		}, 0);
		return this.getStatus(UnitPiece.Defense) + equipBonus;
	}

	get criticalImmune () {
		return false;
	}

	get shiftable() {
		var equipUnshiftable = this.equipment.some(equip => equip.unshiftable);
		return !this.getStatus(UnitPiece.Anchor) && !equipUnshiftable;
	}

	get skills() {
		var equipSkills = this.equipment.reduce((skills, equip) => {
			if (equip?.skills) skills = skills.concat(equip.skills);
			return skills;
		}, []);
		return this._skills.concat(equipSkills);
	}
	get reactions() {
		var equipReactions = this.equipment.reduce((reactions, equip) => {
			if (equip?.reactions) reactions = reactions.concat(equip.reactions);
			return reactions;
		}, []);
		return this._reactions.concat(equipReactions);
	}

	_baseStatusResist(effect, value) {
		return false;
	}

	resistsStatus(effect, value) {
		var equipResist = this.equipment.some(equip => {
			return equip?.resistsStatus(effect, value);
		});
		return equipResist || this._baseStatusResist(effect, value);
	}
	//#endregion attributes

	//#region status effects
	static get Power() { return 'power'; }
	static get Defense() { return 'defense'; }
	static get Speed() { return 'speed'; }
	static get Regenerate() { return 'regenerate'; }
	static get Burn() { return 'burn'; }
	static get Evade() { return 'evade'; }
	static get Anchor() { return 'anchor'; }
	static get Charge() { return 'charge'; }
	static get Accelerate() { return 'accelerate'; }

	getStatus(effect) {
		if (!this._status) return 0;
		else return this._status[effect] || 0;
	}

	_applyBurn() {
		if (this.getStatus(UnitPiece.Burn) > 0) {
			var vfx = new SpriteEffect(this.square, 500, 'sprite-effect', 'test-burn-effect');
			this.parent.el.appendChild(vfx.el);
			this.takeDamage(this.getStatus(UnitPiece.Burn), null, { ignoreDefense: true });
		}
	}
	_applyRegenerate() {
		if (this.getStatus(UnitPiece.Regenerate) > 0) {
			var vfx = new SpriteEffect(this.square, 500, 'sprite-effect', 'test-heal-effect');
			this.parent.el.appendChild(vfx.el);
			this.heal(this.getStatus(UnitPiece.Regenerate), { noCure: true });
		}
	}
	_applyDelayedBuff() {
		if (this.getStatus(UnitPiece.Charge) || this.getStatus(UnitPiece.Accelerate)) {
			var vfx = new SpriteEffect(this.square, 500, 'sprite-effect', 'test-buff-effect');
			this.parent.el.appendChild(vfx.el);
			this.addStatus(UnitPiece.Power, this.getStatus(UnitPiece.Charge));
			this.addStatus(UnitPiece.Speed, this.getStatus(UnitPiece.Accelerate));
		}
	}
	//#endregion status effects

	//#region refresh
	refresh() {
		this._lifebar.maxValue = this.maxHp;
		this._lifebar.value = this.hp;
		this._lifebar.defenseValue = this.defense;
		this._statusList.value = this._status;

		this._refreshSkills();
		this._setUnselectable(!this.canMove && !this.canAct && this.myTurn);
		this._setSelectable(this.myTurn && (this.canMove || this.canAct));
	}
	_refreshSkills() {
		this.skills.forEach(skill => skill.refresh());
		this.reactions.forEach(reactSkill => reactSkill.refresh());
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
	takeDamage(power, sourceSquare, props) {

		// check for critical
		if (!this.criticalImmune && !props?.noCritical
			&& (props?.autoCritical || this.isBehind(sourceSquare))) {
			var criticalBonus = props?.criticalBonus ?? 1;
			power = Math.max(power + criticalBonus, 0);
			// TODO: critical visual effect?
			if (this.results) {
				this.results.critical = true;
			}
		}

		// apply defense
		if (!props?.ignoreDefense) {
			power -= this.defense;
		}

		// deal damage
		if (power > 0) {
			this.hp -= power;
			this.addTimedClass(500, 'damaged');
			this.addTimedClass(1200, 'hp-change');
			if (this.results) {
				this.results.damage += power;
			}
		} else {
			// TODO: 0 damage effect?
		}

		this.refresh();
		return power;
	}
	heal(power, props) {
		if (power > 0) {
			this.hp += power;
			this.addTimedClass(1200, 'hp-change');
			if (this.results) {
				this.results.heal += power;
			}
			if (!props?.noCure) {
				this._status[UnitPiece.Burn] = 0;
			}
		}

		this.refresh();
		return power;
	}
	evade(testOnly) {
		if (!this.getStatus(UnitPiece.Evade)) return false;
		
		if (!testOnly) {
			this.removeStatus(UnitPiece.Evade);
			if (this.results) {
				this.results.evade = true;
			}
			this.addTimedClass(350, 'evade'); 
		}
		return true;
	}

	push(origin, distance, props) {
		if (!this.parent) return 0;
		
		if (!this.shiftable) return 0;

		var previousSquare = this.square;
		var distanceMoved = this.parent.shiftPiece(this, origin, distance, props);
		if (props?.animation) {
			this.animateMove([previousSquare], props.animation);
		}
		if (this.results) {
			this.results.shift += distanceMoved;
		}
		return distanceMoved;
	}
	pull(origin, distance, props) {
		return this.push(origin, -distance, props);
	}
	swap(piece, props) {
		if (!this.parent) return false;
		
		if (!this.shiftable || !piece.shiftable) return false;

		if (this.parent.swapPieces(this, piece)) {
			if (props?.animation) {
				this.animateMove([piece.square], props.animation);
			}
			if (props?.animation2) {
				piece.animateMove([this.square], props.animation2);
			}
			if (this.results) {
				this.results.swap = true;
			}
			return true;
		}
		return false;
	}

	addStatus(effect, value) {
		if (this.resistsStatus(effect, value)) return;

		switch(effect) {
			case UnitPiece.Regenerate: case UnitPiece.Burn: // regenerate cancels out burn
				if (effect == UnitPiece.Regenerate && this.getStatus(UnitPiece.Burn)) {
					this._status[UnitPiece.Burn] = 0;
					break;
				} if (effect == UnitPiece.Burn && this.getStatus(UnitPiece.Regenerate)) {
					this._status[UnitPiece.Regenerate] = 0;
					break;
				}
			case UnitPiece.Charge: case UnitPiece.Accelerate: // positive-only statuses (includes regenerate)
				if (value > this.getStatus(effect)) {
					this._status[effect] = value;
				}
				break;
			
			case UnitPiece.Evade: case UnitPiece.Anchor: // non-scaling effects
				this._status[effect] = 1;
				break;

			default: // standard buffs and debuffs
				if (value > 0) {
					if (this.getStatus(effect) < 0) this._status[effect] = 0;
					else if (value > this.getStatus(effect)) this._status[effect] = value;
				} else if (value < 0) {
					if (this.getStatus(effect) > 0) this._status[effect] = 0;
					else if (value < this.getStatus(effect)) this._status[effect] = value;
				}
				break;
		}
	}
	removeStatus(effect) {
		this._status[effect] = 0;
	}
	removeAllStatus() {
		this._status = {};
	}
	
	//#endregion effects

	//#region effect tracking
	get results() {
		if (this._results.length < 1) return null;
		else return this._results[this._results.length-1];
	}
	openResult() {
		this._results.push(new SkillResult());
	}
	closeResult() {
		return this._results.pop();
	}
	//#endregion effect tracking

	//#region use reactions
	async reactTurnStart() {
		for (var i = 0; i < this._reactions.length; i++) {
			await this._reactions[i].turnStartTrigger();
		}
	}
	async reactTurnEnd() {
		for (var i = 0; i < this._reactions.length; i++) {
			await this._reactions[i].turnEndTrigger();
		}
	}

	async reactOnHit(sourceSkill, sourceUnit, result) {
		for (var i = 0; i < this._reactions.length; i++) {
			await this._reactions[i].onHitTrigger(sourceSkill, sourceUnit, result);
		}
	}
	//#endregion use reactions

	//#region turn state
	get canMove() {
		return this.alive && !this.homeSquare && !this.actionUsed;
	}
	get canAct() {
		return this.alive && !this.actionUsed;
	}

	async updateStatusTurnStart() {
		if (this.getStatus(UnitPiece.Regenerate)) {
			this._applyRegenerate();
			this.refresh();
			await Game.asyncPause(500);
		}
		if (this.getStatus(UnitPiece.Charge) || this.getStatus(UnitPiece.Accelerate)) {
			this._applyDelayedBuff();
			await Game.asyncPause(500);
		}
		this.removeStatus(UnitPiece.Regenerate);
		this.removeStatus(UnitPiece.Defense);
		this.removeStatus(UnitPiece.Evade);
		this.removeStatus(UnitPiece.Anchor);
		this.removeStatus(UnitPiece.Charge);
		this.refresh();
	}
	async updateStatusTurnEnd() {
		if (this.getStatus(UnitPiece.Burn)) {
			this._applyBurn();
			this.refresh();
			await Game.asyncPause(500);
		}
		this.removeStatus(UnitPiece.Burn);
		this.removeStatus(UnitPiece.Power);
		this.removeStatus(UnitPiece.Speed);
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
		this._reactions.forEach(skill => skill.endTurn());
		this.refresh();
	}
	//#endregion turn state

	//#region move
	async move(target) {
		if (this.square == target) return false;

		var oldSquare = this.square;
		if (target.parent.movePiece(this, target)) {
			this.face(target, target.path[0]);
			var moveTime = this.animateMove(target.path, this._moveStyle);
			this.addTimedClass(moveTime, 'moving');
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
		else return (square.piece == null || square.piece.allowsMove(this));
	}
	//#endregion move

	//#region facing
	static getDirection(target, from) {
		var dx = target.x - from.x;
		var dy = target.y - from.y;

		var ydir = dx + dy < 0 ? -1 : 0;
		var xdir = dx - dy < 0 ? -1 : 1;
		return [xdir, ydir];
	}
	static reverseDirection(direction) {
		return [direction[0] == 1 ? -1 : 1, direction[1] == 0 ? -1 : 0];
	}
	getDirectionTo(target) {
		return UnitPiece.getDirection(target, this.square);
	}
	getDirectionFrom(from) {
		return UnitPiece.getDirection(this.square, from);
	}
	faceDirection(direction) {
		if (!direction) return;
		var [xFace, yFace] = direction;
		this._xFacing = xFace;
		this._yFacing = yFace;
		this.el.style.setProperty('--x-scale', xFace);
		this.el.style.setProperty('--y-frame', yFace);
	}
	face(target, from) {
		if (!from) from = this.square;
		if (!from || !target || from.parent != target.parent) return;

		this.faceDirection(UnitPiece.getDirection(target, from));
	}
	isBehind(square) {
		if (!square || this.square == square) return false;
		var [xFace, yFace] = this.getDirectionFrom(square);
		return (xFace == this._xFacing && yFace == this._yFacing);
	}
	//#endregion facing

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
		var lastSquare = this.square;
		path.forEach(square => {
			keyframes.unshift({ transform: square.screenPosition });

			var [xFace, yFace] = UnitPiece.getDirection(lastSquare, square);
			turnframes.unshift({ '--x-scale': xFace, '--y-frame': yFace });

			lastSquare = square;
		});
		turnframes.unshift(turnframes[0]);
		var time = 200*(keyframes.length-1);
		this.el.animate(keyframes, {duration: time, easing: "linear"});	
		this.el.animate(turnframes, {duration: time, easing: "linear"});
		return time;
	}
	_animateJump(path) {
		var origin = path[path.length-1];
		var keyframes = [
			{ transform: origin.screenPosition },
			{ }
		];
		var time = 400;
		this.el.animate(keyframes, {duration: time, easing: "linear"});

		var jumpframes = [
			{ },
			{ bottom: "64px" }
		];
		this.spriteEl.animate(jumpframes, {duration: time/2, iterations: 2, direction: "alternate", easing: "ease-out"});
		return time;
	}
	_animateTeleport(path) {
		var origin = path[path.length-1];

		var time = 400;
		var keyframes = [
			{ transform: origin.screenPosition },
			{ transform: origin.screenPosition }
		];
		this.el.animate(keyframes, time/2);

		var twistframes = [
			{ transform: `scaleX(${this._xFacing})`},
			{ transform: `scaleX(0) scaleY(1.5)` },
			{ }
		];
		this.spriteEl.animate(twistframes, {duration: time, easing: "ease-in-out"});
		return time;
	}

	animateBump(target, origin) {
		var direction = this.square.direction(target);
		var dx = this.square.screenX + Square.screenX(...direction, 0) / 2;
		var dy = this.square.screenY + Square.screenY(...direction, 0) / 2;
		var dz = this.square.screenZ + Square.screenZ(...direction, 0) / 2;
		var time = 200;

		var keyframes = [
			{ },
			{ transform: `translate3d(${dx}px, ${dy}px, ${dz}px)` },
			{ }
		];
		if (origin) {
			keyframes[0] = { 
				transform: origin.screenPosition
			};
		}
		this.el.animate(keyframes, {duration: time, easing: "ease-out"});
		return time;
	}

	_showDeathAnimation() {
		if (!this.square) return;
		var vfx = new SpriteEffect(this.square, 1000, "unit", this.style, "dead");
		vfx.el.style.setProperty('--x-scale', this._xFacing);
		vfx.el.style.setProperty('--y-frame', this._yFacing);
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
			if (!newSkill.target) return best;
			
			if (newSkill.score > best.score) return newSkill;
			if (newSkill.score < best.score) return best;

			if( Math.random() > 0.5) return newSkill;
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

			// in range trumps out of range (not yet in range)
			if (newPlan.move.inRange && !best.move?.inRange) return newPlan;
			// better score wins
			if (newPlan.score > best.score) return newPlan;
			if (newPlan.score < best.score) return best;
			// equal score, fewer moves wins
			if (newPlan.move.movesLeft > best.move.movesLeft) return newPlan;
			if (newPlan.move.movesLeft < best.move.movesLeft) return best;
			// equal moves, toss a coin
			if (Math.random() > 0.5) return newPlan;
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
 Results of a skill or reaction used on a unit
***************************************************/
class SkillResult {
	constructor() {
		this.damage = 0;
		this.healing = 0;
		this.shift = 0;
		this.evade = false;
		this.swap = false;
		this.critical = false;
	}
}

/***************************************************
 Equipment that modifies a unit's traits
***************************************************/
class Equipment extends Piece {
	constructor() {
		super();
		this.user = null;
	}

	setUser(user) {
		this.user = user;
		if (this.user) {
			this._setSkills(this.user);
			this._setReactions(this.user);
		} else {
			this._clearSkills();
			this._clearReactions();
		}
	}

	//#region text
	icon(style, content) {
		return `<div class="icon ${style}">${content || ""}</div>`;
	}

	get name() {
		return "[Equip name]";
	}
	get characterName() {
		return this._partyMember?.name || this.name;
	}
	get _description() {
		return "[Equip description]";
	}
	get _values() {
		var list = [ /* TODO: text for the various bonuses */];
		return list.join(" | ");
	}

	get fullDescription() {
		return `<strong>${this.name}</strong><p>${this._description}</p><strong>${this._values}</strong>`;
	}
	//#endregion text

	//#region skills and reactions
	_setSkills(user) {
		this._skills = [];
	}
	_setReactions(user) {
		this._reactions = [];
	}

	_clearSkills() {
		this._skills = [];
	}
	_clearReactions() {
		this._skills = [];
	}

	get skills() {
		return this._skills;
	}
	get reactions() {
		return this._reactions;
	}
	//#endregion skills

	//#region status resists
	resistsStatus(effect, value) {
		return false;
	}

	get unshiftable() {
		return false;
	}
	//#endregion status resists

	//#region stat bonuses
	get maxHpBonus() {
		return 0;
	}
	get powerBonus() {
		return 0;
	}
	get defenseBonus() {
		return 0;
	}
	get speedBonus() {
		return 0;
	}
	//#endregion stat bonuses
}

/***************************************************
 Skill piece
***************************************************/
class SkillCard extends Piece {
	constructor(user) {
		super();
		this.user = user;

		this._defaultStats();
		this._stats();

		this._cooldownLabel = new CooldownLabel("");
		this.el.appendChild(this._cooldownLabel.el);

		this._quantityLabel = new QuantityLabel("");
		this.el.appendChild(this._quantityLabel.el);

		this._tooltip = new HoverDescription(this.fullDescription);
		this.el.appendChild(this._tooltip.el);

		this._initialize();
	}

	get elClass() {
		return 'skill';
	}

	get type() {
		return Piece.Skill;
	}

	//#region text
	icon(style, content) {
		return `<div class="icon ${style}">${content || ""}</div>`;
	}

	get name() {
		return "[Skill name]";
	}
	get _description() {
		return "[Skill description]";
	}
	get _values() {
		var list = [this._rangeText, ...this._effectText];
		if (this.hasCooldown) list.push(this._cooldownText);
		if (this.hasLimitedUses) list.push(this._limitedUseText);
		return list.join(" | ");
	}

	get _rangeText() {
		var icon = this.icon(this.los ? 'range' : 'non-los');
		if (this.minRange == 1 || this.range == 0) return `${icon} ${this.range}`;
		else return `${icon} ${this.minRange}-${this.range}`;
	}
	get _effectText() {
		return [
			`${this.icon('power')} ${this.power}`
		];
	}
	get _cooldownText() {
		return `${this.icon('cooldown')} ${this.cooldown || this.cooldownCost}`;
	}
	get _limitedUseText() {
		return `${this.usesLeft} use${this.usesLeft != 1 ? "s" : ""}`;
	}

	get fullDescription() {
		return `<strong>${this.name}</strong><p>${this._description}</p><strong>${this._values}</strong>`;
	}

	get _showBanner() {
		return true;
	}
	//#endregion text

	//#region setup
	_defaultStats() {
		this._range = 1;
		this._minRange = 1;
		this._los = true;
		this._area = 0;
		this._baseCooldown = 0;
		this._maxUses = 0;
		this._basePower = 0;
		this._criticalBonus = 1;
	}
	_stats() {
		this._basePower = 2;
	}
	_initialize() {
		this.cooldown = 0;
		this.usesLeft = this.maxUses;
		this.refresh();
	}
	//#endregion setup

	//#region attributes
	get range() {
		return this._range;
	}
	get minRange() {
		return this._minRange;
	}
	get los() {
		return this._los;
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
		return Math.max(this._basePower + this.user.powerBonus, 1);
	}
	get criticalBonus() {
		return this._criticalBonus;
	}
	//#endregion attributes

	//#region selection
	canUse() {
		return this.user.myTurn && this.user.canAct
		&& this.cooldown <= 0 && (!this.hasLimitedUses || this.usesLeft);
	}
	inRange(origin, target) {
		var distance = origin.distance(target);
		return distance <= this.range && distance >= this.minRange
			&& (!this.los || Math.abs(target.z - origin.z) <= this.range)
			&& this._inLine(origin, target)
			&& (!this.los || this._canSee(origin, target));
	}
	validTarget(target) {
		return !!target;
	}
	inArea(origin, target) {
		return origin.distance(target) <= this.area
			&& Math.abs(target.z - origin.z) <= 1;
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
		
		if (this._showBanner) {
			var banner = new SkillBanner(this.name);
			this.user.el.appendChild(banner.el);
			await Game.asyncPause(500);
		}

		this.user.openResult();
		this._units.forEach(unit => unit.openResult());
		
		await this._startEffects(this._target, this._squares, this._units);
		for (var i = 0; i < this._squares.length; i++) {
			await this._squareEffects(this._squares[i], this._target);
		}
		for (var i = 0; i < this._units.length; i++) {
			await this._unitEffects(this._units[i], this._target);
			this._units[i].refresh();
		}
		await this._endEffects(this._target, this._squares, this._units);

		this.user.openResult();
		this._payCost();
		this.user.closeResult();
		
		for (var i = 0; i < this._units.length; i++) {
			var result = this._units[i].closeResult();
			await this._units[i].reactOnHit(this, this.user, result);
		}

		this._units.forEach(piece => piece.dieIfDead());
		this.user.closeResult();
		this.user.refresh();
		
		this._target = null;
		this._units = null;
		this._squares = null;

		return true;
	}

	async _startEffects(target, _squares, _units) {
		this.user.animateBump(target);
		this.user.addTimedClass(200, 'attack');

		this._showEffect(target, this.user.square, "test-attack-effect");
		
		await Game.asyncPause(100);
	}
	async _squareEffects(_square, _target) { return; }
	async _unitEffects(_unit, _target) { return; }
	async _endEffects(_target, _squares, _units) { return; }

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
		this._cooldownLabel.value = this.cooldown > 0 ? this.cooldown : "";
		this._quantityLabel.value = this.hasLimitedUses ? this.usesLeft : "";
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
	_aiBaseTargetScore(target, origin) {
		return 0;
	}
	_aiSelfTargetScore(square, origin) {
		return this._aiAllyTargetScore(this.user, square, origin);
	}
	_aiEnemyTargetScore(unit, square, origin) {
		var critical = !unit.criticalImmune && unit.isBehind(origin) ? this.criticalBonus : 0;
		return this.power + critical;
	}
	_aiAllyTargetScore(unit, square, origin) {
		return -this._aiEnemyTargetScore(unit, square, origin)*0.9;
	}
	_aiUnitTargetScore(square, origin) {
		if (square == origin) { // new square will include yourself
			return this._aiSelfTargetScore(square, origin);
		} else if (!square.piece || square.piece == this.user) { // starting square will be empty
			return 0;
		} else if (this.user.isEnemy(square.piece)) {
			return this._aiEnemyTargetScore(square.piece, square, origin) * square.piece.aiImportance;
		} else if (this.user.isAlly(square.piece)) {
			return this._aiAllyTargetScore(square.piece, square, origin) * square.piece.aiImportance;
		} else {
			return 0;
		}
	}
	_aiSquareTargetScore(square, origin) {
		return 0;
	}

	_aiTargetScore(target, origin) {
		var area = this._affectedSquares(target);
		return area.reduce((totalScore, square) => {
			return totalScore + this._aiSquareTargetScore(square, origin) + this._aiUnitTargetScore(square, origin);
		}, this._aiBaseTargetScore(target, origin));
	}

	aiGetBestTarget(origin) {
		var best = origin.parent.squares.reduce((best, target) => {
			if (!this.validTarget(target) || !this.inRange(origin, target)) return best;

			var newTarget = {
				score: this._aiTargetScore(target, origin),
				target: target
			}
			if (newTarget.score > best.score) return newTarget;
			if (newTarget.score < best.score) return best;

			if (Math.random() > 0.5) return newTarget;
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
 Reaction Skill Piece
***************************************************/

class ReactionCard extends SkillCard {

	get isReaction() {
		return true;
	}

	//#region overrides
	_defaultStats() {
		super._defaultStats();
		this._range = 0;
		this._minRange = 0;
		this._los = false;
		this._baseCooldown = 1;
	}

	_payCost() {
		if (this.hasCooldown) this.cooldown = this.cooldownCost;
		if (this.hasLimitedUses) this.usesLeft--;
	}
	canUse() {
		return this.cooldown <= 0 && (!this.hasLimitedUses || this.usesLeft);
	}

	async _startEffects(target, _squares, _units) { return; }
	//#endregion overrides

	canReact(target, skill, result) {
		return false;
	}

	validResult(_result) {
		return true;
	}

	//#region triggers
	async turnEndTrigger() {
		return false;
	}
	async turnStartTrigger() {
		return false;
	}

	async onHitTrigger(sourceSkill, sourceUnit, result) {
		return false;
	}
	//#endregion triggers
}

class OnHitReaction extends ReactionCard {
	canReact(target, _skill, result) {
		return this.user.alive
			&& this.validTarget(target.square)
			&& this.inRange(this.user.square, target.square)
			&& this.validResult(result);
	}

	async onHitTrigger(sourceSkill, sourceUnit, skillResult) {
		if (!sourceSkill || !sourceUnit || sourceSkill.isReaction || !sourceUnit.square) return false;
		if (!this.canUse() || !this.canReact(sourceUnit, sourceSkill, skillResult)) return false;
		if (!this.inRange(this.user.square, sourceUnit.square)) return false;
		return await this.use(sourceUnit.square);
	}
}
class OnHitSelfReaction extends ReactionCard {
	canReact(_target, _skill, result) {
		return this.user.alive
			&& this.validResult(result);
	}

	async onHitTrigger(sourceSkill, sourceUnit, skillResult) {
		if (sourceSkill && sourceSkill.isReaction) return false;
		if (!this.canUse() || !this.canReact(sourceUnit, sourceSkill, skillResult)) return false;
		return await this.use(this.user.square);
	}
}
class OnDeathReaction extends ReactionCard {
	_defaultStats() {
		super._defaultStats();
		this._maxUses = 1;
	}

	canReact(_target, _skill) {
		return this.user.dead;
	}

	async turnEndTrigger() {
		if (!this.canUse() || !this.canReact()) return false;
		return await this.use(this.user.square);
	}
	async turnStartTrigger() {
		if (!this.canUse() || !this.canReact()) return false;
		return await this.use(this.user.square);
	}
	async onHitTrigger(sourceSkill, sourceUnit) {
		if (!this.canUse() || !this.canReact(sourceUnit, sourceSkill)) return false;
		return await this.use(this.user.square);
	}
}
class OnTurnStartReaction extends ReactionCard {
	canReact(_target, _skill) {
		return true;
	}

	async turnStartTrigger() {
		if (!this.canUse() || !this.canReact()) return false;
		return await this.use(this.user.square);
	}
}
class OnTurnEndReaction extends ReactionCard {
	canReact(_target, _skill) {
		return true;
	}

	async turnEndTrigger() {
		if (!this.canUse() || !this.canReact()) return false;
		return await this.use(this.user.square);
	}
}

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

		var startNode = this.node;
		this.node = node;
		this.el.style.transform = this.node.screenPosition;

		var time = 0;
		if (node.path) {
			time = this.animateMovement(node.path);
		} else if (startNode) {
			time = this.animateMovement([startNode]);
		}
		await Game.asyncPause(time);

		return true;
	}
	//#endregion movement

	//#region animate
	animateMovement(path) {
		var keyframes = [{}];
		path.forEach(node => {
			keyframes.unshift({ transform: node.screenPosition });
		});
		var time = 750*(keyframes.length-1);
		this.el.animate(keyframes, {duration: time, easing: "linear"});
		return time;
	}
	//#endregion movement

	//#region refresh
	refresh() {
		if (this.node) {
			this.el.style.transform = this.node.screenPosition;
		}
	}
	//#endregion refresh
}