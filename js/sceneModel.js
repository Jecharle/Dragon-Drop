/***************************************************
 SceneModel
 Load and store data from external files
***************************************************/
class SceneModel {
	// TODO: Generically applicable file-loading routine
	static async load(folder, filename) {
		var fullpath = `data/${folder}/${filename}.json`;
		return new Promise(function (resolve, reject) {
			var request = new XMLHttpRequest();
			request.open("GET", fullpath);
			request.responseType = 'json';
			request.onload = () => {
				resolve(request.response);
			};
			request.onerror = () => {
				reject(request.status);
			};
			request.send();
		});
	}
}

/***************************************************
 MapSceneModel
***************************************************/
class MapSceneModel extends SceneModel {
	constructor(data) {
		super();

		this.width = data?.width || 0;
		this.height = data?.height || 0;
		this.startNode = data?.startNode || "";
		
		this.nodes = data?.nodes || []; // id, x, y, hidden

		this.events = data?.events.map(event => { // node id, type*, filename, params, repeatable, name, description
			event.type = MapEvent.parseEventType(event.type);
			return event;
		}) || [];

		this.connections = data?.connections || []; // node id 1, node id 2, one-way
		
		// TODO: background image?
	}

	static async load(filename) {
		var data = await SceneModel.load("maps", filename);
		// TODO: Handle errors while loading?
		var sceneModel = new this(data);
		return sceneModel;
	}
}

/***************************************************
 BattleSceneModel
***************************************************/
class BattleSceneModel extends SceneModel {
	constructor(data) {
		super();

		this.maxTurns = data?.maxTurns || 0;
		this.minTurns = data?.minTurns || 0;
		this.defaultVictory = data?.defaultVictory || false;
		this.maxDeploy = data?.maxDeploy || 4;

		// TODO: width / height override?

		// x, y
		this.deployment = data?.deployment || [];

		// x, y, type*
		this.terrain = data?.terrain?.map(square => {
			square.type = Square.parseTerrain(square.type);
			return square;
		}) || [];

		// x, y, turn, type*, isEnemy?
		this.units = data?.units?.map(unit => {
			unit.type = UnitPiece.parseUnitType(unit.type);
			return unit;
		}) || [];

		// TODO: Tileset?
	}

	static async load(filename) {
		var data = await SceneModel.load("battles", filename);
		// TODO: Handle errors while loading?
		var sceneModel = new this(data);
		return sceneModel;
	}
}