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
				
				square.el.style.transform = `translate(${square.screenX}px, ${square.screenY}px)`;
				square.el.style.zIndex = `${square.screenZ}`;
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
	}

	get elClass() {
		return 'board';
	}

	get w() {
		return 8;
	}
	get h() {
		return 8;
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
			this.addDeploySquare(this.at(data.x, data.y));
		});
	}

	addDeploySquare(square) {
		if (!square || square.parent != this) return;

		if (!this.deployArea.includes(square)) {
			this.deployArea.push(square);
		}
	}

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

	movePiece(piece, square) {
		if (!piece || !square) return false;

		if (!this.canFit(piece, square)) {
			return false;
		}

		if (piece.parent != this) {
			piece.setParent(this);
			this.el.appendChild(piece.el);
		} else {
			this._fillPiece(null, piece.square, piece.size);
		}

		piece.el.style.transform = `translate(${square.screenX}px, ${square.screenY-32}px)`;
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

	setDeployArea(hasUnit) {
		this.deployArea.forEach(square => this._paintDeployRange(square, hasUnit));
	}
	_paintDeployRange(square, valid) {
		square.inRange = true;
		square.el.classList.add('deploy-range');
		if (valid) {
			square.el.ondragover = this._allowDrop;
			this.squaresInRange.push(square);
			square.el.classList.add('selectable');
		} else {
			square.invalid = true;
			square.el.classList.add('invalid');
		}
	}
	setMoveArea(unit) {
		if (!unit) return;
		var preview = !unit.myTurn;

		var origin = unit.square;
		if (!origin || origin.parent != this) return;

		this._paintMoveRange(origin, unit.moveRange, [], true, preview);
		var edges = [origin];
		
		if (!unit.canMove || !unit.moveRange) return;

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
		square.el.classList.remove('deploy-range', 'move-range', 'move-start', 'skill-range', 'enemy-preview', 'invalid', 'selectable');
		square.el.ondragover = null;
		square.inRange = false;
		square.invalid = false;
		square.movesLeft = null;
		square.path = null;
	}

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

	getAoE(skill, origin) {
		if (!skill || !origin) return [];
		return this.squares.filter(square => skill.inArea(origin, square));
	}
	showAoE(skill, origin) {
		if (!skill || !origin) return;
		this.getAoE(skill, origin).forEach(square => square.el.classList.add('selected'));
	}

	showDeploySwap(unit, target) {
		if (!unit || !unit.square) return;
		unit.square.el.classList.add('selected');
		if (target) target.el.classList.add('selected');
	}

	clearTargeting() {
		this.squares.forEach(square =>
			square.el.classList.remove('move-path', 'move-end', 'left', 'up', 'right', 'down', 'selected'));
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

	_allowDrop(ev) {
		ev.preventDefault();
	}
	_drop(ev) {
		ev.preventDefault();
		var elId = ev.dataTransfer.getData("piece");
		if (elId && ev.target && ev.target.obj) {
			var square = ev.target.obj;
			square = square.square || square;
			if (Game.scene) {
				Game.scene.selectPosition(square, elId);
			}
		}
	}
	_click(ev) {
		ev.stopPropagation();
		if (ev.target) {
			var square = ev.target.obj;
			if (square) {
				if (Game.scene) Game.scene.selectPosition(square);
			}
		}
	}
};

/***************************************************
 Game board -> Square
***************************************************/
class Square extends Position {
	constructor(x, y, parent) {
		super(parent);
		this._x = x;
		this._y = y;
		this.piece = null;
		this.terrain = Square.Flat;
		this.inRange = false;
		this.el.onmousemove = this._mouseOver;
		this.el.ondragenter = this._mouseOver;
	}

	get elClass() {
		return 'square';
	}

	get x() {
		return this._x;
	}
	get y() {
		return this._y;
	}

	get screenX() {
		return 64*(this.x - this.y);
	}
	get screenY() {
		return 32*(this.x + this.y) - 8*32;
	}
	get screenZ() {
		return (this.x + this.y);
	}

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

		this._terrain = value;

		switch (this._terrain) {
			case Square.Wall:
				this.el.classList.add('wall');
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

	_mouseOver(ev) {
		ev.stopPropagation();
		if (ev.currentTarget) { // pieces count
			var dragElId = ev.dataTransfer ? ev.dataTransfer.getData("piece") : null;
			var square = ev.currentTarget.obj;
			if (square && Game.scene) { 
				if (square.inRange && !square.invalid) Game.scene.mouseOver(square, dragElId);
				else Game.scene.mouseOver(null, dragElId);
			}
		}
	}
};
Square._BlockMove = 1;
Square._BlockSight = 2;
Square._SlowMove = 4;

Square.Flat = 0;
Square.Pit = Square._BlockMove;
Square.Cover = Square._BlockSight;
Square.Wall = Square._BlockMove | Square._BlockSight;
Square.Rough = Square._SlowMove;

/***************************************************
 Skill list
***************************************************/
class SkillList extends Container {
	constructor() {
		super();
		this._user = null;
		this.el.classList.add('skill-list');
		this.el.style.visibility = "hidden";

		this._userInfo = new UnitInfo();
		this.el.appendChild(this._userInfo.el);
	}

	setUser(user) {
		this._clearSkills();
		this._user = user;
		this._userInfo.unit = user;
		if (!user) {
			this.el.style.visibility = "hidden";
			return false;
		}

		user.skills.forEach(skill => this._addSkill(skill));
		this.el.style.visibility = "visible";
		return true;
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
		this._portrait.classList.add('face'); // TODO: Replace with 'face' and add portraits
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
			this._nameSpan.innerText = unit.name;
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