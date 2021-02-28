/***************************************************
 Element-Object pair class
 ***************************************************/

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

/***************************************************
 Root Scene class
 ***************************************************/

class Scene extends ElObj {
	constructor() {
		super();
	}

	// init and cleanup
	start() { }
	end() { }

	// handle mouse events
	drop(piece, target) { }
	click(piece, target) { }

	// handle key inputs
	keydown(key) { }
	keyup(key) { }
}

/***************************************************
 Root Container class
 ***************************************************/

class Container extends ElObj {
	constructor(parent) {
		super();
		this.parent = parent;
	}

	// remove a piece remotely
	removePiece(piece) {
		if (!piece || piece.parent != this) return false;
		var parentEl = piece.el.parentElement;
		if (parentEl) parentEl.removeChild(piece.el);
		return true;
	}
};

/***************************************************
 Root Piece class
 ***************************************************/

class Piece extends ElObj {
	constructor(size) {
		super();
		this.parent = null;
		this._size = size || 1;

		// advanced element setup
		this.el.id = Piece.nextId();
		this.el.classList.add('piece');
		this.el.classList.add('x'+this._size); // crude way to set the size

		// drag and drop handling
		this.el.ondragstart = this._drag;
		this.el.ondragend = this._drop;
	}

	// static tracker for element IDs
	static _id = 0;
	static nextId() {
		return "piece" + Piece._id++;
	}

	// size of the piece
	size() { return this._size; }

	// update the parent container
	setParent(container) {
		if (this.parent && this.parent != container) {
			this.parent.removePiece(this);
		}
		this.parent = container;
	}

	// piece can be selected or deselected
	select() { return false; }
	deselect() { }

	// handle drag and drop
	_drag(ev) {
		ev.dataTransfer.setData("text", ev.target.id);
	}
	_drop(ev) {
		ev.dataTransfer.clearData("text");
	}
};

/***************************************************
 Game board class
 ***************************************************/

class Board extends Container {
	constructor(w, h, parent) {
		super(parent);
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

		// get every square in the area
		var area = [];
		for (var x = left; x <= right; x++) {
			for (var y = top; y <= bottom; y++) {
				// TODO: Check if it fits in the shape
				area.push(this.at(x, y));
			}
		}
		return area;
	}

	// check if a piece can fit in an area
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

	// fill in the same piece in several squares
	_fillPiece(piece, centerSquare, size) {
		if (!centerSquare) return;

		size = size || piece.size();
		var area = this.getArea(centerSquare.x, centerSquare.y, size);
		area.forEach(function(square) {
			if (square) square.piece = piece;
		});
	}

	// place a piece on the board (vacates previous position)
	movePiece(piece, targetSquare) {
		if (!piece || !targetSquare) return false;

		// if the piece won't fit, cancel the movement
		if (!this.canFit(piece, targetSquare)) {
			return false;
		}

		// update parent or clear previous position
		if (piece.parent != this) {
			piece.setParent(this);
		} else {
			this._fillPiece(null, piece.square, piece.size());
		}

		// place the piece
		targetSquare.el.appendChild(piece.el);
		piece.square = targetSquare;
		this._fillPiece(piece, targetSquare);

		return true;
	}

	// remove a piece from the board
	removePiece(piece) {
		if (super.removePiece(piece)) {
			this._fillPiece(null, piece.x, piece.y, piece.size());
			return true;
		}
		return false;
	}

	// set up the valid movement area
	setMoveArea(piece) {
		if (!piece || !piece.square) return;

		// add the deselect handler
		this.el.onmousedown = this._click;

		// start with the origin
		var origin = piece.square;
		this._paintSquare(origin);
		var edges = [{ square: origin, range: piece.moveRange() }];

		// expand the edges
		for (var i = 0; i < edges.length; i++) {
			var range = edges[i].range-1;
			var adjacent = this._getAdjacent(edges[i].square);
			// add all adjacent
			for (var n = 0; n < adjacent.length; n++) {
				if (adjacent.inRange) continue;
				if (!this.canFit(piece, adjacent[n])) {
					continue;
				}
				this._paintSquare(adjacent[n]);
				if (range > 0) {
					edges.push({ square: adjacent[n], range: range });
				}
			}
		}
	}

	// mark a square as in-range
	_paintSquare(square) {
		square.el.classList.add('moveRange');
		square.el.ondragover = this._allowDrop;
		square.el.ondrop = this._drop;
		square.inRange = true;
	}

	// get the adjacent squares
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

	// clear all the pathfinding-related paint
	resetMoveArea() {
		for (var x = 0; x < this.w; x++) {
			for (var y = 0; y < this.h; y++) {
				var square = this.at(x, y);
				if (square) {
					square.el.classList.remove('moveRange');
					square.el.ondragover = null;
					square.el.ondrop = null;
					square.inRange = null;
				}
			}
		}
	}

	// event handlers
	_allowDrop(ev) {
		ev.preventDefault();
	}
	_drop(ev) {
		ev.preventDefault();
		if (ev.target) {
			var square = ev.target.obj;
			var scene = square.parent.parent;
			var el = document.getElementById(ev.dataTransfer.getData("text"));
			if (el && scene) {
				var piece = el.obj;
				scene.drop(piece, square);
			}
		}
	}
	_click(ev) {
		ev.stopPropagation();
		if (ev.target) {
			var square = ev.target.obj;
			var scene = square.parent.parent;
			if (scene) scene.click(null, square);
		}
	}
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

/***************************************************
 Moveable piece class
 ***************************************************/

class MoveablePiece extends Piece {
	constructor(type, moveRange, size) {
		super(size);
		this.type = type;
		this._moveRange = moveRange || 3;

		// these will end up being state-dependent, and such
		this.el.classList.add(type);
		this.el.onmousedown = this._click;
	}

	// the piece is now moveable
	moveRange() {
		return this._moveRange;
	}

	// actions on the piece
	select() {
		this.el.draggable = true;
		return true;
	}
	deselect() {
		this.el.draggable = false;
	}

	// event handler functions
	_click(ev) {
		event.stopPropagation();
		var piece = ev.target.obj;
		var scene = piece.parent.parent;
		if (scene) scene.click(piece);
	}
};

/***************************************************
 Battle scene
 ***************************************************/

// Obviously, this is a temporary scene for testing mechanics and stuff
class BattleScene extends Scene {
	constructor() {
		super();
		this.el.classList.add("centered");
		this._createBoard();

		this._selection = null;
	}

	// initialize the board and contents
	_createBoard() { }

	// select a piece to move
	_select(piece) {
		if (this._selection == piece) return false;
		if (!piece.select()) return false;
		if (this._selection != null) this._deselect();

		this._selection = piece;
		this._selection.el.classList.add('selected');
		this._board.setMoveArea(piece);
		return true;
	}

	// clear current selection
	_deselect() {
		if (this._selection) {
			this._selection.deselect();
			this._selection.el.classList.remove('selected');
		}
		this._selection = null;
		this._board.resetMoveArea();
		this._board.el.onmousedown = null;
	}

	// input handlers
	drop(piece, target) {
		if (piece && target && piece == this._selection) {
			if (target.parent.movePiece(piece, target)) {
				this._deselect();
			}
		}
	}

	click(piece, target) {
		// select a piece
		if (piece && !target) {
			this._select(piece);
		}
		// move a selected piece
		if (this._selection && target && !piece) {
			if (!target.inRange) {
				this._deselect();
			} else if (target.parent.movePiece(this._selection, target)) {
				this._deselect();
			}
		}
		// deselect
		if (!piece && !target) {
			this._deselect();
		}
	}

	keydown(key) {
		// cancel selection when hitting escape
		if (this._selection && key === "Escape") {
			this._deselect();
		}
	}
};

/***************************************************
 Test scene
 ***************************************************/

class TestScene extends BattleScene {
	constructor() {
		super();
	}

	_createBoard() {
		this._board = new Board(9, 9, this);
		this._board.movePiece(new MoveablePiece("ball"),        this._board.at(4, 4));
		this._board.movePiece(new MoveablePiece("ball2", 4, 3), this._board.at(4, 6));
		this.el.appendChild(this._board.el);
	}
};

/***************************************************
 Static Game object
 ***************************************************/

function Game() {
	console.log("Game object is static, do not instantiate");
};

Game.scene = function() {
	return this._scene;
};

Game.setScene = function(scene) {
	if (this._scene == scene) return;

	if (this._scene != null) {
		document.body.removeChild(this._scene.el);
		this._scene.end();
	}

	this._scene = scene;
	document.body.appendChild(scene.el);
	this._scene.start();
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

	// TEMPORARY initialize to a test scene
	this.setScene(new TestScene());
};

Game.start();