/***************************************************
 MapModel
Used to store map data loaded from elsewhere
***************************************************/
class MapModel {
	constructor() {
		// TODO: Load from an XML file?
		this._deployment = []; // x, y
		this._terrain = []; // x, y, terrainType
		this._pieces = []; // x, y, pieceType, enemy/object
		this._turnLimit = 0;
		this._defaultVictory = false;
	}

	get deployment() {
		return this._deployment;
	}

	get terrain() {
		return this._terrain;
	}

	get pieces() {
		return this._pieces;
	}

	get turnLimit() {
		return this._turnLimit;
	}
	get defaultVictory() {
		return this._defaultVictory;
	}
	// TODO: Sets of pieces to add on subsequent turns?
	// TODO: Tileset?
}

/***************************************************
 TestMap
***************************************************/
class TestMap extends MapModel { // TEMP
	constructor() {
		super();
		
		this._turnLimit = 2;

		this._deployment.push({x: 2, y: 5});
		this._deployment.push({x: 3, y: 5});
		this._deployment.push({x: 4, y: 5});
		this._deployment.push({x: 5, y: 5});

		this._terrain.push({type: Square.Wall, x: 1, y: 4});
		this._terrain.push({type: Square.Wall, x: 2, y: 4});
		this._terrain.push({type: Square.Wall, x: 3, y: 4});
		this._terrain.push({type: Square.Pit, x: 4, y: 4});

		this._pieces.push({type: TestEnemyUnit, x: 3, y: 3, enemy: true});
	}
}