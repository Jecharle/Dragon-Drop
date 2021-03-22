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
class Position extends ElObj {
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
	constructor() {
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

		this.deployArea = [];

		this.el.onclick = this._click;
		this.el.ondrop = this._drop;
	}

	get elType() {
		return 'div';
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
	getArea(origin, size, rule, ruleProps) {
		size = Math.max(size || 0, 1);
	
		var left = origin.x - Math.floor((size-1)/2);
		var right = origin.x + Math.ceil((size-1)/2);
		var top = origin.y - Math.floor((size-1)/2);
		var bottom = origin.y + Math.ceil((size-1)/2);

		var area = [];
		for (var dx = left; dx <= right; dx++) {
			for (var dy = top; dy <= bottom; dy++) {
				var square = this.at(dx, dy);
				if (!rule || rule(origin, square, ruleProps)) {
					area.push(square);
				}
			}
		}
		return area;
	}

	canFit(piece, centerSquare, size) {
		size = size || piece.size;
		var area = this.getArea(centerSquare, size);
		return area.every(function(square) {
			if (!square) {
				return false;
			}
			if (square.terrain & Square.BlockMove) {
				return false;
			}
			if (square.piece != null && square.piece != piece) {
				return false;
			}
			return true;
		});
	}
	// TODO: Too much repeated code- recombine with canFit into one method with variable settings?
	canPass(piece, centerSquare, size) {
		size = size || piece.size;
		var area = this.getArea(centerSquare, size);
		return area.every(function(square) {
			if (!square) {
				return false;
			}
			if (square.terrain & Square.BlockMove) {
				return false; // TODO: Depends on movement settings?
			}
			if (square.piece != null && piece != null && !square.piece.isAlly(piece)) {
				return false;
			}
			return true;
		});
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
		var area = this.getArea(centerSquare, size);
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
	setMoveArea(piece) {
		if (!piece || !piece.moveRange) return;

		var origin = piece.moved ? piece.originSquare : piece.square;
		if (!origin || origin.parent != this) return;

		this._paintMoveRange(origin, piece.moveRange, true);
		var edges = [origin];
		
		for (var i = 0; i < edges.length; i++) {
			var adjacent = this.getAdjacent(edges[i]);
			var movesLeft = edges[i].movesLeft-1;
			
			for (var n = 0; n < adjacent.length; n++) {
				if (adjacent.inRange && adjacent.movesLeft > movesLeft) {
					continue;
				}
				if (!this.canPass(piece, adjacent[n])) {
					continue;
				}
				this._paintMoveRange(adjacent[n], movesLeft);
				if (movesLeft) {
					edges.push(adjacent[n]);
				}
			}
		}
	}
	_paintMoveRange(square, movesLeft, isOrigin) {
		square.el.classList.add('move-range');
		if (isOrigin) square.el.classList.add('move-origin');
		square.el.ondragover = this._allowDrop;
		square.inRange = true;
		square.movesLeft = movesLeft;
	}
	setSkillArea(skill) {
		if (!skill || !skill.user) return [];
		var user = skill.user;
		if (!user.square || user.square.parent != this) return [];
		var origin = user.square;

		// for a map this small, it's easiest to check every square
		this._squares.forEach(square => {
			if (skill.inRange(origin, square)) this._paintSkillRange(square, skill.validTarget(square));
		});
		// TODO: More possible origins for larger units?
	}
	_paintSkillRange(square, valid) {
		if (valid) {
			square.el.classList.add('skill-range');
			square.el.ondragover = this._allowDrop;
			square.inRange = true;
		} else {
			square.el.classList.add('skill-range-invalid');
			square.inRange = true;
		}
	}

	resetAreas() {
		this._squares.forEach(square => this._clearPaint(square));
	}
	_clearPaint(square) {
		square.el.classList.remove('deploy-range');
		square.el.classList.remove('move-range');
		square.el.classList.remove('move-origin');
		square.el.classList.remove('skill-range');
		square.el.classList.remove('skill-range-invalid');
		square.el.ondragover = null;
		square.inRange = false;
		square.movesLeft = null;
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

	_allowDrop(ev) {
		ev.preventDefault();
		// TODO: Reject if the data transfer is incorrect
	}
	_drop(ev) {
		ev.preventDefault();
		var elId = ev.dataTransfer.getData("piece");
		if (elId && ev.target) {
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
		this.el.onmouseenter = this._mouseEnter;
		this.el.ondragenter = this._mouseEnter;
		this.el.onmouseleave = this._mouseLeave;
		this.el.ondragleave = this._mouseLeave;
	}

	get elType() {
		return 'div';
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
			case Square.Bush:
				this.el.classList.remove('bush');
				break;
			case Square.Mud:
				this.el.classList.remove('mud');
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
			case Square.Bush:
				this.el.classList.add('bush');
				break;
			case Square.Mud:
				this.el.classList.add('mud');
				break;
		}
	}

	_mouseEnter(ev) {
		ev.stopPropagation();
		if (ev.currentTarget) { // mouse-in counts pieces
			var elId = ev.dataTransfer ? ev.dataTransfer.getData("piece") : null;
			var square = ev.currentTarget.obj;
			if (square && square.inRange) {
				if (Game.scene) Game.scene.mouseEnter(square, elId);
			}
		}
	}
	_mouseLeave(ev) {
		ev.stopPropagation();
		if (ev.target) { // mouse-out does NOT count pieces
			var elId = ev.dataTransfer ? ev.dataTransfer.getData("piece") : null;
			var square = ev.target.obj;
			if (square && square.inRange) {
				if (Game.scene) Game.scene.mouseLeave(square, elId);
			}
		}
	}
};
Square.BlockMove = 1;
Square.BlockSight = 2;
Square.SlowMove = 4;

Square.Flat = 0;
Square.Pit = Square.BlockMove;
Square.Bush = Square.BlockSight;
Square.Wall = Square.BlockMove | Square.BlockSight;
Square.Mud = Square.SlowMove;

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