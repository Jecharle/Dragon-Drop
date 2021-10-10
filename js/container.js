/***************************************************
 Container
The root class for boards, lists, maps, and such
that contain pieces and track their positions
***************************************************/
class Container extends ElObj {
	constructor() {
		super();
		this.pieces = [];

		this.el.onclick = this._click;
		this.el.ondblclick = this._click;
		this.el.ondrop = this._drop;
		this.el.onmousemove = this._mouseOver;
		this.el.ondragenter = this._mouseOver;
	}

	//#region piece list
	addPiece(piece) {
		if (!piece) return false;
		if (piece.parent && piece.parent != this) return false;
		
		if (!this.pieces.includes(piece)) this.pieces.push(piece);
		
		return true;
	}
	removePiece(piece) {
		if (!piece || piece.parent != this) return false;

		var parentEl = piece.el.parentElement;
		if (parentEl) parentEl.removeChild(piece.el);

		var pieceIndex = this.pieces.indexOf(piece);
		if (pieceIndex >= 0) this.pieces.splice(pieceIndex, 1);

		return true;
	}
	//#endregion piece list

	//#region input events
	_allowDrop(ev) {
		ev.preventDefault();
	}
	_drop(ev) { }
	_click(ev) { }
	_mouseOver(ev) { }
	//#endregion input events
};

/***************************************************
 Position
The root class for squares, cells, and nodes other
subdivisions or positions within a container
***************************************************/
class Position extends SpriteElObj {
	constructor(parent) {
		super();
		this._parent = parent;
	}
	get parent() {
		return this._parent;
	}

	get screenX() { return 0; }
	get screenY() { return 0; }
	get screenZ() { return 0; }
	get screenPosition() { return `translate3d(${this.screenX}px, ${this.screenY}px, ${this.screenZ}px)`; }
	
	refresh() {
		this.el.style.transform = this.screenPosition;
	}
};


/***************************************************
 Game board
***************************************************/
class Board extends Container {
	constructor(sceneData) {
		super();
		
		this._w = sceneData.width;
		this._h = sceneData.height;
		this.center();

		this.squares = [];
		for (var y = 0; y < this.h; y++) {
			for (var x = 0; x < this.w; x++) {
				var square = new Square(x, y, this);
				this.squares[(y * this.w) + x] = square;
				this.el.appendChild(square.el);
			}
		}
		this._loadZ(sceneData.z);
		this._loadTerrain(sceneData.terrain);

		this.deployArea = [];
		this._loadDeployArea(sceneData.deployment);

		this.squaresInRange = [];
	}

	get elClass() {
		return 'board';
	}

	get w() { return this._w; }
	get h() { return this._h; }
	
	center() {
		var height = Square.screenY(this.w+1, this.h+1, 0);
		var offset = Square.screenX(this.w+1, 0, 0) + Square.screenX(0, this.h+1, 0);
		this.el.style.top = `${Math.floor((Game.height - height)/2)}px`;
		this.el.style.left = `${Math.floor((Game.width - offset)/2)}px`;
	}

	//#region setup
	_loadZ(zData) {
		if (!zData) return;
		for (var y = 0; y < this.h; y++) {
			if (zData.length <= y) break;
			for (var x = 0; x < this.w; x++) {
				if (zData[y].length <= x) break;
				this.at(x, y).z = zData[y][x];
				this.at(x, y).refresh();
			}
		}
	}
	_loadTerrain(terrainData) {
		if (!terrainData) return;
		terrainData.forEach(data => {
			this.at(data.x, data.y).terrain = data.type;
		});
	}
	_loadDeployArea(deployData) {
		if (!deployData) return;
		deployData.forEach(data => {
			this._addDeploySquare(this.at(data.x, data.y));
		});
	}

	_addDeploySquare(square) {
		if (!square || square.parent != this) return;

		if (!this.deployArea.includes(square)) {
			this.deployArea.push(square);
		}
	}
	//#endregion setup

	//#region access and areas
	at(x, y) {
		if (x == null || x < 0 || x >= this.w) return null;
		if (y == null || y < 0 || y >= this.h) return null;
		if (!this.squares || !this.squares[(y * this.w) + x]) return null;
		return this.squares[(y * this.w) + x];
	}
	getFootprint(origin, size) {
		size = Math.max(size || 0, 1);
	
		var left = origin.x - (size-1);
		var right = origin.x;
		var top = origin.y - (size-1);
		var bottom = origin.y;

		var area = [];
		for (var dx = left; dx <= right; dx++) {
			for (var dy = top; dy <= bottom; dy++) {
				area.push(this.at(dx, dy));
			}
		}
		return area;
	}
	getAoE(skill, origin) {
		if (!skill || !origin) return [];
		return this.squares.filter(square => skill.inArea(origin, square));
	}
	getAdjacent(square) {
		var adjacent = [];

		var left = this.at(square.x-1, square.y);
		if (left) adjacent.push(left);

		var right = this.at(square.x+1, square.y);
		if (right) adjacent.push(right);

		var up = this.at(square.x, square.y-1);
		if (up) adjacent.push(up);

		var down = this.at(square.x, square.y+1);
		if (down) adjacent.push(down);

		return adjacent;
	}

	canFit(unit, centerSquare) {
		var area = this.getFootprint(centerSquare, unit.size);
		return area.every(function(square) {
			return square && unit.canStand(square);
		});
	}
	canFitThrough(unit, centerSquare) {
		var area = this.getFootprint(centerSquare, unit.size);
		return area.every(function(square) {
			return square && unit.canPass(square);
		});
	}

	getNearestFit(piece, centerSquare) {
		if (this.canFit(piece, centerSquare)) return centerSquare;
		var minDistance = null;
		var nearestSquare = null;
		this.squares.forEach(square => {
			var distance = centerSquare.distance(square);
			if (minDistance && distance >= minDistance) return;
			if (this.canFit(piece, square)) {
				nearestSquare = square;
				minDistance = distance;
			}
		});
		return nearestSquare;
	}
	//#endregion access and areas

	//#region moving pieces
	movePiece(piece, square) {
		if (!piece || !square) return false;

		if (!this.canFit(piece, square)) {
			return false;
		}

		if (piece.parent != this) {
			piece.setParent(this);
		} else {
			this._fillPiece(null, piece.square, piece.size);
		}
		if (!this.el.contains(piece.el)) this.el.appendChild(piece.el);
		piece.el.style.transform = square.screenPosition;
		piece.square = square;
		this._fillPiece(piece, square);

		return true;
	}
	removePiece(piece) {
		if (super.removePiece(piece)) {
			this._fillPiece(null, piece.square, piece.size);
			piece.square = null;
			piece.el.style.transform = "";
			return true;
		}
		return false;
	}
	_fillPiece(piece, centerSquare, size) {
		if (!centerSquare) return;

		size = size || piece.size;
		var area = this.getFootprint(centerSquare, size);
		area.forEach(function(square) {
			if (square) square.piece = piece;
		});
	}

	shiftPiece(piece, origin, dist, props) {
		var direction = origin.direction(piece.square);
		return this.shiftPieceDirection(piece, direction, dist, props);
	}
	shiftPieceDirection(piece, direction, dist, props) {
		var [dx, dy] = direction;
		if (dist < 0) {
			dist = -dist;
			dx = -dx;
			dy = -dy;
		}
		var x = piece.square.x;
		var y = piece.square.y;
		var square = piece.square;
		var distMoved = 0;
		for (distMoved = 0; distMoved < dist; distMoved++) {
			x += dx;
			y += dy;
			var newSquare = this.at(x, y);

			if (newSquare && this.canFit(piece, newSquare)
				&& (props?.uphill || newSquare.z <= square.z+1)
				&& (!props?.downhill || newSquare.z > square.z-1)) {
				square = newSquare;
			} else {
				break;
			}
		}
		this.movePiece(piece, square);
		return distMoved;
	}

	swapPieces(pieceA, pieceB) {
		var squareA = pieceA.square;
		var squareB = pieceB.square;

		this.removePiece(pieceA);
		this.removePiece(pieceB);

		if (this.canFit(pieceA, squareB) && this.canFit(pieceB, squareA)) {
			this.movePiece(pieceA, squareB);
			this.movePiece(pieceB, squareA);
			return true;
		} else {
			this.movePiece(pieceA, squareA);
			this.movePiece(pieceB, squareB);
			return false;
		}
	}
	//#endregion moving pieces

	//#region highlighting areas
	setDeployArea(unit, swapOnly) {
		this.deployArea.forEach(square => this._paintDeployRange(square, unit, swapOnly));
	}
	_paintDeployRange(square, unit, swapOnly) {
		square.inRange = true;
		square.el.classList.add('deploy-range');
		if (unit && unit.square != square && (!swapOnly || square.piece)) {
			square.el.ondragover = this._allowDrop;
			this.squaresInRange.push(square);
			square.el.classList.add('selectable');
		} else {
			square.invalid = true;
			square.el.classList.add('invalid');
		}
	}
	setMoveArea(unit) {
		if (!unit || !unit.canMove) return;
		var preview = !unit.myTurn;

		var origin = unit.square;
		if (!origin || origin.parent != this) return;

		this._paintMoveRange(origin, unit.moveRange, [], true, preview);
		var edges = [origin];
		
		if (!unit.moveRange) return;

		while (edges.length > 0) {
			var newEdge = edges.pop();
			var adjacent = this.getAdjacent(newEdge);
			var path = [newEdge].concat(newEdge.path);
			
			for (var n = 0; n < adjacent.length; n++) {
				var square = adjacent[n];
				var movesLeft = newEdge.movesLeft - (square.slowsMove ? 2 : 1); // TODO: Varies by unit?
				if (square.movesLeft != null) {
					continue;
				}
				if (!this.canFitThrough(unit, square)) {
					continue;
				}
				if (square.z > newEdge.z+1) {
					continue;
				}
				this._paintMoveRange(square, movesLeft, path, this.canFit(unit, square), preview);
				edges.push(square);
			}
			edges.sort((a, b) => a.movesLeft - b.movesLeft);
		}
	}
	_paintMoveRange(square, movesLeft, path, valid, preview) {
		square.movesLeft = movesLeft;
		square.path = path;

		if (movesLeft < 0) return;

		square.inRange = true;
		square.el.classList.add('move-range');
		if (preview) square.el.classList.add('enemy-preview');

		if (valid && !preview && path.length > 0) {
			square.el.ondragover = this._allowDrop;
			this.squaresInRange.push(square);
			square.el.classList.add('selectable');
		} else {
			square.invalid = true;
			square.el.classList.add('invalid');
		}
	}
	setSkillArea(skill) {
		if (!skill || !skill.user) return [];
		var user = skill.user;
		if (!user.square || user.square.parent != this) return [];
		var origin = user.square;

		// for a map this small, it's easiest to check every square
		this.squares.forEach(square => {
			if (skill.inRange(origin, square)) {
				this._paintSkillRange(square, skill.validTarget(square));
			}
		});
		// TODO: Use every square in the footprint as an origin
	}
	_paintSkillRange(square, valid) {
		square.inRange = true;
		square.el.classList.add('skill-range');
		if (valid) {
			square.el.ondragover = this._allowDrop;
			if (square.piece) {
				square.piece.el.classList.add('in-range');
			}
			this.squaresInRange.push(square);
			square.el.classList.add('selectable');
		} else {
			square.invalid = true;
			square.el.classList.add('invalid');
		}
	}

	resetAreas() {
		this.squares.forEach(square => this._clearPaint(square));
		this.squaresInRange = [];
	}
	_clearPaint(square) {
		square.inRange = false;
		square.invalid = false;
		square.movesLeft = null;
		square.path = null;
		square.el.classList.remove('deploy-range', 'move-range', 'move-start', 'skill-range', 'enemy-preview', 'invalid', 'selectable');
		square.el.ondragover = null;
		if (square.piece) {
			square.piece.el.classList.remove('in-range');
		}
	}
	//#endregion highlighting areas

	//#region highlighting targets
	showPath(target) {
		if (!target?.path?.length) return;

		target.el.classList.add('move-path', 'move-end');

		var previous = target;
		target.path.forEach(square => {
			square.el.classList.add('move-path');
			if (previous.x < square.x) {
				square.el.classList.add('left');
				previous.el.classList.add('right');
			}
			if (previous.y < square.y) {
				square.el.classList.add('up');
				previous.el.classList.add('down');
			}
			if (previous.x > square.x) {
				square.el.classList.add('right');
				previous.el.classList.add('left');
			}
			if (previous.y > square.y) {
				square.el.classList.add('down');
				previous.el.classList.add('up');
			}
			previous = square;
		});
	}
	showAoE(skill, origin) {
		if (!skill || !origin) return;
		this.getAoE(skill, origin).forEach(square => {
			square.el.classList.add('selected');
			if (square.piece) square.piece.el.classList.add('in-area');
		});
	}
	showDeploySwap(unit, target) {
		if (!unit) return;
		if (unit.square) unit.square.el.classList.add('selected');
		if (target) target.el.classList.add('selected');
	}
	clearTargeting() {
		this.squares.forEach(square => {
			square.el.classList.remove('move-path', 'move-end', 'left', 'up', 'right', 'down', 'selected');
			if (square.piece) square.piece.el.classList.remove('in-area');
		});
	}
	//#endregion highlighting targets

	//#region input events
	_drop(ev) {
		ev.preventDefault();
		var dragElId = ev.dataTransfer.getData("piece");
		if (dragElId && ev.target?.obj) {
			var square = ev.target.obj;
			square = square.square || square;
			if (Game.scene) {
				Game.scene.positionEvent(square, dragElId);
			}
		}
	}
	_click(ev) {
		ev.stopPropagation();
		if (ev.target && ev.target?.obj) {
			var square = ev.target.obj;
			if (square && Game.scene) {
				Game.scene.positionEvent(square, null, ev.type == 'dblclick');
			}
		}
	}
	_mouseOver(ev) {
		ev.stopPropagation();
		if (ev.target && ev.target?.obj) {
			var dragElId = ev.dataTransfer ? ev.dataTransfer.getData("piece") : null;
			var square = ev.target.obj;
			square = square.square || square;
			if (square && Game.scene) { 
				if (square.inRange && !square.invalid) Game.scene.mouseOver(square, dragElId);
				else Game.scene.mouseOver(null, dragElId);
			}
		}
	}
	//#endregion input events
};

/***************************************************
 Game board -> Square
***************************************************/
class Square extends Position {
	constructor(x, y, parent) {
		super(parent);
		this._x = x;
		this._y = y;
		this._z = 0;
		this.piece = null;
		this.terrain = Square.Flat;
		this.inRange = false;

		this.addSubsprites();

		this.refresh();
	}

	get elClass() {
		return 'square';
	}

	addSubsprites() {
		this._selectEl = document.createElement('div');
		this._selectEl.classList.add('highlight-sprite');
		this.el.appendChild(this._selectEl);

		this._pathEl = document.createElement('div');
		this._pathEl.classList.add('path-sprite');
		this.el.appendChild(this._pathEl);
		
		this._decoEl = document.createElement('div');
		this._decoEl.classList.add('deco-sprite');
		this.el.appendChild(this._decoEl);
	}

	//#region static position utility
	static screenX(x, y, _z) {
		return Math.floor(24 * (x - y));
	}
	static screenY(x, y, z) {
		return Math.floor(12 * (x + y - z));
	}
	static screenZ(x, y, z) {
		return Math.floor(12 * (x + y) + z);
	}
	//#endregion static position utility

	//#region position
	get x() { return this._x; }
	get y() { return this._y; }
	get z() { return this._z; }
	set z(value) {
		this._z = value;
		this.refresh();
	}

	get screenX() {
		return Square.screenX(this.x, this.y, this.z);
	}
	get screenY() {
		return Square.screenY(this.x, this.y, this.z);
	}
	get screenZ() {
		return Square.screenZ(this.x, this.y, this.z);
	}
	get groundHeight() {
		return Math.max(this.z*12, 0) + 48;
	}
	get _selfScreenZ() {
		return Square.screenZ(this.x, this.y, this.z - 12);
	}

	refresh() {
		this.el.style.transform = `translate3d(${this.screenX}px, ${this.screenY}px, ${this._selfScreenZ}px)`;
		this.spriteEl.style.height = `${this.groundHeight}px`;
	}
	//#endregion isometric

	//#region utilities
	distance(square) {
		if (!square || this.parent != square.parent) return null;
		return Math.abs(this.x - square.x) + Math.abs(this.y - square.y);
	}
	direction(square) {
		if (!square || this.parent != square.parent) return null;

		var dx = square.x - this.x;
		var dy = square.y - this.y;
		
		if (dx == 0 && dy == 0) {
			return [0, 0];
		} else if (Math.abs(dx) > Math.abs(dy)) {
			if (dx > 0) return [1, 0];
			else return [-1, 0];
		} else {
			if (dy > 0) return [0, 1];
			else return [0, -1];
		}
	}
	//#endregion utilities

	//#region terrain
	static get _BlockMove() { return 1; }
	static get _BlockSight() { return 2; }
	static get _SlowMove() { return 4; }

	static get Flat() { return 0; }
	static get Pit() { return Square._BlockMove; }
	static get Cover() { return Square._BlockSight; }
	static get Wall() { return Square._BlockMove | Square._BlockSight; }
	static get Rough() { return Square._SlowMove; }

	static parseTerrain(string) {
		if (!string) return this.Flat;
		switch (string.toLowerCase()) {
			case "hole":
			case "pit":
				return this.Pit;
			case "bush":
			case "grass":
			case "cover":
				return this.Cover;
			case "wall":
				return this.Wall;
			case "mud":
			case "rough":
				return this.Rough;
			default:
				return this.Flat;
		}
	}

	get terrain() {
		return this._terrain;
	}
	set terrain(value) {
		this._terrain = value;
		this.el.classList.toggle('wall', this._terrain == Square.Wall);
		this.el.classList.toggle('pit', this._terrain == Square.Pit);
		this.el.classList.toggle('cover', this._terrain == Square.Cover);
		this.el.classList.toggle('rough', this._terrain == Square.Rough);
	}
	get blocksMove() {
		return (this.terrain&Square._BlockMove) == Square._BlockMove;
	}
	get blocksSight() {
		return (this.terrain&Square._BlockSight) == Square._BlockSight;
	}
	get slowsMove() {
		return (this.terrain&Square._SlowMove) == Square._SlowMove;
	}
	//#endregion terrain

};

/***************************************************
 Unit list
***************************************************/
class DeployUnitList extends Container {
	constructor(unitList, team) {
		super();
		if (unitList) unitList.forEach(unit => {
			unit.setParent(this);
			if (team) unit.setTeam(team);
		});

		this._deployCounter = new CurrentMaxLabel(0, 0);
		this.el.appendChild(this._deployCounter.el);

		this.el.ondragover = this._allowDrop;
	}

	addPiece(piece) {
		super.addPiece(piece);
		this.el.appendChild(piece.el);
	}

	get elClass() {
		return 'deploy-list';
	}

	get deployed() {
		return this._deployCounter.value;
	}
	set deployed(value) {
		this._deployCounter.value = value;
	}

	get deployLimit() {
		return this._deployCounter.maxValue;
	}
	set deployLimit(value) {
		this._deployCounter.maxValue = value;
	}

	hide() {
		this._hide();
	}
	show() {
		this._show();
	}
	
	//#region input events
	_drop(ev) {
		ev.preventDefault();
		var dragElId = ev.dataTransfer.getData("piece");
		if (dragElId && ev.target?.obj) {
			var container = ev.target.obj;
			if (Game.scene) {
				Game.scene.containerEvent(container, dragElId);
			}
		}
	}
	_click(ev) {
		ev.stopPropagation();
		if (ev.target && ev.target?.obj) {
			var container = ev.target.obj;
			if (container && Game.scene) {
				Game.scene.containerEvent(container, null, ev.type == 'dblclick');
			}
		}
	}
	//#endregion input events
}

/***************************************************
 Skill list
***************************************************/
class SkillList extends Container {
	constructor() {
		super();
		this._user = null;
		this._team = null;
		this._hide();

		this._userInfo = new UnitInfo();
		this.el.appendChild(this._userInfo.el);
	}

	get elClass() {
		return 'skill-list';
	}

	//#region list management
	setUser(user) {
		this._clearSkills();
		this._user = user;
		this._userInfo.unit = user;
		if (!user) {
			this._setTeam(null);
			this._hide();
			return false;
		} else {
			this._setTeam(user.team);
			user.skills.forEach(skill => this._addSkill(skill));
			this._show();
			return true;
		}
	}

	get skills() {
		return this.pieces;
	}
	_addSkill(piece) {
		if (piece) {
			piece.setParent(this);
			this.el.appendChild(piece.el);
		}
	}
	_clearSkills() {
		while(this.pieces.length) { this.removePiece(this.pieces[0]); }
	}

	get team() {
		return this._team;
	}
	_setTeam(team) {
		if (this._team && this._team.style) {
			this.el.classList.remove(this._team.style);
		}
		this._team = team;
		if (this._team && this._team.style) {
			this.el.classList.add(this._team.style);
		}
	}
	//#endregion list management
}

/***************************************************
 Skill list -> Unit info
***************************************************/
class UnitInfo extends ElObj {
	constructor() {
		super();

		this._portrait = document.createElement("div");
		this._portrait.classList.add('face');
		this.el.appendChild(this._portrait);

		this._lifebar = new Lifebar(0, 0);
		this.el.appendChild(this._lifebar.el);

		this._statusList = new StatusList(null);
		this.el.appendChild(this._statusList.el);

		this._nameSpan = document.createElement("span");
		this._nameSpan.classList.add('name');
		this.el.appendChild(this._nameSpan);

		this._tooltip = new HoverDescription("");
		this.el.appendChild(this._tooltip.el);

		this.unit = null;
	}

	get elClass() {
		return 'unit-info';
	}

	//#region unit
	get unit() {
		return this._unit;
	}
	set unit(unit) {
		if (unit) {
			this._unit = unit;
			this.style = unit.style;
			this._lifebar.maxValue = unit.maxHp;
			this._lifebar.value = unit.hp;
			this._lifebar.defenseValue = unit.defense;
			this._statusList.value = unit._status;
			this._nameSpan.innerText = unit.characterName;
			this._tooltip.value = unit.fullDescription;
		} else {
			this.style = null;
			this._unit = null;
			this._lifebar.maxValue = 0;
			this._lifebar.value = 0;
			this._lifebar.defenseValue = 0; 
			this._statusList.value = null;
			this._nameSpan.innerText = "";
			this._tooltip.value = "";
		}
	}
	//#endregion unit
}

/***************************************************
 World Map
***************************************************/
class OverworldMap extends Container {
	constructor(mapData) {
		super();
		this._name = mapData.filename;
		this.nodes = [];
		this.edges = [];

		if (mapData) {
			this._loadNodes(mapData.nodes);
			this._loadConnections(mapData.connections);
			this._loadEvents(mapData.events);
		}
	}

	get elClass() {
		return 'overworld-map';
	}

	get name() {
		return this._name;
	}

	refresh() {
		this.nodes.forEach(node => node.refresh());
		this.edges.forEach(edge => edge.refresh());
	}

	//#region loading
	_loadNodes(nodeData) {
		nodeData.forEach(data => {
			var newNode = this.addNode(data.id, data.x, data.y);
			if (data.hidden) newNode.hide();
		});
	}

	_loadConnections(connectionData) {
		connectionData.forEach(data => {
			this.connect(data.a, data.b, data.oneWay);
		});
	}

	_loadEvents(eventData) {
		eventData.forEach(data => {
			var node = this.getNode(data.node);
			if (node && data.type) {
				var newEvent = new MapEvent(data, node);
				if (newEvent.complete) this.unlockNodes(newEvent.unlocks, true);
				node.setEvent(newEvent);
			}
		});
	}
	//#endregion loading

	//#region node setup
	getNode(id) {
		if (!id) return null;
		id = id.toLowerCase();
		return this.nodes.find(node => node.id == id);
	}
	addNode(id, x, y) {
		if (!id) return null;
		id = id.toLowerCase();
		if (this.getNode(id)) return null; // a node with this ID already exists

		var node = new MapNode(id, x, y, this);
		this.nodes.push(node);
		this.el.appendChild(node.el);

		return node;
	}
	connect(id1, id2, oneWay) {
		var node1 = this.getNode(id1);
		var node2 = this.getNode(id2);
		if (node1 && node2 && !this._connection(node1, node2)) {
			var newEdge = new Edge(node1, node2, oneWay);
			this.edges.push(newEdge);
			this.el.appendChild(newEdge.el);
			return true;
		}
		return false;
	}
	disconnect(id1, id2) {
		var node1 = this.getNode(id1);
		var node2 = this.getNode(id2);
		if (node1 && node2) {
			for (var i = 0; i < this.edges.length; i++) {
				if (this.edges[i].otherNode(node1) == node2) {
					this.edges.splice(i, 1);
					i--;
				}
			}
			return true;
		}
		return false;
	}
	_connection(start, end) {
		return this.edges.find(edge => edge.otherNode(start) == end);
	}
	_allEdges(node) {
		return this.edges.filter(edge => edge.start == node || edge.end == node);
	}
	//#endregion node setup

	async unlockNodes(nodeIdList, noAnimation) {
		for (var i = 0; i < nodeIdList.length; i++) {
			var node = this.getNode(nodeIdList[i]);
			if (node && node.hidden) {
				node.show();
				if (!noAnimation) {
					node.addTimedClass(500, 'unlock');
					this._allEdges(node).forEach(edge => {
						if (edge.hidden) return;
						edge.refresh();
						if (edge.end == node) edge.addTimedClass(1500, 'unlock');
						else edge.addTimedClass(2500, 'unlock', 'out');
					});
					await Game.asyncPause(1000);
				}
			}
		}
	}

	//#region move range
	setReachableNodes(origin, range) {
		if (!origin || origin.parent != this || range < 0) return;
		this._paintReachableNode(origin, range, [], []);
		var frontier = [origin];

		while (frontier.length > 0) {
			var newNode = frontier.pop();
			var movesLeft = newNode.movesLeft-1;
			var path = [newNode].concat(newNode.path);

			newNode.adjacent.forEach(node => {
				if (node.hidden || node.inRange) return;
				if (newNode.incomplete && node.incomplete) return;
				var edgePath = [this._connection(newNode, node)].concat(newNode.edgePath);
				this._paintReachableNode(node, movesLeft, path, edgePath);
				if (movesLeft > 0) frontier.unshift(node);
			});
		}

		this.edges.forEach(edge => edge.refresh());
	}
	_paintReachableNode(node, movesLeft, nodePath, edgePath) {
		node.inRange = true;
		node.movesLeft = movesLeft;
		node.path = nodePath;
		node.edgePath = edgePath
		node.el.classList.add('selectable');
		node.el.ondragover = this._allowDrop;
	}
	resetReachableNodes() {
		this.nodes.forEach(node => this._clearPaint(node));
	}
	_clearPaint(node) {
		node.inRange = false;
		node.movesLeft = null;
		node.path = null;
		node.el.classList.remove('selectable');
		node.el.ondragover = null;
	}
	//#endregion move range

	//#region input events
	_allowDrop(ev) {
		ev.preventDefault();
	}
	_drop(ev) {
		ev.preventDefault();
		var dragElId = ev.dataTransfer.getData("piece");
		if (dragElId && ev.target?.obj) {
			var node = ev.target.obj;
			node = node.node || node;
			if (Game.scene) {
				Game.scene.positionEvent(node, dragElId);
			}
		}
	}
	_click(ev) {
		ev.stopPropagation();
		if (ev.target && ev.target?.obj) {
			var node = ev.target.obj;
			if (node && Game.scene) {
				Game.scene.positionEvent(node, null, ev.type == 'dblclick');
			}
		}
	}
	_mouseOver(ev) {
		ev.stopPropagation();
		if (ev.target && ev.target?.obj) {
			var dragElId = ev.dataTransfer ? ev.dataTransfer.getData("piece") : null;
			var node = ev.target.obj;
			node = node.square || node;
			if (Game.scene) { 
				Game.scene.mouseOver(node, dragElId);
				// TODO: Limitations for which nodes respond to hovering?
			}
		}
	}
	//#endregion
}

/***************************************************
 World Map -> Map Node
***************************************************/
class MapNode extends Position {
	constructor(id, x, y, parent) {
		super();
		this._id = id;
		this.el.id = id+'Node';
		this._x = x;
		this._y = y;
		this._parent = parent;

		this._adjacent = [];
		this._event = null;
		this.inRange = false;
		this.movesLeft = null;
		this.path = null;

		this.refresh();
	}

	get elClass() {
		return 'map-node';
	}

	get id() {
		return this._id;
	}

	get fullId() {
		return `${this.parent.name}/${this.id}`;
	}

	//#region map event
	setEvent(event) {
		this._event = event;
		this.refresh();
	}
	get event() {
		return this._event;
	}
	get incomplete() {
		return !!(this.event && !this.event.complete);
	}
	get repeatable() {
		return !!(this.event && this.event.complete && this.event.repeatable);
	}
	get canExplore() {
		return !!(this.incomplete || this.repeatable);
	}
	//#endregion map event

	refresh() {
		super.refresh();
		this.el.classList.toggle('incomplete', this.incomplete);
		this.el.classList.toggle('repeatable', this.repeatable);
	}

	//#region position
	get x() { return this._x; }
	get y() { return this._y; }

	get screenX() {
		return this.x;
	}
	get screenY() {
		return this.y;
	}
	get screenZ() {
		return 0;
	}
	//#endregion position

	//#region show/hide
	get hidden() {
		return this._hidden;
	}
	hide() {
		this._hide();
		this._hidden = true;
	}
	show() {
		this._show();
		this._hidden = false;
	}
	//#endregion show/hide

	//#region connections
	get adjacent() {
		if (!this.parent?.edges) return [];
		var adjacent = [];
		this.parent.edges.forEach(edge => {
			var otherNode = edge.otherNode(this);
			if (otherNode) adjacent.push(otherNode);
		})
		return adjacent;
	}
	get edges() {
		if (!this.parent?.edges) return [];
		var edges = [];
		this.parent.edges.forEach(edge => {
			var otherNode = edge.otherNode(this);
			if (otherNode) edges.push(edge);
		})
		return edges;
	}
	//#endregion connections
}