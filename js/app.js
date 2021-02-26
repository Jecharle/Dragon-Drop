/*************************
 Element-Object pair class
 *************************/

class ElObj {
	constructor() {
		var el = document.createElement(this.elType());
		this.el = el;
		el.obj = this;
	}

	// type of root element
	elType() {
		return 'div';
	}
}

/********************
 Root Container class
 ********************/

class Container extends ElObj {
	constructor() {
		super();
	}

	// remove a piece remotely
	removePiece(piece) {
		if (!piece || piece.parent != this) return false;
		var parentEl = piece.el.parentElement;
		if (parentEl) parentEl.removeChild(piece.el);
		return true;
	}

	// pieces can be selected and deselected
	select(piece) { return false; }
	deselect() { }

	// handle key inputs
	keydown(key) { }
	keyup (key) { }
};

/****************
 Root Piece class
 ****************/

class Piece extends ElObj {
	constructor(size) {
		super();
		this.parent = null;
		this._size = size || 1;
		this.el.id = Piece.nextId();
		this.el.classList.add('piece');
		this.el.classList.add('x'+this._size); // crude way to set the size
	}

	// static tracker for element IDs
	static _id = 0;
	static nextId() {
		return "piece" + Piece._id++;
	}

	// size of the piece
	size() { return this._size; }

	// move the piece between containers
	setParent(container) {
		if (this.parent && this.parent != container) {
			this.parent.removePiece(this);
		}
		this.parent = container;
	}

	// piece can be selected or deselected
	select() { return false; }
	deselect() { }
};

/****************
 Game board class
 ****************/

class Board extends Container {
	constructor (w, h) {
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
	}

	// base element is a table
	elType() {
		return 'table';
	}

	// key event handlers
	keydown(key) {
		if (this.selection && key === "Escape") {
			this.deselect();
		}
	}

	// access the individual grid squares
	at(x, y) {
		if (x == null || x < 0 || x >= this.w) return null;
		if (y == null || y < 0 || y >= this.h) return null;
		if (!this._squares || !this._squares[(y * this.w) + x]) return null;
		return this._squares[(y * this.w) + x];
	}

	// get an array of coordinates in the area centered on the origin
	getArea(x, y, size, shape, direction) {
		x = x || 0;
		y = y || 0;
		size = Math.abs(size) || 1;
		// TODO: default shape is a square
		// TODO: default direction is... none?

		// calculate edges
		var left = x-Math.floor((size-1)/2);
		var right = x+Math.ceil((size-1)/2);
		var top = y-Math.floor((size-1)/2);
		var bottom = y+Math.ceil((size-1)/2);

		// fill in the area
		var area = [];
		for (var x = left; x <= right; x++) {
			for (var y = top; y <= bottom; y++) {
				// TODO: Check if it fits the shape
				area.push({x: x, y: y});
			}
		}
		return area;
	}

	// check if the area is clear and on the board
	isClear(x, y, size, shape, direction) {
		var area = this.getArea(x, y, size, shape, direction);
		var that = this;
		return area.every(function(pos) {
			var square = that.at(pos.x, pos.y);
			if (!square) return false;
			if (square.piece != null) return false;
			// TODO: Check for blocking terrain
			return true;
		});
	}

	// fill in the same piece in several squares
	fillPiece(piece, x, y, size) {
		size = size || piece.size();
		var area = this.getArea(x, y, size);
		var that = this;
		area.forEach(function(pos) {
			var square = that.at(pos.x, pos.y);
			if (square) square.piece = piece;
		});
	}

	// place a piece on the board (vacates previous position)
	movePiece(piece, x, y) {
		if (!piece) return false;

		// lift it off the previous board space
		if (piece.parent == this) this.fillPiece(null, piece.x, piece.y, piece.size());

		// if the area is occupied, cancel the movement
		if (!this.isClear(x, y, piece.size())) {
			// put it back down
			if (piece.parent == this) this.fillPiece(piece, piece.x, piece.y);
			return false;
		}

		// update the parent container
		piece.setParent(this);

		// update position
		piece.x = x;
		piece.y = y;

		// place the piece
		this.at(x, y).el.appendChild(piece.el);
		this.fillPiece(piece, x, y);

		// movement success!
		return true;
	}

	// remove a piece from the board
	removePiece(piece) {
		if (super.removePiece(piece)) {
			this.fillPiece(null, piece.x, piece.y, piece.size());
			return true;
		}
		return false;
	}

	// select a piece to move
	select(piece) {
		if (this.selection == piece) return false;
		if (!piece.select()) return false;

		this.deselect();

		this.selection = piece;
		this.selection.el.classList.add('selected');
		this.setMoveArea(piece);
		this.el.onmousedown = this.clickAway;
		return true;
	}

	// clear current selection
	deselect() {
		if (this.selection) {
			this.selection.deselect();
			this.selection.el.classList.remove('selected');
		}
		this.selection = null;
		this.resetMoveArea();
		this.el.onmousedown = null;
	}

	// set up the valid movement area
	setMoveArea(origin) {
		if (!origin || origin.x == null || origin.y == null) return;

		var range = origin.moveRange();
		// TODO: This will be actual pathfinding stuff
		for (var x = -range; x <= range; x++) {
			for (var y = Math.abs(x)-range; y <= range-Math.abs(x); y++) {
				var square = this.at(origin.x+x, origin.y+y);
				if (square) {
					square.el.classList.add('moveRange');
					square.el.ondragover = this.allowDrop;
					square.el.ondrop = this.dropMove;
					square.el.onmousedown = this.clickMove;
				}
			}
		}
	}

	// clear all the pathfinding-related paint
	resetMoveArea() {
		for (var x = 0; x < this.w; x++) {
			for (var y = 0; y < this.h; y++) {
				var square = this.at(x, y);
				if (square) {
					square.el.classList.remove('moveRange');
					square.el.ondragover = null;
					square.el.ondrop = null;
					square.el.onmousedown = null;
				}
			}
		}
	}

	// handle events
	allowDrop(ev) {
		ev.preventDefault();
	}
	dropMove(ev) {
		ev.preventDefault();
		if (ev.target) {
			var square = ev.target['data-obj'];
			var square = ev.target.obj;
			var _board = square.parent;
			var el = document.getElementById(ev.dataTransfer.getData("text"));
			if (el) {
				var _piece = el.obj;
				if (_board.selection == _piece) {
					if (_board.movePiece(_piece, square.x, square.y)) {
						_board.deselect();
					}
				}
			}
		}
	}
	clickAway(ev) {
		ev.currentTarget['data-obj'].deselect();
		ev.currentTarget.obj.deselect();
	};
	clickMove(ev) {
		ev.stopPropagation();
		// TODO: Apply movement, similar to a drop
	};
};

// bonus Square class
class Square extends ElObj {
	constructor(x, y, parent) {
		super();
		this.x = x;
		this.y = y;
		this.parent = parent;
	}

	// base element is a table cell
	elType() {
		return 'td';
	}
};

/********************
 Moveable piece class
 ********************/

class MoveablePiece extends Piece {
	constructor(type, moveRange, size) {
		super(size);
		this.type = type;
		this._moveRange = moveRange || 3;

		// these will end up being state-dependent, and such
		this.el.classList.add(type);
		this.el.onmousedown = this.click;
	}

	// the piece is now moveable
	moveRange() {
		return this._moveRange;
	}

	// actions on the piece
	select() {
		this.el.draggable = true;
		this.el.ondragstart = this.pickUp;
		this.el.ondragend = this.putDown;
		return true;
	}
	deselect() {
		this.el.draggable = false;
		this.el.ondragstart = null;
		this.el.ondragend = null;
	}

	// event handler functions
	pickUp(ev) {
		ev.dataTransfer.setData("text", ev.target.id);
	}
	putDown(ev) {
		ev.dataTransfer.clearData("text");
	}
	click(ev) {
		event.stopPropagation();
		var _piece = ev.target.obj;
		var _board = _piece.parent;
		if (_board) _board.select(_piece);
	}
};

/******************
 Static Game object
 ******************/

function Game() {
	console.log("Game object is static, do not instantiate");
};

Game.scene = function() {
	return this._scene;
};

Game.setScene = function(scene) {
	// TODO: Clear out the previous scene...?
	this._scene = scene;
	document.getElementById("canvas").appendChild(scene.el);
};

Game.globalKeydown = function(ev) {
	var active = Game.scene();
	if (active) active.keydown(ev.key);
};

Game.globalKeyup = function(ev) {
	var active = Game.scene();
	if (active) active.keydown(ev.key);
};

Game.start = function() {
	document.addEventListener('keydown', Game.globalKeydown);
	document.addEventListener('keyup', Game.globalKeyup);
	
	// TEMPORARY setup of the first board and some pieces
	var gameBoard = new Board(9, 9);
	gameBoard.movePiece(new MoveablePiece("ball"),        4, 4);
	gameBoard.movePiece(new MoveablePiece("ball2", 4, 3), 4, 6);
	this.setScene(gameBoard);
};

Game.start();