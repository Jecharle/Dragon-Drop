/***************************************************
 SceneModel
 Load and store data from external files
***************************************************/
class SceneModel {
	// TODO: Generically applicable file-loading routine
}

/***************************************************
 MapSceneModel
***************************************************/
class MapSceneModel extends SceneModel {
	constructor() {
		super();
		// TODO: Load from a file?
		this.width = 0;
		this.height = 0;
		this.startNode = "";
		this.nodes = []; // id, x, y, hidden
		this.events = []; // node id, name, description, eventual effects?
		this.connections = []; // node id 1, node id 2
		// TODO: background image?
	}
}

/***************************************************
 BattleSceneModel
***************************************************/
class BattleSceneModel extends SceneModel {
	constructor() {
		super();
		// TODO: Load from a file?
		this.deployment = []; // x, y
		this.terrain = []; // x, y, terrainType
		this.units = []; // x, y, turn, pieceType, enemy/object
		this.maxTurns = 0;
		this.minTurns = 0;
		this.defaultVictory = false;
		// TODO: Tileset?
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
				node: 'fork',
				type: MapEvent.Story,
				name: "Story Test",
				description: "This will contain some text to test out cutscenes\
				<br/>Let's go multiple lines!",
			},
			{
				node: 'start',
				type: MapEvent.Battle,
				repeatable: true,
				name: "Battle Test",
				description: "This will link back to the battle scene test",
				saveId: 'testMapTestBattle'
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
			},
		];
	}
}

/***************************************************
 TEMP TestBattle
***************************************************/
class TestBattle extends BattleSceneModel {
	constructor() {
		super();

		this.deployment = [
			{x: 3, y: 6},
			{x: 4, y: 6},
			{x: 5, y: 6},
			{x: 6, y: 6}
		];

		this.terrain = [
			{type: Square.Wall, x: 2, y: 5},
			{type: Square.Rough, x: 3, y: 5},
			{type: Square.Wall, x: 4, y: 5},
			{type: Square.Pit, x: 5, y: 5},
			{type: Square.Cover, x: 6, y: 5}
		];

		this.units = [
			{turn: 0, type: TestEnemyUnit, x: 4, y: 4, enemy: true},

			// reinforcements
			{turn: 1, type: TestEnemyUnit, x: 5, y: 4, enemy: true},
			{turn: 1, type: TestEnemyUnit, x: 5, y: 4, enemy: true},
			{turn: 2, type: TestEnemyUnit, x: 6, y: 4, enemy: true}
		];

		// must wait until last reinforcements have appeared
		this.minTurns = 3;
	}
}