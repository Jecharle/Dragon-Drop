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
		this._containers = [];
	}

	// init and cleanup
	start() { }
	end() { }

	// track the containers in the scene
	containers() {
		return this._containers;
	}
	addContainer(container) {
		this._containers.push(container);
		this.el.appendChild(container.el);
	}

	// handle key inputs
	keydown(key) {
		this._containers.forEach(function(container) {
			container.keydown(key);
		});
	}
	keyup(key) {
		this._containers.forEach(function(container) {
			container.keyup(key);
		});
	}
}

/***************************************************
 Root Container class
 ***************************************************/

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
		this.el.ondragstart = this.drag;
		this.el.ondragend = this.drop;
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

	// handle drag and drop
	drag(ev) {
		ev.dataTransfer.setData("text", ev.target.id);
	}
	drop(ev) {
		ev.dataTransfer.clearData("text");
	}
};

/***************************************************
 Game board class
 ***************************************************/

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
				// TODO: Check if it fits in the shape
				area.push(this.at(x, y));
			}
		}
		return area;
	}

	// check if a piece can fit in an area
	canFit(piece, x, y, size) {
		size = size || piece.size();
		var area = this.getArea(x, y, size);
		var board = this;
		return area.every(function(square) {
			if (!square) return false;
			if (square.piece != null && square.piece != piece) return false;
			// TODO: Check for blocking terrain
			return true;
		});
	}

	// fill in the same piece in several squares
	_fillPiece(piece, x, y, size) {
		size = size || piece.size();
		var area = this.getArea(x, y, size);
		area.forEach(function(square) {
			if (square) square.piece = piece;
		});
	}

	// place a piece on the board (vacates previous position)
	movePiece(piece, x, y) {
		if (!piece) return false;

		// if the area is occupied, cancel the movement
		if (!this.canFit(piece, x, y)) {
			return false;
		}

		// remove from the previous space on the board
		if (piece.parent == this) this._fillPiece(null, piece.x, piece.y, piece.size());

		// update the parent container
		piece.setParent(this);

		// update position
		piece.x = x;
		piece.y = y;

		// place the piece
		this.at(x, y).el.appendChild(piece.el);
		this._fillPiece(piece, x, y);

		// movement success!
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
	setMoveArea(piece) {
		if (!piece || piece.x == null || piece.y == null) return;

		// start with the origin
		var origin = this.at(piece.x, piece.y);
		this._paintSquare(origin);
		var edges = [{ square: origin, range: piece.moveRange() }];

		// expand the edges
		for (var i = 0; i < edges.length; i++) {
			var range = edges[i].range-1;
			var adjacent = this._getAdjacent(edges[i].square);
			// add all adjacent
			for (var n = 0; n < adjacent.length; n++) {
				if (!this.canFit(piece, adjacent[n].x, adjacent[n].y)) {
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
		square.el.ondragover = this.allowDrop;
		square.el.ondrop = this.dropMove;
		square.el.onmousedown = this.clickMove;
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
					square.el.onmousedown = null;
					square.inRange = null;
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
		ev.stopPropagation();
		ev.currentTarget.obj.deselect();
	};
	clickMove(ev) {
		ev.stopPropagation();
		if (ev.target) {
			var square = ev.target.obj;
			var _board = square.parent;
			var _piece = _board.selection;
			if (_board.movePiece(_piece, square.x, square.y)) {
				_board.deselect();
			}
		}
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
		this.el.onmousedown = this.click;
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
	click(ev) {
		event.stopPropagation();
		var _piece = ev.target.obj;
		var _board = _piece.parent;
		if (_board) _board.select(_piece);
	}
};

/***************************************************
 Test scene
 ***************************************************/

class TestScene extends Scene {
	constructor() {
		super();
		var gameBoard = new Board(9, 9);
		gameBoard.movePiece(new MoveablePiece("ball"),        4, 4);
		gameBoard.movePiece(new MoveablePiece("ball2", 4, 3), 4, 6);
		this.addContainer(gameBoard);
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
		document.getElementById("canvas").removeChild(this._scene.el);
		this._scene.end();
	}

	this._scene = scene;
	document.getElementById("canvas").appendChild(scene.el);
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