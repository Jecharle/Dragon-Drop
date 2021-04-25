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
		this._paused = false;
		this.setDone();

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

	start() { }
	end() { }

	get paused() { return this._paused; }
	_pause() { this._paused = true; }
	_resume() { this._paused = false; }

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
	pieceEvent(piece, dragging) { }
	positionEvent(position, dragId) { }
	mouseOver(position, dragId) { }
	rightClick() { }

	keydown(key) { }
	keyup(key) { }
	//#endregion input events
}

/***************************************************
 Battle scene
***************************************************/
class BattleScene extends Scene {
	constructor(lastScene, sceneData, partyUnits) {
		super(lastScene);
		this._initTeams();
		this._board = new Board(sceneData);

		this._addParty(partyUnits);
		this._addMapUnits(sceneData?.units);
		this._addTurnLimit(sceneData);

		this._skillList = new SkillList();
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

	//#region rule setup
	_addTurnLimit(sceneData) {
		if (!sceneData) return;
		this._maxTurns = sceneData.maxTurns;
		this._minTurns = sceneData.minTurns;
		this._defaultVictory = sceneData.defaultVictory;
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
			Game.asyncPause(1000).then(() => this._aiProcessTurn());
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
		if (this._lastScene) this._lastScene.sendData({ complete: true });
		this._phase = BattleScene.EndPhase;
		this._deselectUnit();
		this._setActiveTeam(null);
		this.refresh();
		this._showEndScreen("Victory!");
	}
	_lose() {
		if (this._lastScene) this._lastScene.sendData({ complete: false });
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

	_endBattle() {
		Game.setScene(this._lastScene);
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
		this.setBusy();
		var success = unit.move(square);
		this._clearAreas();
		if (await success) {
			this._moveStack.push(unit);
			this._deselectTarget();
		}
		this.setDone();
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
		this.setBusy();
		var success = skill.use(square);
		this._clearAreas();
		if (await success) {
			this._clearMoves();
			this._deselectSkill();
			this._isBattleOver();
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

	//#region input events
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

		if (key == "Enter") {
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
	//#endregion input events

	//#region ai
	async _aiProcessTurn() {
		var aiControlUnits = this._activeTeam.members.filter(member => member.canAct || member.canMove);

		var waitTime = 300; // TODO: Adjustable via settings?

		while (aiControlUnits.length > 0) {
			aiControlUnits.sort((a, b) => a.aiUnitScore - b.aiUnitScore);
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
				this._deselectUnit();
				continue;
			}

			this._selectTarget(this._unit.aiSkillTarget);
			this._refreshTargetArea();

			if (this._target) {
				await Game.asyncPause(waitTime);
				await this._useSkill(this._skill, this._target);
			}
			this._deselectUnit();
			this.refresh();

			if (this._phase == BattleScene.EndPhase) return;
		}
		await Game.asyncPause(waitTime);

		if (this._phase == BattleScene.EnemyPhase) {
			await this._addReinforcements();
		}

		this._nextTurn();
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
			if (member.alive && member.square) return count+1;
			else return count;
		}, 0);
	}
	//#endregion units

	//#region turn
	get untouched() {
		return this.members.every(member => member.dead || (member.canMove && member.canAct));
	}
	get isAuto() {
		return this._auto;
	}

	startTurn() {
		this.members.forEach(piece => piece.startTurn());
	}
	endTurn() {
		this.members.forEach(piece => piece.endTurn());
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

		this._exploreButtonEl = this._createExploreButton();
		this._eventDescriptionEl = this._createEventDescription();

		this._camera.el.appendChild(this._map.el);
		this.el.appendChild(this._camera.el);
		this.el.appendChild(this._exploreButtonEl);
		this.el.appendChild(this._eventDescriptionEl);
		
		var startNode = this._map.getNode(startNodeId);
		if (startNode) {
			this._piece.move(this._map.getNode(startNode));
		} else {
			this._piece.move(this._map.getNode(mapData.startNode));
		}
		this._camera.setViewSize(1024, 768); // TEMP, until I can pull the resolution in natively
	}

	start() {
		this._camera.focus(this._piece.node);

		if (this._paused) {
			var data = this._getData();
			if (data.complete && this._currentNode.event) {
				this._completeNode(this._currentNode);
			}
			this._resume();
		}

		this.refresh();
	}

	//#region ui setup
	_createExploreButton() {
		var button = document.createElement("button");
		button.classList.add('nav-button', 'explore-button');
		button.type = "button";
		button.onclick = () => {
			this._exploreNode(this._currentNode);
		};
		return button;
	}
	_createEventDescription() {
		var textBox = document.createElement("div");
		textBox.classList.add('map-node-description');
		return textBox;
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
		this._map.setReachableNodes(this._piece.node, 10); // temporary very high range
	}

	_refreshUi() {
		this._exploreButtonEl.innerText = "Start"; // TODO: Text changes by event type
		this.el.classList.toggle('hide-description', !this._currentNode.canExplore);
		this._eventDescriptionEl.innerHTML = this._currentNode.event?.fullDescription;
	}
	//#endregion refresh

	get _currentNode() {
		return this._piece.node;
	}

	//#region actions
	async _movePiece(node) {
		this.setBusy();
		this.el.classList.add('hide-description');
		
		this._camera.focus(node);
		this._camera.animateMove(node.path, 750, 150);
		await this._piece.move(node);

		this.setDone();
	}

	_exploreNode(node) {
		if (!node || !node.canExplore) return false;
		var newScene = node.event.getScene(this);
		if (!newScene) {
			this._completeNode(node);
			this.refresh();
		} else {
			this._pause();
			Game.setScene(newScene);
		}
		return true;
	}

	_completeNode(node) {
		node.event?.setComplete();
		node.edges.forEach(adjacent => {
			adjacent._show(); // TEMP
		});
		// TODO: Make this visually interesting? Animations, etc?
	}
	//#endregion actions

	//#region input events
	positionEvent(node, dragId) {
		if (this.busy || !this._piece.idMatch(dragId)) return;

		if (node.inRange) {
			this._movePiece(node).then(result => this.refresh());
			return;
		}
	}
	/*mouseOver(node, dragId) {
		if (this.busy || !this._piece.idMatch(dragId)) return;
	}*/
	/*rightClick() {
		if (this.busy) return;
	}*/
	keydown(key) {
		if (this.busy) return;

		if (key == "Enter") {
			this._exploreNode(this._currentNode);
		}
	}
	//#endregion
}


/***************************************************
 Map Scene -> Map Event
***************************************************/
class MapEvent {
	constructor(type, modelPath) {
		/*
		commands for the event to run?
			1. Start a scene (battle, etc)
				Branch based on an outcome?
			2. Move the character
			3. Add/remove a connection
			4. Show/hide another node
		*/
		this._type = type;
		this._modelPath = modelPath;
		// TODO: Data load target (scene data filename, based on type?)
		this._name = "";
		this._description = "";
		this._complete = false;
		this._repeatable = false;
	}

	//#region event type
	static get None() { return 0; }
	static get Battle() { return 1; }
	static get Story() { return 2; }
	static get Movement() { return 3; }
	static get Other() { return -1; }

	get type() {
		return this._type;
	}
	get modelPath() {
		return this._modelPath;
	}
	//#endregion event type

	//#region temporary setup
	set description(value) {
		this._description = value;
	}
	set name(value) {
		this._name = value;
	}
	set repeatable(value) {
		this._repeatable = value;
	}
	//#endregion temporary setup

	// TODO: Actual setup

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
		return this._repeatable;
	}
	get accessible() {
		return !this.complete || this.repeatable;
	}
	//#endregion completion state

	setComplete() {
		this._complete = true;
	}

	getScene(lastScene) {
		switch (this.type) {
			case MapEvent.Battle:
				// TEMP data until I have more stuff to load
				return new BattleScene(lastScene, new TestBattle(), Party.getUnits());

			case MapEvent.Story:
				alert("Watch a cutscene");
				return null;

			case MapEvent.Movement:
				alert("Change map");
				return null;
			
			default:
				alert("Unknown event type");
				return null;
		}
	}
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
	animateMove(path, speed, delay) {
		var keyframes = [{}];
		path.forEach(position => {
			var x = this._clampX(position.screenX);
			var y = this._clampY(position.screenY);
			keyframes.unshift({
				transform: this._scrollPosition(x, y)
			});
		});

		var time = speed*(keyframes.length-1);
		delay = delay || 0;
		this.el.animate(keyframes, {duration: time, delay: delay, easing: "linear", fill: "backwards"});
		return time;
	}
	//#endregion animate
}