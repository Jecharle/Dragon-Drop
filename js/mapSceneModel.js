/***************************************************
 MapSceneModel
Used to store world map data loaded from elsewhere
***************************************************/
class MapSceneModel {
	constructor() {
		// TODO: Load from an XML file?
		this._width = 0;
		this._height = 0;
		this._startNode = "";
		this._nodes = []; // id, x, y, hidden
		this._events = []; // node id, name, description, eventual effects?
		this._connections = []; // node id 1, node id 2
	}

	get width() {
		return this._width;
	}
	get height() {
		return this._height;
	}

	get startNode() {
		return this._startNode;
	}

	get nodes() {
		return this._nodes;
	}
	get connections() {
		return this._connections;
	}
	get events() {
		return this._events;
	}

	// TODO: background?
}

/***************************************************
 TestMap
***************************************************/
class TestMap extends MapSceneModel { // TEMP
	constructor() {
		super();

		this._width = 1024;
		this._height = 1000;

		this._startNode = 'start';

		this._nodes.push(
			{id: 'start', x: 4*64, y: 5*64},
			{id: 'second', x: 4*64, y: 8*64},
			{id: 'fork', x: 7*64, y: 7*64},
			{id: 'tail', x: 9*64, y: 9*64, hidden: true},
			{id: 'last', x: 8*64, y: 4*64},
		);
		this._connections.push(
			{a: 'start', b: 'second'},
			{a: 'second', b: 'fork'},
			{a: 'fork', b: 'tail'},
			{a: 'fork', b: 'last'},
			{a: 'last', b: 'start'},
		);

		this._events.push(
			{
				node: 'fork',
				type: MapEvent.Battle,
				repeatable: true,
				name: "Battle Test",
				description: "This will link back to the battle scene test",
			},
			{
				node: 'tail',
				type: MapEvent.Story,
				name: "Story Test",
				description: "This will contain some text to test out cutscenes\
				<br/>Let's go multiple lines!",
			},
		)
	}
}