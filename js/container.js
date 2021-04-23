/***************************************************
 Container
The root class for boards, lists, maps, and such
that contain pieces and track their positions
***************************************************/
class Container extends ElObj {
	constructor() {
		super();
		this.pieces = [];
	}

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
	get screenPosition() { return `translate(${this.screenX}px, ${this.screenY}px)`; }
	
	refresh() {
		this.el.style.transform = this.screenPosition;
		this.el.style.zIndex = this.screenZ;
	}
};


/***************************************************
 Game board
***************************************************/
class Board extends Container {
	constructor(mapData) {
		super();
		this.squares = [];

		for (var y = 0; y < this.h; y++) {
			for (var x = 0; x < this.w; x++) {
				var square = new Square(x, y, this);
				this.squares[(y * this.w) + x] = square;
				this.el.appendChild(square.el);
			}
		}
		if (mapData) this._loadTerrain(mapData.terrain);

		this.deployArea = [];
		if (mapData) this._loadDeployArea(mapData.deployment);

		this.squaresInRange = [];

		this.el.onclick = this._click;
		this.el.ondrop = this._drop;
		this.el.onmousemove = this._mouseOver;
		this.el.ondragenter = this._mouseOver;
	}

	get elClass() {
		return 'board';
	}

	get w() { return 8; }
	get h() { return 8; }

	//#region setup
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
		piece.el.style.zIndex = square.screenZ;
		piece.square = square;
		this._fillPiece(piece, square);

		return true;
	}
	removePiece(piece) {
		if (super.removePiece(piece)) {
			this._fillPiece(null, piece.square, piece.size);
			piece.square = null;
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

			if (newSquare && this.canFit(piece, newSquare)) {
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
	setDeployArea(hasUnit) {
		this.deployArea.forEach(square => this._paintDeployRange(square, hasUnit));
	}
	_paintDeployRange(square, valid) {
		square.inRange = true;
		square.el.classList.add('deploy-range');
		if (valid) {
			square.el.ondragover = this._allowDrop;
			if (square.piece) square.piece.el.ondragover = this._allowDrop;
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
		if (path.length == 0) square.el.classList.add('move-start');
		if (preview) square.el.classList.add('enemy-preview');

		if (valid && !preview) {
			square.el.ondragover = this._allowDrop;
			if (square.piece) square.piece.el.ondragover = this._allowDrop;
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
				square.piece.el.ondragover = this._allowDrop;
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
			square.piece.el.ondragover = null;
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
		if (!unit || !unit.square) return;
		unit.square.el.classList.add('selected');
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
	_allowDrop(ev) {
		ev.preventDefault();
	}
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
				Game.scene.positionEvent(square);
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
		this.refresh();
	}

	get elClass() {
		return 'square';
	}

	//#region position
	get x() { return this._x; }
	get y() { return this._y; }
	get z() { return this._z; }
	set z(value) {
		this._z = value;
		this.refresh();
	}

	static screenX(x, y, _z) {
		return Math.floor(64 * (x - y));
	}
	static screenY(x, y, z) {
		return Math.floor(32 * (x + y - z));
	}
	static screenZ(x, y, z) {
		return Math.floor(32 * (x + y + z));
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
	get _selfScreenZ() {
		return Square.screenZ(this.x, this.y, this.z - 1);
	}

	refresh() {
		this.el.style.transform = this.screenPosition;
		this.el.style.zIndex = this._selfScreenZ;
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

	get terrain() {
		return this._terrain;
	}
	set terrain(value) {
		switch (this._terrain) {
			case Square.Wall:
				this.el.classList.remove('wall');
				break;
			case Square.Pit:
				this.el.classList.remove('pit');
				break;
			case Square.Cover:
				this.el.classList.remove('cover');
				break;
			case Square.Rough:
				this.el.classList.remove('rough');
				break;
		}

		this.z = 0;
		this._terrain = value;

		switch (this._terrain) {
			case Square.Wall:
				this.el.classList.add('wall');
				this.z = 1;
				break;
			case Square.Pit:
				this.el.classList.add('pit');
				break;
			case Square.Cover:
				this.el.classList.add('cover');
				break;
			case Square.Rough:
				this.el.classList.add('rough');
				break;
		}
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
 Skill list
***************************************************/
class SkillList extends Container {
	constructor() {
		super();
		this._user = null;
		this.el.classList.add('skill-list');
		this._hide();

		this._userInfo = new UnitInfo();
		this.el.appendChild(this._userInfo.el);
	}

	setUser(user) {
		this._clearSkills();
		this._user = user;
		this._userInfo.unit = user;
		if (!user) {
			this._hide();
			return false;
		} else {
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

		this._nameSpan = document.createElement("span");
		this._nameSpan.classList.add('name');
		this.el.appendChild(this._nameSpan);

		this._tooltip = new SkillDescription("");
		this.el.appendChild(this._tooltip.el);

		this.unit = null;
	}

	get elClass() {
		return 'unit-info';
	}

	get unit() {
		return this._unit;
	}
	set unit(unit) {
		if (unit) {
			this._unit = unit;
			this.style = unit.style;
			this._lifebar.maxValue = unit.maxHp;
			this._lifebar.value = unit.hp;
			this._nameSpan.innerText = unit.characterName;
			this._tooltip.value = unit.fullDescription;
		} else {
			this.style = null;
			this._unit = null;
			this._lifebar.maxValue = 0;
			this._lifebar.value = 0;
			this._nameSpan.innerText = "";
			this._tooltip.value = "";
		}
	}
}

/***************************************************
 World Map
***************************************************/
class OverworldMap extends Container {
	constructor() {
		super();
		this.nodes = [];

		this.el.onclick = this._click;
		this.el.ondrop = this._drop;
		this.el.onmousemove = this._mouseOver;
		this.el.ondragenter = this._mouseOver;
	}

	get elClass() {
		return 'overworld-map';
	}

	refresh() {
		this.nodes.forEach(node => node.refresh());
	}

	//#region node management
	getNode(id) {
		id = id.toLowerCase();
		return this.nodes.find(node => node.id == id);
	}
	addNode(id, x, y) {
		id = id.toLowerCase();
		if (this.getNode(id)) return null; // a node with this ID already exists

		var node = new MapNode(id, x, y, this);
		this.nodes.push(node);
		this.el.appendChild(node.el);

		return node;
	}
	connect(id1, id2) {
		var node1 = this.getNode(id1.toLowerCase());
		var node2 = this.getNode(id2.toLowerCase());
		if (node1 && node2) {
			node1.addEdge(node2);
			node2.addEdge(node1);
			return true;
		}
		return false;
	}
	disconnect(id1, id2) {
		var node1 = this.getNode(id1.toLowerCase());
		var node2 = this.getNode(id2.toLowerCase());
		if (node1 && node2) {
			node1.removeEdge(node2);
			node2.removeEdge(node1);
			return true;
		}
		return false;
	}
	//#endregion node management

	//#region move range
	setReachableNodes(origin, range) {
		if (!origin || origin.parent != this || range < 0) return;
		this._paintReachableNode(origin, range, []);
		var edges = [origin];

		while (edges.length > 0) {
			var newEdge = edges.pop();
			var movesLeft = newEdge.movesLeft-1;
			var path = [newEdge].concat(newEdge.path);

			newEdge.edges.forEach(node => {
				if (node.hidden || node.inRange) return;
				this._paintReachableNode(node, movesLeft, path);
				if (movesLeft > 0) edges.unshift(node);
			});
		}
	}
	_paintReachableNode(node, movesLeft, path) {
		node.inRange = true;
		node.movesLeft = movesLeft;
		node.path = path;
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
				Game.scene.positionEvent(node);
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

		this._edges = [];
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

	//#region text
	get name() { return this._event?.name || ""; } // TEMP
	get _description() { return this._event?.description || ""; }
	get fullDescription() {
		var description = "";
		if (this.name) description +=`<strong>${this.name}</strong><br>`
		if (this._description) description += `${this._description}`;
		return description;
	}
	//#endregion text

	get incomplete() {
		return this._event && !this._event.complete;
	}
	explore() {
		if (!this._event) return false;
		this._event.complete = true;
		return true;
	}

	refresh() {
		super.refresh();
		this.el.classList.toggle('incomplete', this.incomplete);
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
	get hidder() {
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

	//#region edges
	get edges() {
		return this._edges;
	}
	addEdge(node) {
		if (!node || this._edges.includes(node)) return;
		this._edges.push(node);
	}
	removeEdge(node) {
		var nodeIndex = this._edges.indexOf(node);
		if (nodeIndex >= 0) this._edges.splice(nodeIndex, 1);
	}
	//#endregion edges
}

class TestOverworldMap extends OverworldMap {
	constructor() {
		super();

		this.addNode('start', 4*64, 5*64);
		this.addNode('second', 4*64, 8*64);
		this.addNode('fork', 7*64, 7*64);
		this.addNode('tail', 9*64, 9*64);
		this.addNode('last', 8*64, 4*64);

		this.connect('start', 'second');
		this.connect('second', 'fork');
		this.connect('fork', 'tail');
		this.connect('fork', 'last');
		this.connect('last', 'start');

		this.getNode('last')._event = {
			name: "Test event",
			description: "Eventually, this will start a test battle"
		};

		this.getNode('second')._event = {
			name: "Another Event",
			description: "Dunno what to do this one, but I want two events in place"
		};
	}
}