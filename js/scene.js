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

		this.el.oncontextmenu = ev => {
			ev.preventDefault();
			this.rightClick();
		};
	}

	get elClass() {
		return 'scene';
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
	mouseOver(position, dragId) { }
	rightClick() { }

	keydown(key) { }
	keyup(key) { }
}

/***************************************************
 Battle scene
***************************************************/
class BattleScene extends Scene {
	constructor(mapData, partyUnits) {
		super();
		this._initTeams();
		this._board = new Board(mapData);
		this._skillList = new SkillList();

		this._addParty(partyUnits);
		if (mapData) this._addMapUnits(mapData.units);

		// TODO: Box these assignments up as well?
		this._maxTurns = mapData.maxTurns;
		this._minTurns = mapData.minTurns;
		this._defaultVictory = mapData.defaultVictory;

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
	end() {
		alert("The battle is now over"); // TEMP
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
		this.playerTeam = new Team(0, false);
		this.enemyTeam = new Team(1, true);
		this._setActiveTeam(null);
	}
	_setActiveTeam(team) {
		if (team == this._activeTeam) return;

		if (this._activeTeam) {
			this._activeTeam.endTurn();
		}
		this._activeTeam = team;
		if (this._activeTeam) {
			this._activeTeam.startTurn();
		}
	}
	get _autoPhase() {
		if (!this._activeTeam) return false;
		else return this._activeTeam.isAuto;
	}

	_addParty(partyUnits) {
		if (!partyUnits) return;

		partyUnits.forEach((piece, index) => {
			var square = this._board.deployArea[index];
			if (square) this._board.movePiece(piece, square);
			piece.setTeam(this.playerTeam);
		});
	}
	_addMapUnits(unitData) {
		if (!unitData) return;

		this._reinforcementData = [];
		unitData.forEach(data => {
			if (data.turn > 0) this._reinforcementData.push(data);
			else this._addMapUnit(data);
		});
	}
	_addMapUnit(data) {
		var newPiece = new data.type();
		var square = this._board.getNearestFit(newPiece, this._board.at(data.x, data.y))
		if (this._board.movePiece(newPiece, square)) {
			if (data.enemy) newPiece.setTeam(this.enemyTeam);
			return true;
		}
		return false;
	}
	_addReinforcements() {
		// this removes the data for anything successfully added
		this._reinforcementData = this._reinforcementData.filter(data => {
			if (data.turn <= this._turn) {
				return !this._addMapUnit(data);
			}
			return true;
		});
	}

	refresh() {
		this._refreshArea();
		this._refreshTargetArea();
		this._refreshUi();
	}

	_deploy() {
		this._turn = 1;
		this._phase = BattleScene.DeployPhase;
		this._setActiveTeam(this.playerTeam);

		this._deselectSkill();
		this._deselectUnit();
		this._clearMoves();
		this.refresh();
	}
	_nextTurn() {
		if (this._phase != BattleScene.DeployPhase && !this._autoPhase
		&& this._activeTeam && this._activeTeam.untouched
		&& !confirm("End turn?")) {
			return; // prompt to avoid ending turn without doing anything
		}

		this._deselectSkill();
		this._deselectUnit();
		this._clearMoves();
		switch (this._phase) {
			case BattleScene.DeployPhase:
				this._phase = BattleScene.PlayerPhase;
				this._canRedeploy = true;
				this._showPhaseBanner("Battle Start");
				break;

			case BattleScene.PlayerPhase:
				this._phase = BattleScene.EnemyPhase;
				this._setActiveTeam(this.enemyTeam);
				this._showPhaseBanner("Enemy Phase");
				break;

			case BattleScene.EnemyPhase:
				this._addReinforcements();
				this._turn++;
				if (!this._isBattleOver()) {
					this._phase = BattleScene.PlayerPhase;
					this._setActiveTeam(this.playerTeam);
					this._showPhaseBanner("Turn "+this._turn);
				}
				break;
		}
		this.refresh();
	
		if (this._autoPhase) {
			setTimeout(() => this._aiTurnStart(), 1000);
		}
	}

	_isBattleOver() {
		if (this.playerTeam.size == 0) {
			this._lose();
			return true;
		} else if (this.enemyTeam.size == 0 && this._turn >= this._minTurns) {
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
		if (this.lastScene) this.lastScene.sendData({ victory: true });
		this._phase = BattleScene.EndPhase;
		this._setActiveTeam(null);
		this.refresh();
		this._showEndScreen("Victory!");
	}
	_lose() {
		if (this.lastScene) this.lastScene.sendData({ victory: false });
		this._phase = BattleScene.EndPhase;
		this._setActiveTeam(null);
		this.refresh();
		this._showEndScreen("Defeat");
	}

	_showPhaseBanner(text) {
		var banner = new PhaseBanner(text);
		this.el.appendChild(banner.el);
	}
	_showEndScreen(text) {
		var endScreen = new EndScreen(text);
		endScreen.el.onclick = ev => this.end(); // TEMP
		this.el.appendChild(endScreen.el);
	}

	_refreshUi() {
		if (this._phase == BattleScene.DeployPhase) {
			this._turnTitleEl.innerText = "Positioning";
		} else if (this._autoPhase) {
			this._turnTitleEl.innerText = "Enemy turn";
		} else if (this._maxTurns && this._turn >= this._maxTurns) {
			this._turnTitleEl.innerText = "Last turn";
		} else if (this._maxTurns) {
			this._turnTitleEl.innerText = (1 + this._maxTurns - this._turn)+" turns left";
		} else {
			this._turnTitleEl.innerText = "Turn " + this._turn;
		}

		if (this._phase == BattleScene.DeployPhase) {
			this._endTurnButtonEl.innerText = "Ready";
		} else {
			this._endTurnButtonEl.innerText = "End Turn";
		}
		this._endTurnButtonEl.disabled = !!this._autoPhase;

		if (!this._lastMove && this._canRedeploy) {
			this._undoButtonEl.innerText = "Reposition";
		} else {
			this._undoButtonEl.innerText = "Undo Move";
		}
		this._undoButtonEl.disabled = !!(this._autoPhase || (!this._lastMove && !this._canRedeploy));
	}

	_selectUnit(unit) {
		if (unit && !unit.select()) return false;
		if (this._skill) this._deselectSkill();
		if (this._unit != unit) this._deselectUnit();

		this._unit = unit;
		this._skillList.setUser(unit);
		return true;
	}
	_deselectUnit() {
		this._deselectTarget();
		if (this._unit) this._unit.deselect();
		this._unit = null;
		this._skillList.setUser(null);
		this._sameMove = false;
	}
	_moveUnit(unit, square) {
		if (unit.move(square)) {
			if (unit != this._lastMove) {
				this._moveStack.push(unit);
				this._sameMove = true;
			} else if (!unit.homeSquare) {
				this._moveStack.pop();
				this._deselectUnit();
			}
		}
	}
	_undoMove() {
		var unit = this._moveStack.pop();
		if (unit) {
			unit.undoMove();
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

	_selectSkill(skill) {
		if (skill && !skill.select()) return false;
		if (this._skill != skill) this._deselectSkill();

		this._skill = skill;
		return true;
	}
	_deselectSkill() {
		this._deselectTarget();
		if (this._skill) this._skill.deselect();
		this._skill = null;
	}
	_useSkill(skill, square) {
		if (skill.use(square)) {
			this._deselectSkill();
			this._sameMove = false;
			this._clearMoves();
			this._isBattleOver(); // TEMP?
		}
	}

	_selectTarget(square) {
		if (square && (!square.inRange || square.invalid)) return false;

		if (this._target) {
			this._deselectTarget();
		}
		this._target = square;
		if (this._target) {
			this._target.el.classList.add('selected'); // TEMP
		}
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
		if (this._phase == BattleScene.DeployPhase) {
			this._board.setDeployArea();
		} else if (this._skill) {
			this._board.setSkillArea(this._skill);
		} else if (this._unit && this._unit.canMove || this._sameMove) {
			this._board.setMoveArea(this._unit);
		}
	}
	_refreshTargetArea() {
		this._board.clearAoE();
		this._board.clearPath();
		if (this._target) {
			if (this._skill) this._board.showAoE(this._skill, this._target);
			else if (this._unit) this._board.showPath(this._target);
		}
	}

	_goBack() {
		if (this._target && this._phase == BattleScene.DeployPhase) {
			this._deselectTarget();
		} else if (this._skill) {
			this._deselectSkill();
		} else if (this._unit == this._lastMove) { // undo move before deselecting
			this._undoMove();
		} else if (this._unit) {
			this._deselectUnit();
		} else {
			this._undoMove();
		}
	}

	_aiTurnStart() {
		this._aiControlUnits = this._activeTeam.members.filter(member => member.canAct || member.canMove);
		this._aiSelectUnit();
	}
	_aiSelectUnit() {
		if (this._aiControlUnits.length == 0) {
			this._aiTurnEnd();
			return;
		}

		this._aiControlUnits.sort((a, b) => a.aiUnitScore - b.aiUnitScore);
	
		if (!this._selectUnit(this._aiControlUnits.pop())) {
			this._aiSelectUnit(); // warning: technically recursive
		}
		if (!this._unit.canMove) {
			this._aiSelectSkill();
			return;
		}
		this.refresh();

		var destination = this._board.aiBestSquare;
		if (!this._selectTarget(destination)) {
			var waypoint = destination.path.find(square => square.inRange && !square.invalid);
			this._selectTarget(waypoint);
		}
		this._refreshTargetArea();

		setTimeout(() => this._aiMoveUnit(), 250);
	}
	_aiMoveUnit() {
		if (this._target) {
			this._moveUnit(this._unit, this._target);
			this.refresh();
		}
		setTimeout(() => this._aiSelectSkill(), 500);
	}
	_aiSelectSkill() {
		if (!this._selectSkill(this._unit.aiBestSkill)) {
			this._aiSelectUnit();
			return;
		}
		this.refresh();

		this._selectTarget(this._board.aiBestSquare);
		this._refreshTargetArea();

		setTimeout(() => this._aiUseSkill(), 500);
	}
	_aiUseSkill() {
		if (this._target) {
			this._useSkill(this._skill, this._target);
		} else {
			this._deselectSkill();
		}

		this._deselectUnit();
		this.refresh();

		setTimeout(() => this._aiSelectUnit(), 250);
	}
	_aiTurnEnd() {
		this._aiControlUnits = null;
		this._nextTurn();
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
		} else if (!this._autoPhase) {
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
		this.refresh();
	}
	selectPosition(square, dragId) {
		if (!square) return;

		if (this._phase == BattleScene.DeployPhase) {
			if (!square.inRange) {
				this._deselectTarget();
			} else if (this._target) {
				this._swapDeploySquares(this._target, square);
			} else {
				this._selectTarget(square);
			}
		} else if (!this._autoPhase) {
			if (!square.inRange) {
				this._deselectSkill();
				if (square.piece != this._unit) this._deselectUnit();
			} else if (this._skill && this._skill.idMatch(dragId)) {
				if (square == this._target) {
					this._useSkill(this._skill, square);
				} else if (!square.invalid) {
					this._selectTarget(square);
					this._refreshTargetArea();
				}
			} else if (this._unit && this._unit.idMatch(dragId)) {
				if (square == this._target) {
					this._moveUnit(this._unit, square);
				} else {
					this._selectTarget(square);
					this._refreshTargetArea();
				}
			}
		}
		this.refresh();
	}

	mouseOver(square, dragId) {
		if (this._autoPhase) return; // TEMP?

		if ((this._skill && this._skill.idMatch(dragId))
		|| (this._unit && this._unit.idMatch(dragId))) {
			if (square == null) {
				this._deselectTarget();
			} else if (square != this._target) {
				this._selectTarget(square);
			}
			this._refreshTargetArea();
		}
	}

	rightClick() {
		if (this._autoPhase) return; // TEMP?

		this._goBack();
		this.refresh();
	}

	keydown(key) {
		if (this._autoPhase) return; // TEMP?

		if (key == "Escape" || key == "Delete" || key == "Backspace") {
			this._goBack();
			this.refresh();
		}

		if (key == "z" || key == "Z") {
			this._undoMove();
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
BattleScene.DeployPhase = 0;
BattleScene.PlayerPhase = 1;
BattleScene.EnemyPhase = 2;
BattleScene.EndPhase = -1;


/***************************************************
 Battle scene -> Team
***************************************************/
class Team {
	constructor(group, isAuto) {
		this.group = group;
		this.members = [];
		this._auto = isAuto || false;
	}

	get isAuto() {
		return this._auto;
	}

	get size() {
		return this.members.reduce((count, member) => {
			if (member.alive) return count+1;
			else return count;
		}, 0);
	}

	get untouched() {
		return this.members.every(member => member.dead || (member.canMove && member.canAct));
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