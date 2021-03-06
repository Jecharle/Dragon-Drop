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
		this.parent = parent;
	}
};


/***************************************************
 Game board
 ***************************************************/
class Board extends Container {
	constructor(w, h) {
		super();
		this._squares = [];
		this.w = w;
		this.h = h;

		for (var y = 0; y < h; y++) {
			var row = document.createElement('tr');
			for (var x = 0; x < w; x++) {
				var square = new Square(x, y, this);
				this._squares[(y * this.w) + x] = square;
				row.appendChild(square.el);
			}
			this.el.appendChild(row);
		}

		this.el.onclick = this._click;
		this.el.ondrop = this._drop;
	}

	elType() {
		return 'table';
	}

	at(x, y) {
		if (x == null || x < 0 || x >= this.w) return null;
		if (y == null || y < 0 || y >= this.h) return null;
		if (!this._squares || !this._squares[(y * this.w) + x]) return null;
		return this._squares[(y * this.w) + x];
	}
	getArea(x, y, size, shape) {
		x = x || 0;
		y = y || 0;
		size = Math.max(size || 0, 1);
	
		// calculate edges
		var left = -Math.floor((size-1)/2);
		var right = Math.ceil((size-1)/2);
		var top = -Math.floor((size-1)/2);
		var bottom = Math.ceil((size-1)/2);

		// get every square in the area
		var area = [];
		for (var dx = left; dx <= right; dx++) {
			for (var dy = top; dy <= bottom; dy++) {
				if (!shape || shape(dx, dy, size)) {
					area.push(this.at(x+dx, y+dy));
				}
			}
		}
		return area;
	}

	canFit(piece, centerSquare, size) {
		size = size || piece.size();
		var area = this.getArea(centerSquare.x, centerSquare.y, size);
		var board = this;
		return area.every(function(square) {
			if (!square) return false;
			if (square.piece != null && square.piece != piece) return false;
			// TODO: Check for blocking terrain
			return true;
		});
	}

	movePiece(piece, targetSquare) {
		if (!piece || !targetSquare) return false;

		if (!this.canFit(piece, targetSquare)) {
			return false;
		}

		// update parent or clear previous position
		if (piece.parent != this) {
			piece.setParent(this);
		} else {
			this._fillPiece(null, piece.square, piece.size());
		}

		targetSquare.el.appendChild(piece.el);
		piece.square = targetSquare;
		this._fillPiece(piece, targetSquare);

		return true;
	}

	removePiece(piece) {
		if (super.removePiece(piece)) {
			this._fillPiece(null, piece.x, piece.y, piece.size());
			piece.square = null;
			return true;
		}
		return false;
	}

	setMoveArea(piece) {
		if (!piece || !piece.square || piece.parent != this) return;

		if (!piece.moveRange()) return;

		// start with the origin
		var origin = piece.square;
		this._paintMoveRange(origin, piece.moveRange());
		var edges = [origin];

		// expand the edges
		for (var i = 0; i < edges.length; i++) {
			var adjacent = this._getAdjacent(edges[i]);
			var movesLeft = edges[i].movesLeft-1;
			// add all adjacent
			for (var n = 0; n < adjacent.length; n++) {
				if (adjacent.inRange && adjacent.movesLeft >= movesLeft) {
					continue;
				}
				if (!this.canFit(piece, adjacent[n])) {
					continue;
				}
				this._paintMoveRange(adjacent[n], movesLeft);
				if (movesLeft) {
					edges.push(adjacent[n]);
				}
			}
		}
	}

	setSkillArea(piece) {
		if (!piece || !piece.user) return;
		var user = piece.user;
		if (!user.square || user.parent != this) return;

		// get the possible range
		var range = 1 + 2*piece.range();
		var area = this.getArea(user.square.x, user.square.y, range, piece.shape());
		for (var i = 0; i < area.length; i++) {
			if (area[i]) this._paintSkillRange(area[i]);
		}
		// TODO: Do extra if the user is a larger piece?
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

	_fillPiece(piece, centerSquare, size) {
		if (!centerSquare) return;

		size = size || piece.size();
		var area = this.getArea(centerSquare.x, centerSquare.y, size);
		area.forEach(function(square) {
			if (square) square.piece = piece;
		});
	}

	_paintMoveRange(square, movesLeft) {
		square.el.classList.add('moveRange');
		square.el.ondragover = this._allowDrop;
		square.inRange = true;
		square.movesLeft = movesLeft;
	}
	_paintSkillRange(square) {
		square.el.classList.add('skillRange');
		square.el.ondragover = this._allowDrop;
		square.inRange = true;
	}
	_clearPaint(square) {
		square.el.classList.remove('moveRange');
		square.el.classList.remove('skillRange');
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
	}
	_drop(ev) {
		ev.preventDefault();
		if (ev.target) {
			var square = ev.target.obj;
			square = square.square || square;
			var scene = Game.scene();
			var elId = ev.dataTransfer.getData("text");
			if (scene) {
				scene.selectTarget(square, elId);
			}
		}
	}
	_click(ev) {
		ev.stopPropagation();
		if (ev.target) {
			var square = ev.target.obj;
			if (square) {
				var scene = Game.scene();
				if (scene) scene.selectTarget(square);
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
		this.el.classList.add('square');
		this.x = x;
		this.y = y;
	}

	elType() {
		return 'td';
	}
};

/***************************************************
 Skill list
 ***************************************************/
class SkillList extends Container {
	constructor() {
		super();
		this._user = null;
		this.skills = [];
		this.el.classList.add('skillList');
	}

	setUser(user) {
		this._clearSkills();
		this._user = user;
		if (!user) return false;

		var userSkills = user.skills();
		for (var i = 0; i < userSkills.length; i++) {
			this._addSkill(userSkills[i]);
		}
		return true;
	}

	_addSkill(piece) {
		if (piece) {
			piece.setParent(this);
			this.skills.push(piece);
			this.el.appendChild(piece.el);
		}
	}

	_clearSkills() {
		for (var i = 0; i < this.skills.length; i++) {
			this.removePiece(this.skills[i]);
		}
		this.skills = [];
	}
}