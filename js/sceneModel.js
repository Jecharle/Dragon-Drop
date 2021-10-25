/***************************************************
 SceneModel
 Load and store data from external files
***************************************************/
class SceneModel {
	constructor(filename) {
		this.filename = filename;
	}

	static async load(folder, filename) {
		var fullpath = `data/${folder}/${filename}.json`;
		Game.showLoading();

		return new Promise(function (resolve, reject) {
			var request = new XMLHttpRequest();
			request.open("GET", fullpath);
			request.responseType = 'json';
			request.onload = () => {
				Game.hideLoading();
				resolve(request.response);
			};
			request.onerror = () => {
				Game.hideLoading();
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
	constructor(data, filename) {
		super(filename);

		this.width = data?.width || 0;
		this.height = data?.height || 0;
		this.startNode = data?.startNode || "";
		
		this.nodes = data?.nodes || []; // id, x, y, hidden

		this.connections = data?.connections || []; // node id 1, node id 2, one-way

		this.events = data?.events.map(event => { // node id, type*, filename, oneTime, name, description, rewards, nodes to unlock
			event.type = MapEvent.parseEventType(event.type);
			return event;
		}) || [];
		
		// TODO: background image?

		// TODO: Decorative sprites?
	}

	static async load(filename) {
		var data = await SceneModel.load("maps", filename);
		// TODO: Handle errors while loading?
		var sceneModel = new this(data, filename);
		return sceneModel;
	}
}

/***************************************************
 BattleSceneModel
***************************************************/
class BattleSceneModel extends SceneModel {
	constructor(data, filename) {
		super(filename);

		this.maxTurns = data?.maxTurns || 0;
		this.minTurns = data?.minTurns || 0;
		this.defaultVictory = data?.defaultVictory || false;
		this.maxDeploy = data?.maxDeploy || 4;

		this.width = Math.max(Math.min(data?.width || 8, 10), 1);
		this.height = Math.max(Math.min(data?.height || 8, 10), 1);

		// z, ground type, decoration type
		this.map = data?.map || [];
		for (var y = 0; y < this.map.length; y++) {
			this.map[y] = this.map[y].map(attr => {
				attr = attr.split("-");
				var z = parseInt(attr[0]);
				var ground = Square.parseTerrain(attr[1]);
				var decoration = Square.parseTerrain(attr[2]);
				return {
					z: z,
					ground: ground,
					decoration: decoration
				};
			});
		}

		// x, y
		this.deployment = data?.deployment || [];

		// x, y, turn, type*, ally?
		this.units = data?.units?.map(unit => {
			unit.type = UnitPiece.parseUnitType(unit.type);
			return unit;
		}) || [];

		// mid-battle text cut-ins
		this.dialog = data?.dialog || [];
	}

	static async load(filename) {
		var data = await SceneModel.load("battles", filename);
		// TODO: Handle errors while loading?
		var sceneModel = new this(data, filename);
		return sceneModel;
	}
}