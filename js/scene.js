/***************************************************
 Scene
The root class that responds to user interaction
and applies rules to pieces and containers
***************************************************/
class Scene extends ElObj {
	constructor() {
		super();
	}

	start() { }
	end() { }

	selectPiece(piece, dragging) { }
	selectSquare(target, id) { }

	keydown(key) { }
	keyup(key) { }
}

/***************************************************
 Battle scene
***************************************************/
class BattleScene extends Scene {
	constructor() {
		super();
		this.el.classList.add("vertical");
		this._initTeams();
		this._board = this._createBoard();
		this._skillList = this._createSkillList();

		this._undoButtonEl = this._createUndoButton();
		this._turnTitleEl = this._createTurnTitle();
		this._endTurnButtonEl = this._createEndTurnButton();

		this._buildDOM();
	}

	start() {
		this._turn = 1;
		this._phase = BattleScene.deployPhase;
		this._setActiveTeam(this.playerTeam);

		this._deselectSkill();
		this._deselectUnit();
		this._clearMoves();
		this._refreshArea();
	}

	_createUndoButton() {
		var button = document.createElement("button");
		button.type = "button";
		button.innerText = "Undo Move";
		button.onclick = () => {
			this._undoMove();
			this._refreshArea();
		};
		return button;
	}
	_createTurnTitle() {
		var turnTitle = document.createElement("span");
		turnTitle.innerText = "";
		turnTitle.style.textAlign = "center";
		return turnTitle;
	}
	_createEndTurnButton() {
		var button = document.createElement("button");
		button.type = "button";
		button.innerText = "End Turn";
		button.onclick = () => {
			this._nextTurn();
		};
		return button;
	}

	_createBoard() { 
		// TODO: Initialize from a "battle map" entity?
		return null; // TEMP
	}
	_createSkillList() {
		return new SkillList();
	}
	_buildDOM() {
		var topDiv =  document.createElement("div");
		topDiv.classList.add("top-bar");
		topDiv.appendChild(this._undoButtonEl);
		topDiv.appendChild(this._turnTitleEl);
		topDiv.appendChild(this._endTurnButtonEl);
		this.el.appendChild(topDiv);

		this.el.appendChild(this._board.el);
		this.el.appendChild(this._skillList.el);
	}

	_initTeams() {
		this.playerTeam = [];
		this.enemyTeam = [];
		this._setActiveTeam(null);
	}
	_setActiveTeam(team) {
		if (this._activeTeam) {
			this._activeTeam.forEach(piece => piece.endTurn());
		}
		if (team) {
			team.forEach(piece => piece.startTurn());
		}
		this._activeTeam = team;

	}

	static deployPhase = 0;
	static playerPhase = 1;
	static enemyPhase = 2;
	_nextTurn() {
		this._deselectSkill();
		this._deselectUnit();
		this._clearMoves();
		switch (this._phase) {
			case BattleScene.deployPhase:
				this._phase = BattleScene.playerPhase;
				this._setActiveTeam(this.playerTeam);
				break;

			case BattleScene.playerPhase:
				this._phase = BattleScene.enemyPhase;
				this._setActiveTeam(this.enemyTeam);
				break;

			case BattleScene.enemyPhase:
				this._turn++;
				this._phase = BattleScene.playerPhase;
				this._setActiveTeam(this.playerTeam);
				break;
			
		}
		this._refreshUi();
		this._refreshArea();
	}

	_refreshUi() {
		switch (this._phase) {
			case BattleScene.deployPhase:
				this._turnTitleEl.innerText = "Deployment";
				break;
			case BattleScene.playerPhase:
				this._turnTitleEl.innerText = "Player turn " + this._turn;
				break;
			case BattleScene.enemyPhase:
				this._turnTitleEl.innerText = "Enemy turn " + this._turn;
				break;
			default:
				this._turnTitleEl.innerText = "";
		}

		if (this._moveStack.length > 0) {
			this._undoButtonEl.disabled = false;
		} else {
			this._undoButtonEl.disabled = true;
		}
	}

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

	_moveUnit(piece, square) {
		if (piece.move(square)) {
			this._moveStack.push(piece);
		}
		this._refreshUi();
	}
	_undoMove() {
		var piece = this._moveStack.pop();
		if (piece) piece.undoMove();
		this._refreshUi();
	}
	_clearMoves() {
		this._moveStack = [];
		this._refreshUi();
	}

	_selectUnitDeploy(piece) {
		if (piece && !piece.select()) return false;
		if (this._unit != piece) this._deselectUnit();

		this._unit = piece;
		return true;
	}

	_moveUnitDeploy(piece, square) {
		if (square.piece && square.piece.team == piece.team) {
			this._board.swapPieces(piece, square.piece);
		} else {
			this._board.movePiece(piece, square);
		}
		this._deselectUnit();
	}

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

	_useSkill(piece, square) {
		if (piece.use(square)) {
			this._deselectSkill();
			this._clearMoves();
		}
	}

	_refreshArea() {
		this._board.resetAreas();
		if (this._phase == BattleScene.deployPhase) {
			this._board.setDeployArea();
		} else if (this._skill) {
			this._board.setSkillArea(this._skill);
		} else if (this._unit) {
			this._board.setMoveArea(this._unit);
		}
	}

	selectPiece(piece, dragging) {
		if (!piece) return;

		if (this._phase == BattleScene.deployPhase) {
			if (piece.type == Piece.Unit && piece.team == this.playerTeam) {
				if (!this._unit) {
					this._selectUnitDeploy(piece);
				} else if (!dragging) {
					this.selectSquare(piece.square);
				}
			}
			this._refreshArea();
			return;
		} else { // TODO: once AI works, only work for player phase?
			if (piece.type == Piece.Skill) {
				if (this._skill != piece) {
					this._selectSkill(piece);
				} else if (!dragging) {
					this._deselectSkill();
				}
			} else if (this._skill && piece.square && !dragging) {
				this.selectSquare(piece.square);
				return;
			}

			if (piece.type == Piece.Unit && piece.team == this._activeTeam) {
				if (this._unit != piece) {
					this._selectUnit(piece);
				} else if (!dragging) {
					this._deselectUnit();
				} else if (this._skill) {
					this._deselectSkill();
				}
			}
		}
		this._refreshArea();
	}

	selectSquare(square, id) {
		if (!square) return;

		if (this._phase == BattleScene.deployPhase)
		{
			if (this._unit && this._unit.idMatch(id) && square.inRange) {
				this._moveUnitDeploy(this._unit, square);
			}
			this._deselectUnit();
		} else { // TODO: once AI works, only work for player phase?
			if (!square.inRange) {
				this._deselectSkill();
				this._deselectUnit();
			} else if (this._skill && this._skill.idMatch(id)) {
				this._useSkill(this._skill, square);
			} else if (this._unit && this._unit.idMatch(id)) {
				this._moveUnit(this._unit, square);
			}
		}
		this._refreshArea();
	}

	keydown(key) {
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

		if (key == "Spacebar" || key == " ") { // TEMP
			this._nextTurn();
		}

		if (isFinite(key)) {
			var num = Number(key);
			if (this._skillList.skills && num > 0 && num <= this._skillList.skills.length) {
				if (this._skill != this._skillList.skills[num-1]) {
					this._selectSkill(this._skillList.skills[num-1]);
				} else {
					this._deselectSkill();
				}
				this._refreshArea();
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

	_addPiece(battler, square, team) {
		var newPiece = new ControllablePiece(battler);
		if (team) newPiece.setTeam(team);
		square.parent.movePiece(newPiece, square);
	}

	_createBoard() {
		var board = new Board(9, 9);
		
		this._addPiece(Ball, board.at(5,6), this.playerTeam);
		this._addPiece(Ball3, board.at(3,6), this.playerTeam);

		this._addPiece(Ball2, board.at(4,4), this.enemyTeam);

		return board;
	}

	start() {
		super.start();
	}
};