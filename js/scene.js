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

		this._deselectTarget();
		this._deselectSkill();
		this._deselectUnit();
		this._clearMoves();
		this._refresh();
	}

	_createUndoButton() {
		var button = document.createElement("button");
		button.type = "button";
		button.innerText = "Undo Move";
		button.onclick = () => {
			this._undoMove();
			this._refresh();
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
		return new Board(); // TEMP
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

	_refresh() {
		this._refreshArea();
		this._refreshUi();
	}

	static deployPhase = 0;
	static playerPhase = 1;
	static enemyPhase = 2;
	_nextTurn() {
		switch (this._phase) {
			case BattleScene.deployPhase:
				this._phase = BattleScene.playerPhase;
				this._setActiveTeam(this.playerTeam);
				this._canRedeploy = true;
				break;

			case BattleScene.playerPhase:
				this._phase = BattleScene.enemyPhase;
				this._setActiveTeam(this.enemyTeam);
				this._canRedeploy = false;
				break;

			case BattleScene.enemyPhase:
				this._turn++;
				this._phase = BattleScene.playerPhase;
				this._setActiveTeam(this.playerTeam);
				this._canRedeploy = false;
				break;
			
		}
		this._deselectTarget();
		this._deselectSkill();
		this._deselectUnit();
		this._clearMoves();
		this._refresh();
	}
	_redeploy() {
		this._canRedeploy = false;
		this._phase = BattleScene.deployPhase;
		this._setActiveTeam(this.playerTeam);

		this._deselectTarget();
		this._deselectSkill();
		this._deselectUnit();
		this._clearMoves();
		this._refresh();
	}

	_refreshUi() {
		switch (this._phase) {
			case BattleScene.deployPhase:
				this._turnTitleEl.innerText = "Deployment";
				this._endTurnButtonEl.innerText = "Start Battle";
				break;
			case BattleScene.playerPhase:
				this._turnTitleEl.innerText = "Player turn " + this._turn;
				this._endTurnButtonEl.innerText = "End Turn";
				break;
			case BattleScene.enemyPhase:
				this._turnTitleEl.innerText = "Enemy turn " + this._turn;
				this._endTurnButtonEl.innerText = "End Turn";
				break;
			default:
				this._turnTitleEl.innerText = "";
		}

		if (this._moveStack.length > 0) {
			this._undoButtonEl.disabled = false;
			this._undoButtonEl.innerText = "Undo Move";
		} else if (this._canRedeploy) {
			this._undoButtonEl.disabled = false;
			this._undoButtonEl.innerText = "Redeploy";
		} else {
			this._undoButtonEl.disabled = true;
			this._undoButtonEl.innerText = "Undo Move";
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
	}
	_undoMove() {
		var piece = this._moveStack.pop();
		if (piece) {
			piece.undoMove();
		} else if (this._canRedeploy) {
			this._redeploy();
		}
	}
	_clearMoves() {
		this._moveStack = [];
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
			this._canRedeploy = false;
			this._clearMoves();
		}
	}

	_selectTarget(square) {
		this._target = square;
		this._target.el.classList.add('selected'); // TEMP
		return true;
	}
	_deselectTarget() {
		if (this._target) {
			this._target.el.classList.remove('selected'); // TEMP
		}
		this._target = null;
	}
	_swapDeploySquares(square1, square2) {
		if (square1.piece && square2.piece) {
			this._board.swapPieces(square1.piece, square2.piece);
		} else if (square1.piece && !square2.piece) {
			this._board.movePiece(square1.piece, square2);
		} else if (!square1.piece && square2.piece) {
			this._board.movePiece(square2.piece, square1);
		}
		this._deselectTarget();
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
			if (piece.square) {
				if (piece.square.inRange && dragging) {
					this._deselectTarget();
				}
				this.selectSquare(piece.square);
			}
		} else { // TODO: once AI works, only run for player phase
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

			if (piece.type == Piece.Unit && piece.myTurn) {
				if (this._unit != piece) {
					this._selectUnit(piece);
				} else if (!dragging) {
					this._deselectUnit();
				} else if (this._skill) {
					this._deselectSkill();
				}
			}
		}
		this._refresh();
	}

	selectSquare(square, dragId) {
		if (!square) return;

		if (this._phase == BattleScene.deployPhase)
		{
			if (square.inRange && this._target) {
				this._swapDeploySquares(this._target, square);
			} else if (square.inRange) {
				this._selectTarget(square);
			} else {
				this._deselectTarget();
			}
		} else { // TODO: once AI works, only run for player phase
			if (!square.inRange) {
				this._deselectSkill();
				this._deselectUnit();
			} else if (this._skill && this._skill.idMatch(dragId)) {
				this._useSkill(this._skill, square);
			} else if (this._unit && this._unit.idMatch(dragId)) {
				this._moveUnit(this._unit, square);
			}
		}
		this._refresh();
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
			this._refresh();
		}

		if (key == "Spacebar" || key == " " || key == "Enter") { // TEMP?
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
				this._refresh();
			} else if (num == 0) {
				this._deselectSkill();
				this._refresh();
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

	_addPiece(piece, square, team) {
		if (team) piece.setTeam(team);
		if (square) square.parent.movePiece(piece, square);
	}
	addPlayer(piece, board) {
		var index = this.playerTeam.length;
		var square = board.deployArea[index];
		
		this._addPiece(piece, square, this.playerTeam);
	}
	addEnemy(piece, square) {
		this._addPiece(piece, square, this.enemyTeam);
	}

	// TODO: This is actually similar to how I want to load in maps, I think
	_createBoard() {
		var board = super._createBoard();
		
		board.addDeploySquare(board.at(2,5));
		board.addDeploySquare(board.at(3,5));
		board.addDeploySquare(board.at(4,5));
		board.addDeploySquare(board.at(5,5));

		this.addPlayer(new TestMeleeUnit(), board);
		this.addPlayer(new TestSupportUnit(), board);

		this.addEnemy(new TestEnemyUnit(), board.at(3,3));

		return board;
	}

	start() {
		super.start();
	}
};