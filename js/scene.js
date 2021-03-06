/***************************************************
 Scene
 The root class that responds to user interaction
 and applies rules to pieces and containers
 ***************************************************/
class Scene extends ElObj {
	constructor() {
		super();
	}

	// init and cleanup
	start() { }
	end() { }

	// handle mouse selections
	selectPiece(piece, dragging) { }
	selectTarget(target, id) { }

	// handle key inputs
	keydown(key) { }
	keyup(key) { }
}

/***************************************************
 Battle scene
 ***************************************************/
class BattleScene extends Scene {
	constructor() {
		super();
		this._board = this._createBoard();
		this._skillList = this._createSkillList();
		this._buildDOM();
	}

	start() {
		this._phase = 1; // player phase
		this._subphase = 0; // unit selection
		this._deselectSkill()
		this._deselectUnit();
		this._clearMoves();
	}

	// TODO: introduce phase / selection tiers to drive the event logic better?

	// initialize the containers
	_createBoard() { 
		// TODO: Initialize from a "battle map" entity?
	}
	_createSkillList() {
		return new SkillList();
	}
	_buildDOM() {
		this.el.appendChild(this._board.el);
		this.el.appendChild(this._skillList.el);
		//this.el.appendChild(newDiv);
	}

	// select a unit
	_selectUnit(piece) {
		if (piece && !piece.select()) return false;
		if (this._skill) this._deselectSkill();
		if (this._unit != piece) this._deselectUnit();

		this._unit = piece;
		this._skillList.setUser(piece);
		return true;
	}
	_deselectUnit() {
		if (this._unit) this._unit.deselect();
		this._unit = null;
		this._skillList.setUser(null);
	}

	// move a unit
	_moveUnit(piece, target) {
		if (target.parent.canFit(piece, target)) {
			this._undoStack.push([piece, piece.square]);
			target.parent.movePiece(piece, target);
			piece.moved = true;
		}
	}
	_undoMove() {
		var move = this._undoStack.pop();
		if (move) {
			move[1].parent.movePiece(move[0], move[1]);
			move[0].moved = false;
		}
	}
	_clearMoves() {
		this._undoStack = [];
	}

	// select a skill
	_selectSkill(piece) {
		if (!piece.select()) return false;
		if (this._skill != piece) this._deselectSkill();

		this._skill = piece;
		return true;
	}
	_deselectSkill() {
		if (this._skill) this._skill.deselect();
		this._skill = null;
	}

	// use a skill
	_useSkill(piece, target) {
		if (piece.use(target)) {
			this._deselectSkill();
			this._clearMoves();
		}
	}

	// update the selection area
	_refreshArea() {
		this._board.resetAreas();

		if (this._skill) {
			this._board.setSkillArea(this._skill);
		} else if (this._unit) {
			this._board.setMoveArea(this._unit);
		}
	}

	// input handlers

	selectPiece(piece, dragging) {
		if (!piece) return;

		if (piece.type() == Piece.Skill) {
			if (this._skill != piece) {
				this._selectSkill(piece);
			} else if (!dragging) {
				this._deselectSkill();
				//this._selectUnit(this._unit);
			}
		} else if (this._skill && piece.square && !dragging) {
			this.selectTarget(piece.square);
			return;
		}

		if (piece.type() == Piece.Unit) {
			if (this._unit != piece) {
				this._selectUnit(piece);
			} else if (!dragging) {
				this._deselectUnit();
			}
		}
		this._refreshArea();
	}

	selectTarget(target, id) {
		if (!target) return;

		if (this._skill && this._skill.idMatch(id)) {
			if (!target.inRange) {
				this._deselectSkill();
			} else {
				this._useSkill(this._skill, target);
			}
		} else if (this._unit && this._unit.idMatch(id)) {
			if (!target.inRange) {
				this._deselectUnit();
			} else {
				this._moveUnit(this._unit, target);
			}
		}
		this._refreshArea();
	}

	keydown(key) {
		// cancel selection when hitting escape or backspace
		if (key == "Escape" || key == "Backspace") {
			if (this._skill) {
				this._deselectSkill();
			} else if (this._unit) {
				this._deselectUnit();
			} else {
				this._undoMove();
			}
			this._refreshArea();
		}
	}
};

/***************************************************
 Test scene
 The current scene used for debugging
 ***************************************************/
class TestScene extends BattleScene {
	constructor() {
		super();
	}

	_createBoard() {
		var board = new Board(9, 9);
		board.movePiece(new ControllablePiece("ball"),     board.at(4, 5));
		board.movePiece(new ControllablePiece("ball2", 2), board.at(4, 4));
		return board;
	}
};