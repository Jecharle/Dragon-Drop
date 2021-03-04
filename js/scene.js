/***************************************************
 Scene
 The root class that responds to user interaction
 and applies mechanics to the containers inside it
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
	selectTarget(target, piece) { }

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

		this._unit = null;
		this._skill = null;
	}

	// initialize the containers
	_createBoard() { 

	}
	_createSkillList() {
		this._skillList = new SkillList();
		this.el.appendChild(this._skillList.el);
	}

	// select a piece to move
	_selectMove(piece) {
		if (!piece.select()) return false;
		if (this._skill) this._deselectSkill();
		if (this._unit) this._deselectMove();

		this._unit = piece;
		this._unit.el.classList.add('selected');
		this._board.setMoveArea(piece);
		this._skillList.setUser(piece);
		return true;
	}
	_deselectMove() {
		if (this._unit) {
			this._unit.deselect();
			this._unit.el.classList.remove('selected');
		}
		this._unit = null;
		this._board.resetAreas();
		this._skillList.setUser();
	}

	// select a skill piece
	_selectSkill(piece) {
		if (!piece.select()) return false;
		if (this._skill) this._deselectSkill();

		this._skill = piece;
		this._skill.el.classList.add('selected');
		this._board.setSkillArea(piece);
		return true;
	}
	_deselectSkill() {
		if (!this._skill) return;
		this._skill.deselect();
		this._skill.el.classList.remove('selected');
		this._skill = null;
	}

	// input handlers

	selectPiece(piece, dragging) {
		if (!piece) return;

		// TODO: handle selection by piece type and current context
		// TODO: If you've got a skill selected, you MIGHT actually be targeting

		// select a skill
		if (piece.action() == "skill") {
			if (this._skill != piece) {
				this._selectSkill(piece);
			} else if (!dragging) {
				this._deselectSkill();
				this._selectMove(this._unit);
			}
		} else if (this._skill && !dragging && piece.targetable) {
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
	}

	selectTarget(target, id) {
		if (!target) return;

		// TODO: handle target by selected piece type and current context

		// targeting skills
		if (this._skill && (!id || id == this._skill.el.id)) {
			if (!target.inRange
				|| this._skill.use(target)) {
				this._deselectSkill();
				this._selectMove(this._unit);
			}
		}
		// moving units
		else if (this._unit && (!id || id == this._unit.el.id)) {
			if (!target.inRange) {
				this._deselectMove();
			} else if (target.parent.movePiece(this._unit, target)) {
				this._selectMove(this._unit); // TODO: Refresh move range
			}
		}
	}

	keydown(key) {
		// cancel selection when hitting escape
		if (key === "Escape") {
			if (this._skill) {
				this._deselectSkill();
				this._selectMove(this._unit);
			} else if (this._unit) {
				this._deselectMove();
			}
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
		this._board.movePiece(new ControllablePiece("ball2", 0), this._board.at(4, 4));
		this.el.appendChild(this._board.el);
	}
};