/****************
 Game board class
 ****************/

class Board {
	// initialize the grid
	constructor (w, h) {
		this._squares = [];
		this.w = w;
		this.h = h;

		var table = document.createElement('table');
		table['data-obj'] = this;
		this.el = table;

		for (var y = 0; y < h; y++) {
			var row = document.createElement('tr');
			for (var x = 0; x < w; x++) {
				var square = this.createSquare(x, y);
				this._squares[(y * this.w) + x] = square;
				row.appendChild(square.el);
			}
			table.appendChild(row);
		}
	}

	// helper method for building squares
	createSquare(x, y) {
		var newSquare = {
			x: x,
			y: y,
			parent: this,
		}
		newSquare.el = document.createElement('td');
		newSquare.el['data-obj'] = newSquare;
		return newSquare;
	}

	keydown(key) {
		if (this.selection && key === "Escape") {
			this.deselect();
		}
	}

	keyup(key) {
		return;
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
	movePiece(obj, x, y) {
		if (!obj) return false;

		// lift it off the previous board space
		if (obj.parent == this) this.fillPiece(null, obj.x, obj.y, obj.size());

		// if the area is occupied, cancel the movement
		if (!this.isClear(x, y, obj.size())) {
			// put it back down
			if (obj.parent == this) this.fillPiece(obj, obj.x, obj.y, obj.size());
			return false;
		}

		// if it was in a previous container, remove it from there
		if (obj.parent != this && obj.parent != null) {
			obj.parent.removePiece(obj);
		}

		// update position
		obj.parent = this;
		obj.x = x;
		obj.y = y;

		// place the piece
		this.at(x, y).el.appendChild(obj.el);
		this.fillPiece(obj, x, y);

		// movement success!
		return true;
	}

	// remove a piece from its previous location
	removePiece(obj) {
		if (!obj || obj.parent != this) return;

		var square = this.at(obj.x, obj.y);
		if (square) {
			oldSquare.el.removeChild(obj.el);
		}
	}

	// select a piece to move
	select(piece) {
		if (this.selection == piece) return false;
		if (!piece.select()) return false;

		this.deselect();

		this.selection = piece;
		this.selection.el.classList.add('selected');
		this.setMoveArea(piece);
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
				}
			}
		}
	}

	// handle drops
	allowDrop(ev) {
		ev.preventDefault();
	}
	dropMove(ev) {
		ev.preventDefault();
		if (ev.target) {
			var square = ev.target['data-obj'];
			var _board = square.parent;
			var el = document.getElementById(ev.dataTransfer.getData("text"));
			if (el) {
				var _piece = el['data-obj'];
				if (_board.selection == _piece) {
					if (_board.movePiece(_piece, square.x, square.y)) {
						_board.deselect();
					}
				}
			}
		}
	}
};

/*********************
 Game piece base class
 *********************/

class Piece {
	constructor(type, moveRange, size) {
		this.parent = null;
		this.type = type;
		this._moveRange = moveRange || 3;
		this._size = size || 1;

		// create the element
		this.el = document.createElement('div');
		this.el.id = Piece.getId();
		this.el['data-obj'] = this;
		this.el.classList.add('piece');
		this.el.classList.add('x'+this._size); // crude way to set the size

		// these will end up being state-dependent, and such
		this.el.classList.add(type);
		this.el.onmousedown = this.click;
	}

	// static tracker for element IDs
	static _count = 0;
	static getId() {
		return "piece" + Piece._count++;
	}

	// properties of the piece
	size() {
		return this._size;
	}
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
		var _piece = ev.target['data-obj'];
		var _board = _piece.parent;
		if (_board) _board.select(_piece);
	}
};

/******************
 Static Game object
 ******************/

function Game() {
	console.log("Game object is static, do not instantiate.");
};

Game.scene = function() {
	return this._scene; // TODO: handle this better?
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
	
	// temporary setup of the first board
	var gameBoard = new Board(9, 9);
	gameBoard.movePiece(new Piece("ball"),        4, 4);
	gameBoard.movePiece(new Piece("ball2", 4, 3), 4, 6);
	this.setScene(gameBoard);
};

Game.start();