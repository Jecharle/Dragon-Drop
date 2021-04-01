/***************************************************
 MapModel
Used to store map data loaded from elsewhere
***************************************************/
class MapModel {
	constructor() {
		// TODO: Load from an XML file?
		this._deployment = []; // x, y
		this._terrain = []; // x, y, terrainType
		this._units = []; // x, y, turn, pieceType, enemy/object
		this._maxTurns = 0;
		this._minTurns = 0;
		this._defaultVictory = false;
	}

	get deployment() {
		return this._deployment;
	}

	get terrain() {
		return this._terrain;
	}

	get units() {
		return this._units;
	}

	get minTurns() {
		return this._minTurns;
	}
	get maxTurns() {
		return this._maxTurns;
	}
	get defaultVictory() {
		return this._defaultVictory;
	}
	// TODO: Tileset?
}

/***************************************************
 TestMap
***************************************************/
class TestMap extends MapModel { // TEMP
	constructor() {
		super();

		this._deployment.push(
			{x: 2, y: 5},
			{x: 3, y: 5},
			{x: 4, y: 5},
			{x: 5, y: 5}
		);

		this._terrain.push(
			{type: Square.Wall, x: 1, y: 4},
			{type: Square.Mud, x: 2, y: 4},
			{type: Square.Wall, x: 3, y: 4},
			{type: Square.Pit, x: 4, y: 4},
			{type: Square.Grass, x: 5, y: 4}
		);

		this._units.push(
			{turn: 0, type: TestEnemyUnit, x: 3, y: 3, enemy: true},

			// reinforcements
			{turn: 1, type: TestEnemyUnit, x: 4, y: 3, enemy: true},
			{turn: 2, type: TestEnemyUnit, x: 5, y: 3, enemy: true}
		);
	}
}