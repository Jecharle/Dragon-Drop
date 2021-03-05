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
		this.el.classList.add("centered");
		this._createBoard();
		this._createSkillList();
	}

	start() {
		this._phase = 1; // player phase
		this._subphase = 0; // unit selection
		this._deselectSkill()
		this._deselectMove();
		this._clearMoves();
	}

	// TODO: introduce phase / selection tiers to drive the event logic better?

	// initialize the containers
	_createBoard() { 
		// TODO: Initialize from a "battle map" entity?
	}
	_createSkillList() {
		this._skillList = new SkillList();
		this.el.appendChild(this._skillList.el);
	}

	// select a piece to move
	_selectMove(piece) {
		if (!piece.select()) return false;
		if (this._skill) this._deselectSkill();
		if (this._unit != piece) this._deselectMove();

		this._unit = piece;
		this._skillList.setUser(piece);
		return true;
	}
	_deselectMove() {
		if (this._unit) this._unit.deselect();
		this._unit = null;
		this._skillList.setUser(null);
	}

	// select a skill piece
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

	// update the selection area
	_refreshArea() {
		this._board.resetAreas();

		if (this._skill) {
			this._board.setSkillArea(this._skill);
		} else if (this._unit) {
			this._board.setMoveArea(this._unit);
		}
	}

	// undo movement
	_addMove(piece) {
		this._undoStack.push([piece, piece.square]);
	}
	_undoMove() {
		var move = this._undoStack.pop();
		if (move) move[1].parent.movePiece(move[0], move[1]);
	}
	_clearMoves() {
		this._undoStack = [];
	}

	// input handlers

	selectPiece(piece, dragging) {
		if (!piece) return;

		// select a skill
		if (piece.action() == "skill") {
			if (this._skill != piece) {
				this._selectSkill(piece);
			} else if (!dragging) {
				this._deselectSkill();
				this._selectMove(this._unit);
			}
		} else if (this._skill && !dragging && piece.square) {
			// we're targeting a skill and wanted the piece's square
			this.selectTarget(piece.square);
			return;
		}

		// select a moving unit
		if (piece.action() == "move") {
			if (this._unit != piece) {
				this._selectMove(piece);
			} else if (!dragging) {
				this._deselectMove();
			}
		}
		this._refreshArea();
	}

	selectTarget(target, id) {
		if (!target) return;

		// targeting skills
		if (this._skill && this._skill.idMatch(id)) {
			if (!target.inRange
				|| this._skill.use(target)) {
				this._deselectSkill();
				this._clearMoves();
			}
		}
		// moving units
		else if (this._unit && this._unit.idMatch(id)) {
			if (!target.inRange) {
				this._deselectMove();
			} else if (target.parent.canFit(this._unit, target)) {
				this._addMove(this._unit);
				target.parent.movePiece(this._unit, target)
			}
		}
		this._refreshArea();
	}

	keydown(key) {
		// cancel selection when hitting escape
		if (key === "Escape") {
			if (this._skill) {
				this._deselectSkill();
			} else if (this._unit) {
				this._deselectMove();
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
		this._board = new Board(9, 9);
		this._board.movePiece(new ControllablePiece("ball"),     this._board.at(4, 5));
		this._board.movePiece(new ControllablePiece("ball2", 2), this._board.at(4, 4));
		this.el.appendChild(this._board.el);
	}
};