/***************************************************
 Scene
The root class that responds to user interaction
and applies rules to pieces and containers
***************************************************/
class Scene extends ElObj {
	constructor(lastScene) {
		super();
		this._lastScene = lastScene || null;
	}

	get lastScene() {
		this._lastScene;
	}

	get unsaved() {
		return false;
	}

	start() { }
	end() { }

	selectPiece(piece, dragging) { }
	selectSquare(square, dragId) { }

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

	get unsaved() {
		return true;
	}

	start() {
		this._deselectTarget();
		this._deselectSkill();
		this._deselectUnit();
		this._clearMoves();

		this._turn = 1;
		this._phase = BattleScene.deployPhase;
		this._setActiveTeam(this.playerTeam);

		this.refresh();
	}

	_createUndoButton() {
		var button = document.createElement("button");
		button.type = "button";
		button.onclick = () => {
			this._undoMove();
			this.refresh();
		};
		return button;
	}
	_createTurnTitle() {
		var turnTitle = document.createElement("span");
		turnTitle.style.textAlign = "center";
		return turnTitle;
	}
	_createEndTurnButton() {
		var button = document.createElement("button");
		button.type = "button";
		button.onclick = () => {
			this._nextTurn();
		};
		return button;
	}

	_createBoard() { 
		return new Board(); // TEMP?
	}
	_createSkillList() {
		return new SkillList();
	}
	_buildDOM() {
		var navBar =  document.createElement("div");
		navBar.classList.add("nav-bar");
		navBar.appendChild(this._undoButtonEl);
		navBar.appendChild(this._turnTitleEl);
		navBar.appendChild(this._endTurnButtonEl);
		this.el.appendChild(navBar);

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

	refresh() {
		this._refreshArea();
		this._refreshUi();
	}

	static deployPhase = 0;
	static playerPhase = 1;
	static enemyPhase = 2;
	_nextTurn() {
		this._deselectTarget();
		this._deselectSkill();
		this._deselectUnit();
		this._clearMoves();
		switch (this._phase) {
			case BattleScene.deployPhase:
				this._phase = BattleScene.playerPhase;
				this._setActiveTeam(this.playerTeam);
				this._canRedeploy = true;
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
		this.refresh();
	}
	_redeploy() {
		this._phase = BattleScene.deployPhase;
		this._setActiveTeam(this.playerTeam);

		this._deselectTarget();
		this._deselectSkill();
		this._deselectUnit();
		this._clearMoves();
		this.refresh();
	}

	_refreshUi() {
		switch (this._phase) {
			case BattleScene.deployPhase:
				this._turnTitleEl.innerText = "Deployment";
				this._endTurnButtonEl.innerText = "Start Battle";
				this._undoButtonEl.style.visibility = "hidden";
				break;
			case BattleScene.playerPhase:
				this._turnTitleEl.innerText = "Player turn " + this._turn;
				this._endTurnButtonEl.innerText = "End Turn";
				this._undoButtonEl.style.visibility = "visible";
				break;
			case BattleScene.enemyPhase:
				this._turnTitleEl.innerText = "Enemy turn " + this._turn;
				this._endTurnButtonEl.innerText = "End Turn";
				this._undoButtonEl.style.visibility = "visible";
				break;
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
		this._canRedeploy = false;
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
		this.refresh();
	}

	selectSquare(square, dragId) {
		if (!square) return;

		if (this._phase == BattleScene.deployPhase)
		{
			if (!square.inRange) {
				this._deselectTarget();
			}
			else if (this._target) {
				this._swapDeploySquares(this._target, square);
			} else {
				this._selectTarget(square);
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
		this.refresh();
	}

	keydown(key) {
		if (key == "Escape" || key == "Backspace") {
			if (this._target) {
				this._deselectTarget();
			} else if (this._skill) {
				this._deselectSkill();
			} else if (this._unit) {
				this._deselectUnit();
			} else {
				this._undoMove();
			}
			this.refresh();
		}

		if (key == "Spacebar" || key == " " || key == "Enter") { // TEMP?
			this._nextTurn();
		}

		if (isFinite(key)) {
			var num = Number(key);
			var skills = this._skillList.skills;
			if (num == 0 || this._skill == skills[num-1]) {
				this._deselectSkill();
				this.refresh();
			} else if (skills && num <= skills.length) {
				this._selectSkill(skills[num-1]);
				this.refresh();
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