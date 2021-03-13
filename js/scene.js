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
		this._initTeams();
		this._uiEl = this._createTopMenu();
		this._board = this._createBoard();
		this._skillList = this._createSkillList(); // TEMP
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

	_createTopMenu() { // TEMP
		var topDiv =  document.createElement("div");
		topDiv.style.display = "flex";

		var undoButton = document.createElement("button");
		undoButton.type = "button";
		undoButton.innerText = "Undo Move";
		undoButton.style.marginRight = "auto";
		undoButton.onclick = () => { // TEMP
			Game.scene._undoMove();
			Game.scene._refreshArea();
		};
		topDiv.appendChild(undoButton);

		var endTurnButton = document.createElement("button");
		endTurnButton.type = "button";
		endTurnButton.innerText = "End Turn";
		endTurnButton.style.marginLeft = "auto";
		endTurnButton.onclick = () => {
			Game.scene.nextTurn();
		};
		topDiv.appendChild(endTurnButton);
		return topDiv;
	}
	_createBoard() { 
		// TODO: Initialize from a "battle map" entity?
		return null; // TEMP
	}
	_createSkillList() {
		return new SkillList();
	}
	_buildDOM() {
		this.el.appendChild(this._uiEl); // TEMP
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
	nextTurn() {
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
		this._refreshArea();
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
	}
	_undoMove() {
		var piece = this._moveStack.pop();
		if (piece) piece.undoMove();
	}
	_clearMoves() {
		this._moveStack = [];
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
		} else { // TODO: require playerphase
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

		if (key == "Spacebar") {
			this.nextTurn();
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