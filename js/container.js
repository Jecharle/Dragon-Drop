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
 SubContainer
The root class for squares, cells, and nodes other
subdivisions or positions within a container
***************************************************/
class SubContainer extends ElObj {
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
	getArea(x, y, size, shape, shapeProps) {
		x = x || 0;
		y = y || 0;
		size = Math.max(size || 0, 1);
	
		var left = -Math.floor((size-1)/2);
		var right = Math.ceil((size-1)/2);
		var top = -Math.floor((size-1)/2);
		var bottom = Math.ceil((size-1)/2);

		var area = [];
		for (var dx = left; dx <= right; dx++) {
			for (var dy = top; dy <= bottom; dy++) {
				if (!shape || shape(dx, dy, shapeProps)) {
					// TODO: the rule isn't just about shapes
					area.push(this.at(x+dx, y+dy));
				}
			}
		}
		return area;
	}

	canFit(piece, centerSquare, size) {
		size = size || piece.size;
		var area = this.getArea(centerSquare.x, centerSquare.y, size);
		return area.every(function(square) {
			if (!square) {
				return false;
			}
			if (square.terrain == Square.Wall || square.terrain == Square.Pit) {
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
		var area = this.getArea(centerSquare.x, centerSquare.y, size);
		return area.every(function(square) {
			if (!square) {
				return false;
			}
			if (square.terrain == Square.Wall || square.terrain == Square.Pit) {
				return false; // TODO: Depends on movement settings?
			}
			if (square.piece != null && piece != null && square.piece.team != piece.team) {
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
		var area = this.getArea(centerSquare.x, centerSquare.y, size);
		area.forEach(function(square) {
			if (square) square.piece = piece;
		});
	}

	slidePiece(piece, origin, dist, attr) {
		var [dx, dy] = this._getDirection(origin, piece.square);
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
	_getDirection(origin, target) {
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
		if (!piece || !piece.square || piece.parent != this) return;

		if (!piece.moveRange) return;

		var origin = piece.square;
		this._paintMoveRange(origin, piece.moveRange);
		var edges = [origin];
		
		for (var i = 0; i < edges.length; i++) {
			var adjacent = this._getAdjacent(edges[i]);
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
	_paintMoveRange(square, movesLeft) {
		square.el.classList.add('move-range');
		square.el.ondragover = this._allowDrop;
		square.inRange = true;
		square.movesLeft = movesLeft;
	}
	setSkillArea(piece) {
		if (!piece || !piece.user) return;
		var user = piece.user;
		if (!user.square || user.parent != this) return;

		// get the possible range
		var size = 1 + 2*piece.range;
		var area = this.getArea(user.square.x, user.square.y, size, piece.shape, piece.shapeProps);
		area.forEach(square => {
			if (square) this._paintSkillRange(square, piece.validTarget(square));
		});
		// TODO: Do extra if the user is a larger piece?
	}
	_paintSkillRange(square, valid) {
		if (valid) {
			square.el.classList.add('skill-range');
			square.el.ondragover = this._allowDrop;
		} else {
			square.el.classList.add('skill-range-invalid');
		}
		square.inRange = true;
	}
	resetAreas() {
		for (var x = 0; x < this.w; x++) {
			for (var y = 0; y < this.h; y++) {
				var square = this.at(x, y);
				if (square) {
					this._clearPaint(square);
				}
			}
		}
	}
	_clearPaint(square) {
		square.el.classList.remove('deploy-range');
		square.el.classList.remove('move-range');
		square.el.classList.remove('skill-range');
		square.el.classList.remove('skill-range-invalid');
		square.el.ondragover = null;
		square.inRange = null;
		square.movesLeft = null;
	}

	_getAdjacent(square) {
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
				Game.scene.selectSquare(square, elId);
			}
		}
	}
	_click(ev) {
		ev.stopPropagation();
		if (ev.target) {
			var square = ev.target.obj;
			if (square) {
				if (Game.scene) Game.scene.selectSquare(square);
			}
		}
	}
};

/***************************************************
 Game board -> Square
***************************************************/
class Square extends SubContainer {
	constructor(x, y, parent) {
		super(parent);
		this._x = x;
		this._y = y;
		this.piece = null;
		this.terrain = Square.Flat;
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
		}

		this._terrain = value;

		switch (this._terrain) {
			case Square.Wall:
				this.el.classList.add('wall');
				break;
			case Square.Pit:
				this.el.classList.add('pit');
				break;
		}
	}
};
Square.Flat = 0;
Square.Wall = 1;
Square.Pit = 2;

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