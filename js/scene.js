/***************************************************
 Scene
The root class that responds to user interaction
and applies rules to pieces and containers
***************************************************/
class Scene extends UiElObj {
	constructor(lastScene) {
		super();
		this._lastScene = lastScene || null;
		this._dataIn = null;
		this._paused = false;
		this._activeMenu = null;
		this.setDone();

		this._yesNoPrompt = new YesNoMenu(this);
		this.el.appendChild(this._yesNoPrompt.el);
		
		this._dialogBox = new DialogBox(this);
		this.el.appendChild(this._dialogBox.el);

		this._bgm = null;

		this.el.oncontextmenu = ev => {
			ev.preventDefault();
			this.rightClick();
		};
	}

	get elClass() {
		return 'scene';
	}

	get unsaved() {
		return false;
	}

	start() { Bgm.play(this._bgm); }
	end() { }

	get paused() { return this._paused; }
	_pause() { this._paused = true; }
	_resume() { this._paused = false; Bgm.play(this._bgm); }
	
	//#region menus
	_openMenu(menu, callback) {
		if (!menu || this.busy) return;
		this.setBusy();
		this._activeMenu = menu;
		menu.open(result => {
			this.setDone();
			this._activeMenu = null;
			if (callback) callback.call(this, result);
		});
	}
	_openPrompt(message, callback) {
		if (this.busy) return;
		this.setBusy();
		this._activeMenu = this._yesNoPrompt;
		this._yesNoPrompt.open(message, result => {
			this.setDone();
			this._activeMenu = null;
			if (callback) callback.call(this, result);
		});
	}
	// TODO: This is very similar to the OpenPrompt method, can I standardize further?
	_showDialog(dialogArray, callback) {
		if (this.busy) return;
		this.setBusy();
		this._activeMenu = this._dialogBox;
		this._dialogBox.open(dialogArray, () => {
			this.setDone();
			this._activeMenu = null;
			if (callback) callback.call(this);
		});
	}
	//#endregion menus

	//#region inter-scene communication
	sendData(data) {
		this._dataIn = data;
	}
	_getData() {
		var data = this._dataIn;
		this._dataIn = null;
		return data;
	}
	//#endregion inter-scene communication

	//#region block during some async
	setBusy() {
		this._busy = true;
	}
	setDone() {
		this._busy = false;
	}
	get busy() {
		return !!this._busy;
	}
	//#endregion block during some async

	//#region input events
	pieceEvent(piece, dragging, doubleClick) { }
	positionEvent(position, dragId, doubleClick) { }
	containerEvent(container, dragId, doubleClick) { }
	mouseOver(position, dragId) { }
	rightClick() { }

	keydown(key) { }
	keyup(key) { }
	//#endregion input events
}

/***************************************************
 Title scene
***************************************************/
class TitleScene extends Scene {
	constructor() {
		super(null);

		this._titleEl = this._createTitle();
		this._startButtonEl = this._createStartButton();
		this._optionButtonEl = this._createOptionButton();
		this._clearButtonEl = this._createClearDataButton();

		this._optionsMenu = new OptionsMenu(this);

		this._buildDOM();

		this._bgm = "";
	}

	_createTitle() {
		var title = document.createElement("h1");
		title.classList.add('main-title');
		title.innerText = "Dragon Drop";
		return title;
	}

	_createStartButton() {
		return this._addButton("Start Game", () => {
				MapSceneModel.load("testMap").then(mapModel => { // TEMPORARY starting map
					Game.setScene(new MapScene(null, mapModel));
				});
			});
	}	

	_createOptionButton() {
		return this._addButton("Options", () => {
				this._openMenu(this._optionsMenu);
			});
	}

	_createClearDataButton() {
		return this._addButton("Clear Data", () => {
				this._openPrompt("Really clear all data?", result => {
					if (result == 1) {
						SaveData.clearAll();
						Bgm.refreshVolume();
					}
				});
			});
	}

	_buildDOM() {
		this.el.appendChild(this._titleEl);
		this.el.appendChild(this._startButtonEl);
		this.el.appendChild(this._optionButtonEl);
		this.el.appendChild(this._clearButtonEl);
		
		this.el.appendChild(this._optionsMenu.el);
	}
}

/***************************************************
 Battle scene
***************************************************/
class BattleScene extends Scene {
	constructor(lastScene, sceneData) {
		super(lastScene);
		this._initTeams();
		this._board = new Board(sceneData);

		this._addRestrictions(sceneData);
		this._addMapUnits(sceneData.units);
		this._addDialog(sceneData.dialog);

		this._deployList = new DeployUnitList(Party.getUnits(), this.playerTeam);
		this._skillList = new SkillList();
		this._menuButtonEl = this._createMenuButton();
		this._waitButtonEl = this._createWaitButton();
		this._turnTitleEl = this._createTurnTitle();
		this._turnSubtitleEl = this._createTurnSubtitle();
		this._endTurnButtonEl = this._createEndTurnButton();

		this._battleMenu = new BattleMenu(this);
		this._optionsMenu = new OptionsMenu(this);

		this._buildDOM();
		this._bgm = sceneData.bgm || "Stoneworld Battle.mp3";
	}

	get unsaved() {
		return true;
	}

	start() {
		super.start();
		if (this._board.deployArea.length > 0) {
			this._startDeploy();
		} else {
			this._skipDeploy();
		}
	}

	_getSounds() {
		super._getSounds();

		this._sfxEndTurn = Sfx.getSfx("crunchy_up.wav");
		this._sfxStartBattle = this._sfxEndTurn;

		this._bgmVictory = "News Theme.mp3"
		this._bgmDefeat = "Der Kleber Sting.mp3"
	}

	//#region ui setup
	_createTurnTitle() {
		var turnTitle = document.createElement("span");
		turnTitle.classList.add('turn-title');
		return turnTitle;
	}
	_createTurnSubtitle() {
		var turnTitle = document.createElement("span");
		turnTitle.classList.add('turn-subtitle');
		return turnTitle;
	}
	_createMenuButton() {
		return this._addButton("Menu", () => {
				this._openBattleMenu();
			}, 'nav-button', 'menu-button');
	}
	_createWaitButton() {
		return this._addButton("Wait", () => {
				this._playerWaitUnit();
			}, 'nav-button', 'wait-button');
	}
	_createEndTurnButton() {
		return this._addButton("End Turn", () => {
				this._playerEndTurn();
			}, 'nav-button', 'end-turn-button');
	}

	_buildDOM() {
		this.el.appendChild(this._turnTitleEl);
		this.el.appendChild(this._turnSubtitleEl);
		this.el.appendChild(this._menuButtonEl);
		this.el.appendChild(this._waitButtonEl);
		this.el.appendChild(this._endTurnButtonEl);

		this.el.appendChild(this._board.el);
		this.el.appendChild(this._skillList.el);
		this.el.appendChild(this._deployList.el);

		this.el.appendChild(this._battleMenu.el);
		this.el.appendChild(this._optionsMenu.el);
	}
	//#endregion ui setup

	//#region unit setup
	_initTeams() {
		this.playerTeam = new Team(0, "ally");
		this.enemyTeam = new Team(1, "enemy", true);
		this._setActiveTeam(null);
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
			if (data.ally) {
				newPiece.setTeam(this.playerTeam);
				newPiece.setAsGuest();
			}
			else {
				newPiece.setTeam(this.enemyTeam);
			}
			return newPiece;
		}
		return null;
	}
	//#endregion unit setup

	//#region dialog setup
	_addDialog(dialogData) {
		this._dialogData = dialogData || [];
	}
	//#endregion dialog setup

	//#region rule setup
	_addRestrictions(sceneData) {
		if (!sceneData) return;
		this._maxTurns = sceneData.maxTurns;
		this._minTurns = sceneData.minTurns;
		this._defaultVictory = sceneData.defaultVictory;
		this._maxDeploy = sceneData.maxDeploy;
	}
	//#endregion rule setup

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
			this._board.setDeployArea( this._unit?.myTurn ? this._unit : null,
				(this.playerTeam.size >= this._maxDeploy && !this._unit?.square) );
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
			this._turnTitleEl.innerText = "Deployment";
		} else if (this._maxTurns && this._turn >= this._maxTurns) {
			this._turnTitleEl.innerText = "Last turn";
		} else if (this._maxTurns) {
			this._turnTitleEl.innerText = (1 + this._maxTurns - this._turn)+" turns left";
		} else {
			this._turnTitleEl.innerText = "Turn " + this._turn;
		}

		if (this._phase == BattleScene.DeployPhase) {
			this._turnSubtitleEl.innerText = `${this.playerTeam.size}/${this._maxDeploy}`;
		} else if (this._phase == BattleScene.EnemyPhase) {
			this._turnSubtitleEl.innerText = "Enemy";
		} else {
			this._turnSubtitleEl.innerText = "Player";
		}

		if (this._phase == BattleScene.DeployPhase) {
			this._endTurnButtonEl.innerText = "Ready";
		} else {
			this._endTurnButtonEl.innerText = "End Turn";
		}
		this._endTurnButtonEl.style.display = (!this._autoPhase && !this._unit || this._phase == BattleScene.DeployPhase) ? "" : "none";
		this._endTurnButtonEl.classList.toggle('disabled', this.playerTeam.size == 0);

		this._waitButtonEl.style.display = (this._phase == BattleScene.PlayerPhase && this._unit) ? "" : "none";
		this._waitButtonEl.classList.toggle('disabled', !this._unit || !this._unit.canAct);
	}
	//#endregion refresh

	//#region phases
	static get DeployPhase() { return 0; }
	static get PlayerPhase() { return 1; }
	static get EnemyPhase() { return 2; }
	static get EndPhase() { return -1; }

	_startDeploy() {
		this._turn = 1;
		this._phase = BattleScene.DeployPhase;
		this._setActiveTeam(this.playerTeam);
		this._disableGuests(this.playerTeam);
		this._deployList.show();

		this._deselectSkill();
		this._deselectUnit();
		this._clearMoves();
		this.refresh();

		this._processDialog(0, false);
	}
	_skipDeploy() {
		this._turn = 1;
		this._phase = BattleScene.PlayerPhase;
		this._setActiveTeam(this.playerTeam);
		this.enemyTeam.members.forEach(unit => unit.aiSetDirection());
		this._deployList.hide();
		this._sfxStartBattle.play();
		this._showPhaseBanner("Battle Start");

		this._deselectSkill();
		this._deselectUnit();
		this._clearMoves();
		this.refresh();
	}
	async _endTurn() {
		this.setBusy();
		this._deselectSkill();
		this._deselectUnit();
		this._clearMoves();

		if (this._activeTeam && this._phase != BattleScene.DeployPhase) {
			await this._activeTeam.turnEndEffects();
			this._setActiveTeam(null);
		}

		if (this._phase == BattleScene.EnemyPhase) {
			await this._addReinforcements();
		}

		if (this._phase == BattleScene.DeployPhase) {
			this._sfxStartBattle.play();
		} else {
			this._sfxEndTurn.play();
		}

		switch (this._phase) {
			case BattleScene.DeployPhase:
				this._deployList.hide();
				this._phase = BattleScene.PlayerPhase;
				this._enableGuests(this.playerTeam);
				this.enemyTeam.members.forEach(unit => unit.aiSetDirection());
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

		await Game.asyncPause(1500);
		if (this._activeTeam) {
			await this._activeTeam.turnStartEffects();
		}
		this.setDone();

		await this._processDialog(this._turn, (this._phase == BattleScene.EnemyPhase));

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
	_enableGuests(team) {
		team.members.forEach(unit => {
			if (unit.guest) unit.startTurn();
		});
	}
	_disableGuests(team) {
		team.members.forEach(unit => {
			if (unit.guest) unit.endTurn();
		});
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
		if (this._lastScene) this._lastScene.sendData({ complete: true });
		this._phase = BattleScene.EndPhase;
		this._deselectUnit();
		this._setActiveTeam(null);
		this.refresh();
		this._showEndScreen("Victory!");
		Bgm.play(this._bgmVictory, 0, true);
	}
	_lose() {
		if (this._lastScene) this._lastScene.sendData({ complete: false });
		this._phase = BattleScene.EndPhase;
		this._deselectUnit();
		this._setActiveTeam(null);
		this.refresh();
		this._showEndScreen("Defeat");
		Bgm.play(this._bgmDefeat, 0, true);
	}

	_showPhaseBanner(text) {
		var banner = new PhaseBanner(text);
		this.el.appendChild(banner.el);
	}
	_showEndScreen(text) {
		var endScreen = new EndScreen(text);
		endScreen.el.onclick = () => this._endBattle(); // TEMP
		this.el.appendChild(endScreen.el);
	}

	_endBattle() {
		Game.setScene(this._lastScene);
	}
	//#endregion phases

	//#region menus
	_openBattleMenu() {
		this._openMenu(this._battleMenu, result => {
			// result 0 just closes the menu
			if (result == 1) {
				this._openOptions();
			} else if (result == 2) {
				this._giveUp();
			}
		});
	}
	_openOptions() {
		this._openMenu(this._optionsMenu, _result => {
			this._openBattleMenu();
		});
	}
	_giveUp () {
		this._openPrompt("Give up on the battle?", result => {
			if (result == 1) {
				this._lose();
			} else {
				this._openBattleMenu();
			}
		});
	}
	_playerEndTurn() {
		var prompt = (this._phase == BattleScene.DeployPhase) ? "Confirm deployment?" : "End Turn?";
		this._openPrompt(prompt, result => {
			if (result == 1) {
				this._endTurn();
			}
		});
	}
	_playerWaitUnit() {
		if (!this._unit || !this._unit.canAct || !this._unit.myTurn) return;

		if (!SaveData.confirmEndTurn) {
			if (SaveData.autoFace) this._unit.aiSetDirection();
			this._waitUnit();
			this.refresh();
		} else {
			this._openPrompt("Have this unit wait?", result => {
				if (result) {
					if (SaveData.autoFace) this._unit.aiSetDirection();
					this._waitUnit();
					this.refresh();
				}
			});
		}
	}
	//#endregion menus

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
		if (this._unit) {
			if (this._unit == this._lastMove) this._undoMove(true);
			this._unit.deselect();
		}
		this._unit = null;
		this._skillList.setUser(null);
	}
	async _moveUnit(unit, square) {
		this.setBusy();
		unit.sfxMove.play();
		var success = unit.move(square);
		this._clearAreas();
		if (await success) {
			this._moveStack.push(unit);
			this._deselectTarget();
		}
		this.setDone();
		return success;
	}
	_undoMove(noSound) {
		var unit = this._moveStack.pop();
		if (unit) {
			if (!noSound) Game.sfxCancel.play();
			unit.undoMove();
		}
	}
	_clearMoves() {
		this._moveStack = [];
	}
	get _lastMove() {
		if (this._moveStack.length > 0) return this._moveStack[this._moveStack.length-1];
		else return null;
	}
	_swapDeploySquares(piece, target) {
		if (target.piece && piece.square) {
			this._board.swapPieces(piece, target.piece);
		} else if (target.piece) {
			this._retreatUnit(target.piece, piece.parent);
			this._board.movePiece(piece, target);
	 	} else {
			this._board.movePiece(piece, target);
		}
		piece.sfxSpawn.play();
		this._deselectUnit();
	}
	_retreatUnit(piece, container) {
		if (piece.square) {
			piece.setParent(container);
		}
	}

	_selectSkill(skill) {
		if (skill && !skill.select()) return false;
		if (this._skill != skill) this._deselectSkill();

		this._skill = skill;
		Game.sfxAccept.play();
		return true;
	}
	_deselectSkill() {
		this._deselectTarget();
		if (this._skill) this._skill.deselect();
		this._skill = null;
	}
	async _useSkill(skill, square) {
		this.setBusy();
		var success = skill.use(square);
		this._clearAreas();
		if (await success) {
			this._clearMoves();
			this._deselectSkill();
			if (!this._isBattleOver()) {
				this._unit.startFacing();
			}
			this._skillList.setUser(this._unit);
		}
		this.setDone();
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
		} else if (this._unit && this._unit == this._lastMove) {
			this._undoMove();
		} else if (this._unit) {
			this._deselectUnit();
		} else if (this._lastMove) {
			this._undoMove();
		} else {
			this._openBattleMenu();
		}
	}
	_waitUnit() {
		if (!this._unit) return;
		this._unit.passTurn();
		this._clearMoves();
		this._unit.startFacing();
	}

	async _addReinforcements() {
		for (var i = 0; i < this._reinforcementData.length; i++) {
			var data = this._reinforcementData[i];
			if (data.turn == this._turn) {
				var newPiece = this._addMapUnit(data);
				newPiece.aiSetDirection();
				newPiece.addTimedClass(500, 'spawn');
				newPiece.sfxSpawn.play();
				await Game.asyncPause(500);
			}
		}
	}

	async _processDialog(turn, enemyPhase) {
		return new Promise(resolve => {
			for (var i = 0; i < this._dialogData.length; i++) {
				var data = this._dialogData[i];
				if (data.turn == turn && !data.enemy == !enemyPhase) {
					this._showDialog(data.message, () => {
						resolve();
					});
					return;
				}
			}
			resolve();
		});
	}
	//#endregion action processing

	//#region input events
	pieceEvent(piece, dragging) {
		if (!piece || this._autoPhase || this.busy) return;

		// TODO: Mesh this in better
		if (this._unit && this._unit.isFacing && this._unit != piece) {
			this.refresh();
			return;
		}

		// selecting enemy pieces
		if (!this._skill && piece.type == Piece.Unit && !piece.myTurn) {
			if (this._unit != piece) {
				this._selectUnit(piece);
			} else {
				this._deselectUnit();
			}
		}

		// TODO: This is kind of awkwardly bolted on, integrate the logic more cleanly
		// TODO: Work out when you can deselect a unit and when you can't
		if (this._unit == piece && piece.isFacing) {
			piece.confirmFacing();
			this._deselectUnit();
			// TODO: Facing sound effect?

			if (this.playerTeam.allDone) {
				this._endTurn();
			}
		} else if (this._phase == BattleScene.DeployPhase) {
			if (piece.type == Piece.Unit && piece.myTurn) {
				if (this._unit == piece) {
					this._deselectUnit();
				} else {
					if (!dragging && piece.onField) {
						this._retreatUnit(piece, this._deployList);
					}
					this._selectUnit(piece);
				}
			}
		} else { // non-deploy phase
			if (piece.type == Piece.Skill) {
				if (this._skill != piece) {
					this._selectSkill(piece);
				} else if (!dragging) {
					this._deselectSkill();
				}
			}
			// TODO: Deselecting units should be harder 
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

		// TODO: Still kind of haphazardly bolted on, here
		if (this._unit && this._unit.isFacing) {
			this.refresh();
			return;
		}

		if (this._phase == BattleScene.DeployPhase) {
			if (!square.inRange) {
				this._deselectUnit();
			} else if (this._unit && this._unit.idMatch(dragId)) {
				if (square == this._target) {
					var newUnit = square.piece;
					this._swapDeploySquares(this._unit, square);
					if (newUnit) {
						this._selectUnit(newUnit);
					} else {
						this._deselectUnit();
					}
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
	containerEvent(container, dragId) {
		if (!container || this._autoPhase || this.busy) return; // TEMP?

		if (this._phase == BattleScene.DeployPhase && container == this._deployList) {
			if (this._unit && this._unit.idMatch(dragId)) {
				this._retreatUnit(this._unit, container);
				Game.sfxCancel.play(); // TODO: Play a retreating noise?
				this._deselectUnit();
			}
			this.refresh();
		}
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
		if (this._activeMenu) {
			this._activeMenu.rightClick();
			return;
		}

		if (this._autoPhase || this.busy) return;

		this._goBack();
		this.refresh();
	}
	keydown(key) {
		if (this._activeMenu) {
			this._activeMenu.keydown(key);
			return;
		}

		if (this._autoPhase || this.busy) return;

		if (key == "Escape" || key == "z" || key == "Z") {
			this._goBack();
			this.refresh();
		}

		if (key == "Enter") {
			this._playerEndTurn();
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

		// TODO: Work with this to refine it a bit more
		if (this._unit && this._unit.isFacing) {
			if (key == "ArrowUp") {
				this._unit.faceDirection(UnitPiece.North);
			}
			if (key == "ArrowDown") {
				this._unit.faceDirection(UnitPiece.South);
			}
			if (key == "ArrowLeft") {
				this._unit.faceDirection(UnitPiece.West);
			}
			if (key == "ArrowRight") {
				this._unit.faceDirection(UnitPiece.East);
			}
		}
	}
	//#endregion input events

	//#region ai
	async _aiProcessTurn() {
		var aiControlUnits = this._activeTeam.members.filter(member => member.canAct || member.canMove);

		var waitTime = 300;

		while (aiControlUnits.length > 0) {
			aiControlUnits.sort((a, b) => (a.aiUnitScore - b.aiUnitScore) || (Math.random() - 0.5));
			this._selectUnit(aiControlUnits.pop());
			
			if (!this._unit) continue;
			
			this.refresh();
			this._unit.aiCalculate();

			this._selectTarget(this._unit.aiMoveTarget);
			this._refreshTargetArea();

			if (this._target && this._target != this._unit.square) {
				await Game.asyncPause(waitTime);
				await this._moveUnit(this._unit, this._target);
				this.refresh();
			}

			this._selectSkill(this._unit.aiSkill);
			this.refresh();

			if (!this._skill) {
				this._waitUnit();
				this._unit.aiSetDirection();
				this._unit.refresh();
				this._deselectUnit();
				continue;
			}

			this._selectTarget(this._unit.aiSkillTarget);
			this._refreshTargetArea();

			if (this._target) {
				await Game.asyncPause(waitTime);
				await this._useSkill(this._skill, this._target);
			}
			if (this._unit) {
				this._unit.aiSetDirection();
				this._unit.refresh();
			}
			this._deselectUnit();
			this.refresh();

			if (this._phase == BattleScene.EndPhase) return;
		}
		await Game.asyncPause(waitTime);

		this._endTurn();
		return;
	}
	//#endregion ai

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

	//#region units
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
	get size() {
		return this.members.reduce((count, member) => {
			if (member.alive && member.square && !member.extra) return count+1;
			else return count;
		}, 0);
	}
	//#endregion units

	//#region turn
	get untouched() {
		return [...this.members].every(member => member.dead || (member.canMove && member.canAct));
	}
	get allDone() {
		return [...this.members].every(member => member.dead || !member.square || !member.myTurn ||
			!(member.canAct || member.canMove || member.isFacing));
	}
	get isAuto() {
		return this._auto;
	}

	async turnStartEffects() {
		var members = [...this.members];
		for (var i = 0; i < members.length; i++) {
			await members[i].updateStatusTurnStart();
		}
		for (var i = 0; i < members.length; i++) {
			await members[i].reactTurnStart();
		}
	}
	async turnEndEffects() {
		var members = [...this.members];
		for (var i = 0; i < members.length; i++) {
			await members[i].updateStatusTurnEnd();
		}
		for (var i = 0; i < members.length; i++) {
			await members[i].reactTurnEnd();
		}
		for (var i = 0; i < members.length; i++) {
			await members[i].dieIfDead();
		}
	}

	startTurn() {
		[...this.members].forEach(piece => piece.startTurn());
	}
	endTurn() {
		[...this.members].forEach(piece => piece.endTurn());
	}
	//#endregion turn

	//#region friend-or-foe
	isAlly(otherTeam) {
		if (!otherTeam) return false;
		return otherTeam.group == this.group;
	}
	isEnemy(otherTeam) {
		if (!otherTeam) return false;
		return otherTeam.group != this.group;
	}
	//#endregion friend-or-foe
}

/***************************************************
 Map scene
***************************************************/
class MapScene extends Scene {
	constructor(lastScene, mapData, startNodeId) {
		super(lastScene);

		this._camera = new ScrollingView(mapData.width, mapData.height);
		this._map = new OverworldMap(mapData);
		this._piece = new MapPiece();
		this._node = null;

		this._eventDescriptionEl = this._createEventDescription();
		this._menuButtonEl = this._createMenuButton();

		this._mapMenu = new MapMenu(this);
		this._optionsMenu = new OptionsMenu(this);

		this._buildView();
		
		var startNode = this._map.getNode(startNodeId);
		if (startNode) {
			this._piece.move(startNode);
		} else {
			this._piece.move(this._map.getNode(mapData.startNode));
		}
		this._camera.setViewSize(Game.width, Game.height);

		this._bgm = mapData.bgm || "";
	}

	start() {
		super.start();
		this._camera.focus(this._piece.node);

		if (this.paused) {
			var data = this._getData();
			if (data.complete && this._node.event) {
				this._completeEvent(this._node.event);
			}
			this._resume();
		}

		this.refresh();
	}

	//#region ui setup
	_createExploreButton() {
		// TODO: This isn't currently used
		var button = document.createElement('div');
		button.classList.add('button', 'nav-button', 'explore-button');
		button.onclick = () => {
			this._exploreNode(this._node);
		};
		return button;
	}
	_createEventDescription() {
		var textBox = document.createElement("div");
		textBox.classList.add('map-node-description');
		return textBox;
	}
	_createMenuButton() {
		return this._addButton("Menu", () => {
				this._openMapMenu();
			}, 'nav-button', 'menu-button');
	}
	_buildView() {
		this._camera.el.appendChild(this._map.el);
		this.el.appendChild(this._camera.el);
		this.el.appendChild(this._eventDescriptionEl);
		this.el.appendChild(this._menuButtonEl);
		this.el.appendChild(this._mapMenu.el);
		this.el.appendChild(this._optionsMenu.el);
	}
	//#endregion ui setup

	//#region refresh
	refresh() {
		this._refreshNodes();
		this._refreshUi();
	}

	_refreshNodes() {
		this._map.refresh();
		this._map.resetReachableNodes();
		this._map.setReachableNodes(this._piece.node, 1);
	}

	_refreshUi() {
		if (this._node) {
			this._eventDescriptionEl.innerHTML = this._node.event?.fullDescription;
		}
		this.el.classList.toggle('hide-description', !this._node?.canExplore);
	}
	//#endregion refresh

	//#region menus
	_openMapMenu() {
		this._openMenu(this._mapMenu, result => {
			// result 0 just closes the menu
			if (result == 1) {
				this._openOptions();
			} else if (result == 2) {
				this._quitToTitle();
			}
		});
	}
	_openOptions() {
		this._openMenu(this._optionsMenu, _result => {
			this._openMapMenu();
		});
	}
	_quitToTitle () {
		this._openPrompt("Return to title?", result => {
			if (result == 1) {
				Game.setScene(new TitleScene());
			} else {
				this._openMapMenu();
			}
		});
	}
	//#endregion menus

	//#region actions
	async _selectNode(node, instant) {
		var oldNode = this._node;
		this._node = node;

		if (oldNode) {
			oldNode.el.classList.remove('selected');
			this._map.nodes.forEach(node => node.el.classList.remove('path'));
			this._map.edges.forEach(edge => edge.el.classList.remove('path'));
		}

		if (this._node) {
			this._node.el.classList.add('selected');
			this._node.path.forEach(node => node.el.classList.add('path'));
			this._node.edgePath.forEach(edge => edge.el.classList.add('path'));
		} else {
			this.el.classList.add('hide-description');
		}
		return true;
	}
	async _deselectNode(instant) {
		return this._selectNode(null, instant);
	}

	async _movePiece(node) {
		if (!node) return false;

		this.setBusy();
		this._camera.center(node.screenX, node.screenY);
		this._camera.animateMove([this._piece.node], 600);
		await this._piece.move(node);
		this.setDone();

		return true;
	}

	async _exploreNode(node) {
		if (!node) return false;
		
		await this._movePiece(node);

		if (!node.canExplore) {
			this._deselectNode();
			return true;
		}

		var event = node.event;

		switch (event.type) {
			case MapEvent.Battle:
				var model = await BattleSceneModel.load(event.filename);
				this._pause();
				Game.setScene( new BattleScene(this, model) );
				return true;

			case MapEvent.Story:
				// TEMP
				alert("Watch a cutscene");
				this._completeEvent(event);
				this.refresh();
				return true;

			case MapEvent.Move:
				if (event.filename) {
					var model = await MapSceneModel.load(event.filename);
					Game.setScene( new MapScene(this._lastScene, model, event.param));
				} else {
					var destination = this._map.getNode(event.param);
					if (destination) this._movePiece(destination); // TODO: This should just teleport
					this._deselectNode();
				}
				this._completeEvent(event);
				this.refresh();
				return true;
			
			default:
				this._completeEvent(event);
				this.refresh();
				return true;
		}
	}

	_completeEvent(event) {
		if (!event || event.complete) return;
		event.setComplete();
		if (event.hasReward) {
			if (event.gold && event.gems) alert(`Got ${event.gold} gold and ${event.gems} items`);
			else if (event.gems) alert(`Got ${event.gems} items`);
			else if (event.gold) alert(`Got ${event.gold} gold`);
		}
		SaveData.saveMap();
		if (event.saved) {
			SaveData.saveFlags();
		}
		this._map.unlockNodes(event.unlocks).then(() => this.refresh());
		this._deselectNode();
	}
	//#endregion actions

	//#region input events
	positionEvent(node, dragId) {
		if (this.busy || dragId) return;

		if (this._node == node) {
			this._exploreNode(this._node).then(() => this.refresh());
		}
	}
	mouseOver(node, dragId) {
		if (this.busy || dragId) return;

		if (!node) {
			this._deselectNode();
			this.refresh();
		} else if (node.inRange && node != this._node) {
			this._selectNode(node);
			this.refresh();
		}
	}
	rightClick() {
		if (this.busy) return;

		if (this._node) {
			this._deselectNode().then(() => this.refresh());
		}
	}
	keydown(key) {
		if (this.busy) return;

		if (key == 'Escape') {
			this._deselectNode().then(() => this.refresh());
		}
	}
	//#endregion
}

/***************************************************
 Map Scene -> Map Event
***************************************************/
class MapEvent {
	constructor(eventData, node) {
		this.parent = node;
		this._type = eventData.type;
		[this._filename, this._param] = eventData.filename?.split("/") || [];

		this._name = eventData.name || "";
		this._description = eventData.description || "";
		this._oneTime = eventData.oneTime;

		this._flagId = eventData.flag;
		this._nodeId = this.parent.fullId;
		this._complete = SaveData.getEventClear(this._nodeId) || (this.saved && SaveData.getFlag(this._flagId));
		this._goldReward = eventData.gold || 0;
		this._itemReward = eventData.items || 0;
		this._unlocks = eventData.unlocks || [];
	}

	//#region event type
	static get None() { return 0; }
	static get Battle() { return 1; }
	static get Story() { return 2; }
	static get Move() { return 3; }

	static get Other() { return -1; }

	static parseEventType(string) {
		if (!string) return this.None;
		switch (string.toLowerCase()) {
			case "battle":
				return this.Battle;
			case "story":
				return this.Story;
			case "move":
				return this.Move;
			default:
				return this.Other;
		}
	}

	get type() {
		return this._type;
	}
	get filename() {
		return this._filename;
	}
	get param() {
		return this._param;
	}
	//#endregion event type

	//#region text
	get name() {
		return this._name
	}
	get description() {
		return this._description;
	}
	get fullDescription() {
		var description = "";
		if (this.name) description +=`<strong>${this.name}</strong><br>`
		if (this.description) description += `${this.description}`;
		return description;
		// TODO: This section will evolve with more data options
	}
	//#endregion text

	//#region completion state
	get complete() {
		return this._complete;
	}
	get repeatable() {
		return !this._oneTime;
	}
	get accessible() {
		return !this.complete || this.repeatable;
	}

	get saved() {
		return !!this._flagId;
	}

	setComplete() {
		this._complete = true;
		SaveData.setEventClear(this._nodeId);
		if (this.saved) {
			SaveData.setFlag(this._flagId, 1);
		}
	}
	//#endregion completion state

	//#region clear rewards
	get gold() {
		return this._goldReward;
	}
	get gems() {
		return this._itemReward;
	}
	get hasReward() {
		return !!(this.gold || this.gems);
	}
	get unlocks() {
		return this._unlocks;
	}
	//#endregion clear rewards
}

/***************************************************
 Scrolling view pane
***************************************************/

class ScrollingView extends ElObj {
	constructor(scrollWidth, scrollHeight, viewWidth, viewHeight) {
		super();

		this.setSize(scrollWidth, scrollHeight);
		if (viewWidth && viewHeight) this.setViewSize(viewWidth, viewHeight);
	}

	get elClass() { return 'scrolling-view'; }

	refresh() {
		this.center(this.x, this.y);
	}

	//#region size
	get w() {
		return this._scrollW;
	}
	get h() {
		return this._scrollH;
	}
	setSize(w, h) {
		this._scrollW = w;
		this._scrollH = h;
		this.el.style.width = w+"px";
		this.el.style.height = h+"px";
		this.refresh();
	}
	setViewSize(w, h) {
		this._viewW = w;
		this._viewH = h;
		this.refresh();
	}
	//#endregion size

	//#region position
	get x() {
		return this._x;
	}
	get y() {
		return this._y;
	}
	focus(position) {
		if (!position) return;
		this.center(position.screenX, position.screenY);
	}
	center(x, y) {
		x = this._clampX(x);
		y = this._clampY(y);
		this._x = x;
		this._y = y;
		this.el.style.transform = this._scrollPosition(x, y);
	}
	_scrollPosition(x, y) {
		return `translate(${-x}px, ${-y}px)`;
	}
	//#endregion position

	//#region scroll boundaries
	_clampX(x) {
		x = x || 0;
		if (!this._viewW) return x;
		return Math.max(this._minX, Math.min(x, this._maxX));
	}
	_clampY(y) {
		y = y || 0;
		if (!this._viewH) return y;
		return Math.max(this._minY, Math.min(y, this._maxY));
	}
	get _maxX() {
		return this._scrollW - this._viewW / 2;
	}
	get _minX() {
		return this._viewW / 2;
	}
	get _maxY() {
		return this._scrollH - this._viewH / 2;
	}
	get _minY() {
		return this._viewH / 2;
	}
	//#endregion scroll boundaries

	//#region animate
	async animateMove(path, speed, delay) {
		if (!path || !speed) return false;
		var moved = false;
		var keyframes = [{}];
		path.forEach(position => {
			if (!position) return;

			var x = this._clampX(position.screenX);
			var y = this._clampY(position.screenY);
			keyframes.unshift({
				transform: this._scrollPosition(x, y)
			});

			if (x != this.x || y != this.y) moved = true;
		});
	
		if (!moved) return true;

		var time = speed*(keyframes.length-1);
		delay = delay || 0;
		this.el.animate(keyframes, {duration: time, delay: delay, easing: "linear", fill: "backwards"});
		await Game.asyncPause(time+delay);
		return true;
	}
	//#endregion animate
}