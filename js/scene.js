/***************************************************
 Scene
The root class that responds to user interaction
and applies rules to pieces and containers
***************************************************/
class Scene extends ElObj {
	constructor(lastScene) {
		super();
		this._lastScene = lastScene || null;
		this._dataIn = null;
	}

	get lastScene() {
		this._lastScene;
	}

	get unsaved() {
		return false;
	}

	start() { }
	end() { }

	sendData(data) {
		this._dataIn = data;
	}

	selectPiece(piece, dragging) { }
	selectPosition(position, dragId) { }
	mouseEnter(position, dragId) { }
	mouseLeave(position, dragId) { }

	keydown(key) { }
	keyup(key) { }
}

/***************************************************
 Battle scene
***************************************************/
class BattleScene extends Scene {
	constructor(mapModel, party) {
		super();
		this._initTeams();
		this._board = this._createBoard();
		this._skillList = this._createSkillList();

		this._applyMapModel(mapModel);
		this._addParty(party); // TODO: Load the party from elsewhere?

		this._undoButtonEl = this._createUndoButton();
		this._turnTitleEl = this._createTurnTitle();
		this._endTurnButtonEl = this._createEndTurnButton();

		this._buildDOM();
	}

	get unsaved() {
		return true;
	}

	start() {
		this._deploy();
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
			this._endTurn();
		};
		return button;
	}
	_createBoard() { 
		return new Board();
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
		this.playerTeam = new Team(0);
		this.enemyTeam = new Team(1);
		this._setActiveTeam(null);
	}
	_setActiveTeam(team) {
		if (this._activeTeam) {
			this._activeTeam.endTurn();
		}
		this._activeTeam = team;
		if (this._activeTeam) {
			this._activeTeam.startTurn();
		}
	}

	_applyMapModel(mapModel) {
		if (!mapModel) return;

		this._board.applyMapModel(mapModel);

		this._reinforcements = [];
		mapModel.pieces.forEach(data => {
			if (data.turn > 0) this._reinforcements.push(data);
			else this._addUnit(data);
		});

		this._maxTurns = mapModel.maxTurns;
		this._minTurns = mapModel.minTurns;
		this._defaultVictory = mapModel.defaultVictory;
	}
	_addUnit(data) {
		var newPiece = new data.type();
		if (this._board.movePiece(newPiece, this._board.at(data.x, data.y))) {
			if (data.enemy) newPiece.setTeam(this.enemyTeam);
			return true;
		}
		return false;
	}

	_addParty(party) {
		if (!party) return;

		party.forEach(piece => {
			var index = this.playerTeam.size;
			var square = this._board.deployArea[index];
			if (square) this._board.movePiece(piece, square);
			piece.setTeam(this.playerTeam);
		});
	}
	_addReinforcements() {
		// this removes the data for anything successfully added
		this._reinforcements = this._reinforcements.filter(data => {
			if (data.turn <= this._turn) {
				return !this._addUnit(data);
			}
			return true;
		});
	}

	refresh() {
		this._refreshArea();
		this._refreshUi();
	}

	_deploy() {
		this._turn = 1;
		this._phase = BattleScene.DeployPhase;
		this._setActiveTeam(null);

		this._deselectSkill();
		this._deselectUnit();
		this._clearMoves();
		this.refresh();
	}
	_endTurn() {
		this._deselectSkill();
		this._deselectUnit();
		this._clearMoves();
		switch (this._phase) {
			case BattleScene.DeployPhase:
				this._phase = BattleScene.PlayerPhase;
				this._canRedeploy = true;
				break;

			case BattleScene.PlayerPhase:
				this._phase = BattleScene.EnemyPhase;
				break;

			case BattleScene.EnemyPhase:
				this._phase = BattleScene.PlayerPhase;
				this._turn++;
				this._checkForEnd();
				break;
		}
		this._startTurn();
	}
	_startTurn() {
		switch (this._phase) {
			case BattleScene.PlayerPhase:
				this._setActiveTeam(this.playerTeam);
				this._showPhaseBanner("Turn "+this._turn);
				break;

			case BattleScene.EnemyPhase:
				this._setActiveTeam(this.enemyTeam);
				this._addReinforcements(); // TEMP?
				this._showPhaseBanner("Enemy Phase");
				break;
		}
		this.refresh();
	}

	_checkForEnd() {
		if (this.playerTeam.size <= 0) {
			this._lose();
			return true;
		} else if (this.enemyTeam.size <= 0 && this._turn >= this._minTurns) {
			this._win();
			return true;
		}

		if (this._maxTurns && this._turn > this._maxTurns) {
			if (this._defaultVictory) {
				this._win();
			} else {
				this._lose();
			}
			return true;
		}

		return false;
	}
	_win() {
		this._phase = BattleScene.EndPhase;
		this._setActiveTeam(null);
		this._showPhaseBanner("Victory");

		// TODO: Do I actually need all of this?
		this._deselectSkill();
		this._deselectUnit();
		this._clearMoves();
		this.refresh();

		if (this.lastScene) this.lastScene.sendData({ victory: true });
		setTimeout(() => { alert("The battle is now over"); }, 1900); // TEMP
		// TODO: End the scene after that?
	}
	_lose() {
		this._phase = BattleScene.EndPhase;
		this._setActiveTeam(null);
		this._showPhaseBanner("Defeat");

		// TODO: Do I actually need all of this?
		this._deselectSkill();
		this._deselectUnit();
		this._clearMoves();
		this.refresh();

		if (this.lastScene) this.lastScene.sendData({ victory: false });
		setTimeout(() => { alert("The battle is now over"); }, 1900); // TEMP
		// TODO: End the scene after that?
	}

	_showPhaseBanner(value) {
		var banner = new PhaseBanner(value);
		this.el.appendChild(banner.el);
	}

	_refreshUi() {
		// turn counter
		if (this._phase == BattleScene.DeployPhase) {
			this._turnTitleEl.innerText = "";
		} else if (this._maxTurns && this._turn >= this._maxTurns) {
			this._turnTitleEl.innerText = "Last turn";
		} else if (this._maxTurns) {
			this._turnTitleEl.innerText = (1 + this._maxTurns - this._turn)+" turns left";
		} else {
			this._turnTitleEl.innerText = "Turn " + this._turn;
		}

		// button display
		if (this._phase == BattleScene.DeployPhase) {
			this._endTurnButtonEl.innerText = "Start Battle";
			this._undoButtonEl.style.visibility = "hidden";
		} else {
			this._endTurnButtonEl.innerText = "End Turn";
			this._undoButtonEl.style.visibility = "visible";
		}

		// enable / disable the undo button
		if (this._lastMove != null) {
			this._undoButtonEl.disabled = false;
			this._undoButtonEl.innerText = "Undo";
		} else if (this._canRedeploy) {
			this._undoButtonEl.disabled = false;
			this._undoButtonEl.innerText = "Switch";
		} else {
			this._undoButtonEl.disabled = true;
			this._undoButtonEl.innerText = "Undo";
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
			if (piece != this._lastMove) {
				this._moveStack.push(piece);
			} else if (!piece.moved) {
				this._moveStack.pop();
				this._deselectUnit();
			}
		}
	}
	_undoMove() {
		var piece = this._moveStack.pop();
		if (piece) {
			piece.undoMove();
		} else if (this._canRedeploy) {
			this._deploy();
		}
	}
	_clearMoves() {
		this._moveStack = [];
		this._canRedeploy = false;
	}
	get _lastMove() {
		if (this._moveStack.length > 0) return this._moveStack[this._moveStack.length-1];
		else return null;
	}

	_selectSkill(piece) {
		if (!piece.select()) return false;
		if (this._skill != piece) this._deselectSkill();

		this._skill = piece;
		return true;
	}
	_deselectSkill() {
		this._deselectTarget();
		if (this._skill) this._skill.deselect();
		this._skill = null;
	}
	_useSkill(piece, square) {
		if (piece.use(square)) {
			this._deselectSkill();
			this._clearMoves();
			this._checkForEnd(); // TEMP?
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
		this._board.clearAoE();
		this._board.resetAreas();
		if (this._phase == BattleScene.DeployPhase) {
			this._board.setDeployArea();
		} else if (this._skill) {
			this._board.setSkillArea(this._skill);
			if (this._target) {
				this._board.showAoE(this._skill, this._target);
			}
		} else if (this._unit && !this._unit.moved) {
			this._board.setMoveArea(this._unit);
		} else if (this._unit && this._lastMove == this._unit) {
			this._board.setMoveArea(this._unit);
		}
	}

	selectPiece(piece, dragging) {
		if (!piece) return;

		if (this._phase == BattleScene.DeployPhase) {
			if (piece.square) {
				if (piece.square.inRange && dragging) {
					this._deselectTarget();
				}
				this.selectPosition(piece.square);
			}
		} else { // TODO: once AI works, only run for player phase
			if (piece.type == Piece.Skill) {
				if (this._skill != piece) {
					this._selectSkill(piece);
				} else if (!dragging) {
					this._deselectSkill();
				}
			} else if (this._skill && piece.square && !dragging) {
				this.selectPosition(piece.square);
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
		this._dragging = dragging;
		this.refresh();
	}
	selectPosition(square, dragId) {
		if (!square) return;

		if (this._phase == BattleScene.DeployPhase)
		{
			if (!square.inRange) {
				this._deselectTarget();
			} else if (this._target) {
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
		this._dragging = false;
		this.refresh();
	}

	mouseEnter(position, dragId) {
		if (this._skill && this._skill.idMatch(dragId)) {
			// TODO: don't trigger for invalid squares somehow?
			this._selectTarget(position);
			this._board.clearAoE();
			this._board.showAoE(this._skill, this._target);
		}
	}
	mouseLeave(position, dragId) {
		if (this._target == position && this._skill && this._skill.idMatch(dragId)) {
			this._deselectTarget();
			this._board.clearAoE();
		}
	}

	keydown(key) {
		if (key == "Escape") {
			if (this._target && this._phase == BattleScene.DeployPhase) {
				this._deselectTarget();
			} else if (this._skill) {
				this._deselectSkill();
			} else if (this._unit) {
				this._deselectUnit();
			}
			// TODO: Open a menu?
			this.refresh();
		}

		if (key == "Delete" || key == "Backspace" || key == "z" || key == "Z") {
			this._undoMove();
			this.refresh();
		}

		if (key == "Spacebar" || key == " " || key == "Enter") { // TEMP?
			this._endTurn();
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
BattleScene.DeployPhase = 0;
BattleScene.PlayerPhase = 1;
BattleScene.EnemyPhase = 2;
BattleScene.EndPhase = -1;


/***************************************************
 Battle scene -> Team
***************************************************/
class Team {
	constructor(group) {
		this.group = group;
		this.members = [];
	}

	get size() {
		return this.members.length;
	}

	add(piece) {
		if (!this.members.includes(piece)) {
			this.members.push(piece);
		}
	}

	remove(piece) {
		var index = this.members.indexOf(piece);
		if (index > -1) {
			this.members.splice(index, 1);
		}
	}

	startTurn() {
		this.members.forEach(piece => piece.startTurn());
	}

	endTurn() {
		this.members.forEach(piece => piece.endTurn());
	}

	isAlly(otherTeam) {
		if (!otherTeam) return false;
		return otherTeam.group == this.group;
	}
	isEnemy(otherTeam) {
		if (!otherTeam) return false;
		return otherTeam.group != this.group;
	}
}

/***************************************************
 Test scene
The current scene used for debugging
***************************************************/
class TestScene extends BattleScene {
	constructor() {
		super(new TestMap(),
		[
			new TestMeleeUnit(),
			new TestSupportUnit()
		]);
	}
};