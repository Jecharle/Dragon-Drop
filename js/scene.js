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
	selectTarget(target, id) { }

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
		this._board = this._createBoard();
		this._skillList = this._createSkillList();
		this._buildDOM();
	}

	start() {
		this._turn = 1;
		this._phase = this._deployPhase;
		this._deselectSkill()
		this._deselectUnit();
		this._clearMoves();
	}

	_createBoard() { 
		// TODO: Initialize from a "battle map" entity?
	}
	_createSkillList() {
		return new SkillList();
	}
	_buildDOM() {
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

	_deployPhase = 0;
	_playerPhase = 1;
	_enemyPhase = 2;
	nextTurn() {
		this._deselectSkill();
		this._deselectUnit();
		this._clearMoves();
		switch (this._phase) {
			case this._deployPhase:
				this._phase = this._playerPhase;
				this._setActiveTeam(this.playerTeam);
				break;

			case this._playerPhase:
				this._phase = this._enemyPhase;
				this._setActiveTeam(this.enemyTeam);
				break;

			case this._enemyPhase:
				this._turn++;
				this._phase = this._playerPhase;
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

	_moveUnit(piece, target) {
		if (target.parent.canFit(piece, target)) {
			this._moveStack.push([piece, piece.square]);
			target.parent.movePiece(piece, target);
			piece.moved = true;
		}
	}
	undoMove() {
		var move = this._moveStack.pop();
		if (move) {
			move[1].parent.movePiece(move[0], move[1]);
			move[0].moved = false;
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

	_useSkill(piece, target) {
		if (piece.use(target)) {
			this._deselectSkill();
			this._clearMoves();
		}
	}

	_refreshArea() {
		this._board.resetAreas();

		if (this._skill) {
			this._board.setSkillArea(this._skill);
		} else if (this._unit) {
			this._board.setMoveArea(this._unit);
		}
	}

	selectPiece(piece, dragging) {
		if (!piece) return;

		if (piece.type() == Piece.Skill) {
			if (this._skill != piece) {
				this._selectSkill(piece);
			} else if (!dragging) {
				this._deselectSkill();
			}
		} else if (this._skill && piece.square && !dragging) {
			this.selectTarget(piece.square);
			return;
		}

		if (piece.type() == Piece.Unit && piece.team == this._activeTeam) {
			if (this._unit != piece) {
				this._selectUnit(piece);
			} else if (!dragging) {
				this._deselectUnit();
			} else if (this._skill) {
				this._deselectSkill();
			}
		}
		this._refreshArea();
	}

	selectTarget(target, id) {
		if (!target) return;

		if (!target.inRange) {
			this._deselectSkill();
			this._deselectUnit();
		} else if (this._skill && this._skill.idMatch(id)) {
			this._useSkill(this._skill, target);
		} else if (this._unit && this._unit.idMatch(id)) {
			this._moveUnit(this._unit, target);
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
				this.undoMove();
			}
			this._refreshArea();
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

	_createBoard() {
		var board = new Board(9, 9);
		
		var player = new ControllablePiece("ball");
		player.setTeam(this.playerTeam);
		board.movePiece(player, board.at(4, 5));

		var enemy = new ControllablePiece("ball2", 2);
		enemy.setTeam(this.enemyTeam);
		board.movePiece(enemy, board.at(4, 4));

		return board;
	}

	_buildDOM() {
		// TEMP buttons for flow control
		var undoButton = document.createElement("button");
		undoButton.type = "button";
		undoButton.innerText = "Undo Move";
		undoButton.onclick = () => Game.scene().undoMove();
		this.el.appendChild(undoButton);

		var endTurnButton = document.createElement("button");
		endTurnButton.type = "button";
		endTurnButton.innerText = "End Turn";
		endTurnButton.style.float = "right";
		endTurnButton.onclick = () => Game.scene().nextTurn();
		this.el.appendChild(endTurnButton);

		super._buildDOM();
	}

	start() {
		super.start();
		this.nextTurn(); // skip deployment phase
	}
};