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
	constructor() {
		super();
		this.width = 0;
		this.height = 0;
		this.startNode = "";
		this.nodes = []; // id, x, y, hidden
		this.events = []; // node id, name, description, filename, extra parameters
		this.connections = []; // node id 1, node id 2, one-way
		// TODO: background image?
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
		// TODO: Handle errors while loading
		var sceneModel = new BattleSceneModel(data);
		return sceneModel;
	}
}


/***************************************************
 TEMP TestMap
***************************************************/
class TestMap extends MapSceneModel {
	constructor() {
		super();

		this.width = 1024;
		this.height = 1000;

		this.startNode = 'start';

		this.nodes = [
			{id: 'start', x: 4*64, y: 5*64},
			{id: 'second', x: 4*64, y: 8*64, hidden: true},
			{id: 'fork', x: 7*64, y: 7*64},
			{id: 'tail', x: 9*64, y: 9*64, hidden: true},
			{id: 'last', x: 8*64, y: 4*64},

			{id: 'island', x: 12*64, y: 12*64},
			{id: 'island2', x: 11*64, y: 13*64},
		];
		this.connections = [
			{a: 'start', b: 'second'},
			{a: 'second', b: 'fork'},
			{a: 'fork', b: 'tail'},
			{a: 'fork', b: 'last'},
			{a: 'last', b: 'start'},

			{a: 'island', b: 'island2'},
		];

		this.events = [
			{
				node: 'start',
				type: MapEvent.Battle,
				filename: "testBattle",
				repeatable: true,
				name: "Battle Test",
				description: "This will link back to the battle scene test",
				saveId: 'testMapTestBattle'
			},
			{
				node: 'fork',
				type: MapEvent.Story,
				name: "Story Test",
				description: "This will contain some text to test out cutscenes\
				<br/>Let's go multiple lines!",
			},
			{ 
				node: 'tail',
				type: MapEvent.Move,
				param: 'island',
				repeatable: true,
				name: "Ferry",
				description: "The ferry will take you to the island"
			},
			{ 
				node: 'island',
				type: MapEvent.Move,
				param: 'tail',
				repeatable: true,
				name: "Ferry",
				description: "The ferry will take you back to the mainland"
			}
		];
	}
}