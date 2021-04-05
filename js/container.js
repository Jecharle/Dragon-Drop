/***************************************************
 Container
The root class for boards, lists, maps, and such
that contain pieces and track their positions
***************************************************/
class Container extends ElObj {
	constructor() {
		super();
	}

	removePiece(piece) {
		if (!piece || piece.parent != this) return false;
		var parentEl = piece.el.parentElement;
		if (parentEl) parentEl.removeChild(piece.el);
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
		this._squares = [];

		for (var y = 0; y < this.h; y++) {
			var row = document.createElement('div');
			row.classList.add('row');
			for (var x = 0; x < this.w; x++) {
				var square = new Square(x, y, this);
				this._squares[(y * this.w) + x] = square;
				row.appendChild(square.el);
			}
			this.el.appendChild(row);
		}
		if (mapData) this._loadTerrain(mapData.terrain);

		this.deployArea = [];
		if (mapData) this._loadDeployArea(mapData.deployment);

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
		if (!this._squares || !this._squares[(y * this.w) + x]) return null;
		return this._squares[(y * this.w) + x];
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
		this._squares.forEach(square => {
			var distance = this.getDistance(centerSquare, square);
			if (minDistance && distance >= minDistance) return;
			if (this.canFit(piece, square)) {
				nearestSquare = square;
				minDistance = distance;
			}
		});
		return nearestSquare;
	}

	movePiece(piece, targetSquare) {
		if (!piece || !targetSquare) return false;

		if (!this.canFit(piece, targetSquare)) {
			return false;
		}

		if (piece.parent != this) {
			piece.setParent(this);
		} else {
			this._fillPiece(null, piece.square, piece.size);
		}

		targetSquare.el.appendChild(piece.el);
		piece.square = targetSquare;
		this._fillPiece(piece, targetSquare);

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
		var direction = this.getDirection(origin, piece.square);
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
	getDistance(origin, target) {
		return Math.abs(target.x - origin.x) + Math.abs(target.y - origin.y);
	}
	getDirection(origin, target) {
		var dx = target.x - origin.x;
		var dy = target.y - origin.y;
		
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

	setDeployArea() {
		this.deployArea.forEach(square => this._paintDeployRange(square));
	}
	_paintDeployRange(square) {
		square.el.classList.add('deploy-range');
		square.el.ondragover = this._allowDrop;
		square.inRange = true;
	}
	setMoveArea(unit) {
		if (!unit || !unit.moveRange) return;

		var origin = unit.homeSquare ? unit.homeSquare : unit.square;
		if (!origin || origin.parent != this) return;

		this._paintMoveRange(origin, unit.moveRange, [], true);
		this._paintAiScore(origin, unit.aiMoveScore(origin));
		var edges = [origin];
		
		while (edges.length > 0) {
			var newEdge = edges.pop();
			var adjacent = this.getAdjacent(newEdge);
			var path = [newEdge].concat(newEdge.path);
			
			for (var n = 0; n < adjacent.length; n++) {
				var square = adjacent[n];
				var movesLeft = newEdge.movesLeft - (square.slowsMove ? 2 : 1);
				if (square.movesLeft != null) {
					continue;
				}
				if (!this.canFitThrough(unit, square)) {
					continue;
				}
				this._paintMoveRange(square, movesLeft, path, this.canFit(unit, square));
				if (!square.invalid) this._paintAiScore(square, unit.aiMoveScore(square));
				edges.push(square);
			}
			edges.sort((a, b) => a.movesLeft - b.movesLeft);
		}
	}
	_paintMoveRange(square, movesLeft, path, valid) {
		square.movesLeft = movesLeft;
		square.path = path;

		if (movesLeft < 0) return;

		square.inRange = true;
		square.el.classList.add('move-range');
		if (path.length == 0) square.el.classList.add('move-origin');

		if (valid) {
			square.el.ondragover = this._allowDrop;
		} else {
			square.el.classList.add('invalid');
			square.invalid = true;
		}
	}
	setSkillArea(skill) {
		if (!skill || !skill.user) return [];
		var user = skill.user;
		if (!user.square || user.square.parent != this) return [];
		var origin = user.square;

		// for a map this small, it's easiest to check every square
		this._squares.forEach(square => {
			if (skill.inRange(origin, square)) {
				this._paintSkillRange(square, skill.validTarget(square), skill.aiTargetScore(square));
				if (!square.invalid) this._paintAiScore(square, skill.aiTargetScore(square));
			}
		});
		// TODO: More possible origins for larger units?
	}
	_paintSkillRange(square, valid, aiScore) {
		square.inRange = true;
		square.el.classList.add('skill-range');
		if (valid) {
			square.el.ondragover = this._allowDrop;
		} else {
			square.el.classList.add('invalid');
			square.invalid = true;
		}
	}

	_paintAiScore(square, aiScore) {
		if (aiScore >= 0) square.aiScore = aiScore;
	}

	resetAreas() {
		this._squares.forEach(square => this._clearPaint(square));
	}
	_clearPaint(square) {
		square.el.classList.remove('deploy-range');
		square.el.classList.remove('move-range');
		square.el.classList.remove('move-origin');
		square.el.classList.remove('skill-range');
		square.el.classList.remove('invalid');
		square.el.ondragover = null;
		square.inRange = false;
		square.invalid = false;
		square.movesLeft = null;
		square.path = null;
		square.aiScore = null;
	}

	showPath(target) {
		target.el.classList.add('move-path');
		target.path.forEach(square => square.el.classList.add('move-path'));
	}
	clearPath() {
		this._squares.forEach(square => square.el.classList.remove('move-path'));
	}

	getAoE(skill, origin) {
		if (!skill || !origin) return [];
		return this._squares.filter(square => skill.inArea(origin, square));
	}
	showAoE(skill, origin) {
		this.getAoE(skill, origin).forEach(square => square.el.classList.add('skill-aoe'));
	}
	clearAoE() {
		this._squares.forEach(square => square.el.classList.remove('skill-aoe'));
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

	get aiBestSquare() {
		return this._squares.reduce((best, square) => {
			if (square.aiScore == null) return best;
			else if (!best || square.aiScore >= best.aiScore) return square;
			else return best;
		}, null);
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
		this._skills = [];
		this.el.classList.add('skill-list');
	}

	setUser(user) {
		this._clearSkills();
		this._user = user;
		if (!user) return false;

		/*var userSkills = user.skills;
		for (var i = 0; i < userSkills.length; i++) {
			this._addSkill(userSkills[i]);
		}*/
		user.skills.forEach(skill => this._addSkill(skill));
		return true;
	}

	get skills() {
		return this._skills;
	}

	_addSkill(piece) {
		if (piece) {
			piece.setParent(this);
			this.skills.push(piece);
			this.el.appendChild(piece.el);
		}
	}

	_clearSkills() {
		this.skills.forEach(skill => this.removePiece(skill));
		/*for (var i = 0; i < this.skills.length; i++) {
			this.removePiece(this.skills[i]);
		}*/
		this._skills = [];
	}
}