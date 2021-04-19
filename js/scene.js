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
		this.busy = false;

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

	pieceEvent(piece, dragging) { }
	positionEvent(position, dragId) { }
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

		this._menuButtonEl = this._createMenuButton();
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
	_endBattle() {
		alert("The battle is now over"); // TEMP
	}

	//#region ui setup
	_createTurnTitle() {
		var turnTitle = document.createElement("span");
		turnTitle.classList.add('turn-title');
		turnTitle.style.textAlign = "center";
		return turnTitle;
	}
	_createMenuButton() {
		var button = document.createElement("button");
		button.classList.add('nav-button', 'menu-button');
		button.type = "button";
		/*button.onclick = () => {
			TODO: Open the menu
		};*/
		return button;
	}
	_createUndoButton() {
		var button = document.createElement("button");
		button.classList.add('nav-button', 'undo-button');
		button.type = "button";
		button.onclick = () => {
			this._undoMove();
			this.refresh();
		};
		return button;
	}
	_createEndTurnButton() {
		var button = document.createElement("button");
		button.classList.add('nav-button', 'end-turn-button');
		button.type = "button";
		button.onclick = () => {
			this._nextTurn();
		};
		return button;
	}

	_buildDOM() {
		this.el.appendChild(this._turnTitleEl);
		this.el.appendChild(this._menuButtonEl);
		this.el.appendChild(this._undoButtonEl);
		this.el.appendChild(this._endTurnButtonEl);

		this.el.appendChild(this._board.el);
		this.el.appendChild(this._skillList.el);
	}
	//#endregion ui setup

	//#region unit setup
	_initTeams() {
		this.playerTeam = new Team(0, "ally");
		this.enemyTeam = new Team(1, "enemy", true);
		this._setActiveTeam(null);
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
			return newPiece;
		}
		return null;
	}
	//#endregion unit setup

	//#region refresh
	refresh() {
		this._refreshArea();
		this._refreshTargetArea();
		this._refreshUi();
	}

	_refreshArea() {
		this._board.resetAreas();
		if (this._phase == BattleScene.DeployPhase) {
			if (this._unit && !this._unit.myTurn) {
				this._board.setMoveArea(this._unit);
			}
			this._board.setDeployArea(this._unit && this._unit.myTurn);
		} else if (this._skill) {
			this._board.setSkillArea(this._skill);
		} else if (this._unit) {
			this._board.setMoveArea(this._unit);
		}
	}
	_refreshTargetArea() {
		this._board.clearTargeting();
		if (this._target && this._phase != BattleScene.DeployPhase) {
			if (this._skill) this._board.showAoE(this._skill, this._target);
			else if (this._unit) this._board.showPath(this._target);
		} else if (this._phase == BattleScene.DeployPhase) {
			this._board.showDeploySwap(this._unit, this._target);
		}
	}
	_clearAreas() {
		this._board.resetAreas();
		this._board.clearTargeting();
	}

	_refreshUi() {
		if (this._phase == BattleScene.DeployPhase) {
			this._turnTitleEl.innerText = "Reposition";
		} else if (this._maxTurns && this._turn >= this._maxTurns) {
			this._turnTitleEl.innerText = "Last turn";
		} else if (this._maxTurns) {
			this._turnTitleEl.innerText = (1 + this._maxTurns - this._turn)+" turns left";
		} else {
			this._turnTitleEl.innerText = "Turn " + this._turn;
		}

		this._menuButtonEl.innerText = "Menu";
		this._menuButtonEl.disabled = true;

		if (this._phase == BattleScene.DeployPhase) {
			this._endTurnButtonEl.innerText = "Ready";
		} else {
			this._endTurnButtonEl.innerText = "End Turn";
		}
		this._endTurnButtonEl.disabled = !!this._autoPhase;

		if (!this._lastMove && this._canRedeploy || this._phase == BattleScene.DeployPhase) {
			this._undoButtonEl.innerText = "Back";
		} else {
			this._undoButtonEl.innerText = "Undo Move";
		}
		this._undoButtonEl.disabled = !!(this._autoPhase || (!this._lastMove && !this._canRedeploy));
	}
	//#endregion refresh

	//#region phases
	static get DeployPhase() { return 0; }
	static get PlayerPhase() { return 1; }
	static get EnemyPhase() { return 2; }
	static get EndPhase() { return -1; }

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
			this._aiProcessTurn();
		}
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
		this._deselectUnit();
		this._setActiveTeam(null);
		this.refresh();
		this._showEndScreen("Victory!");
	}
	_lose() {
		if (this.lastScene) this.lastScene.sendData({ victory: false });
		this._phase = BattleScene.EndPhase;
		this._deselectUnit();
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
		endScreen.el.onclick = ev => this._endBattle(); // TEMP
		this.el.appendChild(endScreen.el);
	}
	//#endregion phases

	//#region action processing
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
	}
	async _moveUnit(unit, square) {
		this.busy = true;
		var success = await unit.move(square);
		if (success) {
			this._moveStack.push(unit);
			this._deselectTarget();
		}
		this.busy = false;
		return success;
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
	_swapDeploySquares(piece, target) {
		if (target.piece) {
			this._board.swapPieces(piece, target.piece);
		} else {
			this._board.movePiece(piece, target);
		}
		this._deselectUnit();
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
	async _useSkill(skill, square) {
		this.busy = true;
		var success = await skill.use(square)
		if (success) {
			this._clearMoves();
			this._deselectSkill();
			this._isBattleOver();
		}
		this.busy = false;
		return success;
	}

	_selectTarget(square) {
		if (square && (!square.inRange || square.invalid)) return false;

		if (this._target) {
			this._deselectTarget();
		}
		this._target = square;
		return true;
	}
	_deselectTarget() {
		this._target = null;
	}

	_goBack() {
		if (this._skill) {
			this._deselectSkill();
		} else if (this._unit == this._lastMove) { // undo move before deselecting
			this._undoMove();
		} else if (this._unit) {
			this._deselectUnit();
		} else {
			this._undoMove();
		}
	}

	async _addReinforcements() {
		for (var i = 0; i < this._reinforcementData.length; i++) {
			var data = this._reinforcementData[i];
			if (data.turn == this._turn) { // TODO: Other requirements?
				var newPiece = this._addMapUnit(data);
				newPiece.addTimedClass(500, 'spawn');
				await Game.asyncPause(500);
			}
		}
		return;
	}
	//#endregion action processing

	//#region input
	pieceEvent(piece, dragging) {
		if (!piece || this._autoPhase || this.busy) return;

		if (!this._skill && piece.type == Piece.Unit && !piece.myTurn) {
			if (this._unit != piece) {
				this._selectUnit(piece);
			} else {
				this._deselectUnit();
			}
		}

		if (this._phase == BattleScene.DeployPhase) {
			if (piece.type == Piece.Unit && piece.myTurn) {
				if (!this._unit || !this._unit.myTurn || dragging) {
					this._selectUnit(piece);
					this._selectTarget(piece.square);
				} else if (this._unit == piece) {
					this._deselectUnit();
				} else if (piece.square) {
					this.positionEvent(piece.square);
				}
			}
		} else { // non-deploy phase
			if (piece.type == Piece.Skill) {
				if (this._skill != piece) {
					this._selectSkill(piece);
				} else if (!dragging) {
					this._deselectSkill();
				}
			} else if (this._skill && piece.square && !dragging) {
				this.positionEvent(piece.square);
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
	positionEvent(square, dragId) {
		if (!square || this._autoPhase || this.busy) return;

		if (this._phase == BattleScene.DeployPhase) {
			if (!square.inRange) {
				this._deselectUnit();
			} else if (this._unit && this._unit.idMatch(dragId)) {
				if (square == this._target) {
					this._swapDeploySquares(this._unit, square);
				} else {
					this._selectTarget(square);
					this._refreshTargetArea();
				}
			}
		} else { // non-deploy phase
			if (!square.inRange) {
				this._deselectSkill();
				if (square.piece != this._unit) this._deselectUnit();
			} else if (this._skill && this._skill.idMatch(dragId)) {
				if (square == this._target) {
					// async function
					this._useSkill(this._skill, square).then(() => this.refresh());
					return;
				} else if (!square.invalid) {
					this._selectTarget(square);
					this._refreshTargetArea();
				}
			} else if (this._unit && this._unit.idMatch(dragId)) {
				if (square == this._target) {
					// async function
					this._moveUnit(this._unit, square).then(() => this.refresh());
					return;
				} else {
					this._selectTarget(square);
					this._refreshTargetArea();
				}
			}
		}
		this.refresh();
	}
	mouseOver(square, dragId) {
		if (this._autoPhase || this.busy) return; // TEMP?

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
		if (this._autoPhase || this.busy) return; // TEMP?

		this._goBack();
		this.refresh();
	}
	keydown(key) {
		if (this._autoPhase || this.busy) return; // TEMP?

		if (key == "Escape") {
			this._goBack();
			this.refresh();
		}

		if (key == "z" || key == "Z") {
			this._undoMove();
			this.refresh();
		}

		if (key == "Enter") { // TEMP?
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

	async _aiProcessTurn() {
		this._aiControlUnits = this._activeTeam.members.filter(member => member.canAct || member.canMove);
		await Game.asyncPause(1000);

		while (this._aiControlUnits.length > 0) {
			this._aiControlUnits.sort((a, b) => a.aiUnitScore - b.aiUnitScore);
			this._selectUnit(this._aiControlUnits.pop());
			
			if (!this._unit) continue;
			
			this.refresh();
			this._unit.aiCalculate();

			this._selectTarget(this._unit.aiMoveTarget);
			this._refreshTargetArea();

			if (this._target && this._target != this._unit.square) {
				await Game.asyncPause(250);
				await this._moveUnit(this._unit, this._target);
				this.refresh();
			}

			this._selectSkill(this._unit.aiSkill);
			this.refresh();

			if (!this._skill) {
				this._deselectUnit();
				continue;
			}

			this._selectTarget(this._unit.aiSkillTarget);
			this._refreshTargetArea();

			if (this._target) {
				await Game.asyncPause(250);
				await this._useSkill(this._skill, this._target);
			}
			this._deselectUnit();
			this.refresh();
		}
		await Game.asyncPause(250);

		if (this._phase == BattleScene.EnemyPhase) {
			await this._addReinforcements();
		}

		this._aiControlUnits = null;
		this._nextTurn();
		return;
	}
	//#endregion input

};

/***************************************************
 Battle scene -> Team
***************************************************/
class Team {
	constructor(group, style, isAuto) {
		this.group = group;
		this.style = style;
		this._auto = isAuto || false;
		this.members = [];
	}

	get isAuto() {
		return this._auto;
	}

	get size() {
		return this.members.reduce((count, member) => {
			if (member.alive && member.square) return count+1;
			else return count;
		}, 0);
	}

	get untouched() {
		return this.members.every(member => member.dead || (member.canMove && member.canAct));
	}

	add(unit) {
		if (!this.members.includes(unit)) {
			this.members.push(unit);
			if (this.style) unit.el.classList.add(this.style);
		}
	}
	remove(unit) {
		var index = this.members.indexOf(unit);
		if (index > -1) {
			this.members.splice(index, 1);
			if (this.style) unit.el.classList.remove(this.style);
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