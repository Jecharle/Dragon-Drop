/***************************************************
 Static Shape library object
***************************************************/
class Shape {
	constructor() {
		console.log("Shape is a static object, do not instantiate");
	}

	// standard shapes

	static Square(origin, target, props) {
		if (!origin || !target) return false;
		var dx = origin.x - target.x;
		var dy = origin.y - target.y;
		var minRange = props.minRange || 0;
		if (Math.abs(dx) < minRange && Math.abs(dy) < minRange) return false;
		return true;
	}

	static Line(origin, target, props) {
		if (!origin || !target) return false;
		var dx = origin.x - target.x;
		var dy = origin.y - target.y;
		var minRange = props.minRange || 0;
		if (dx && dy) return false;
		if (Math.abs(dx) < minRange && Math.abs(dy) < minRange) return false;
		return true;
	}

	static Cross(origin, target, props) {
		if (!origin || !target) return false;
		var dx = origin.x - target.x;
		var dy = origin.y - target.y;
		var minRange = props.minRange || 0;
		if (Math.abs(dx) != Math.abs(dy)) return false;
		if (Math.abs(dx) < minRange && Math.abs(dy) < minRange) return false;
		return true;
	}

	static Star(origin, target, props) {
		return Shape.Line(origin, target, props) || Shape.Cross(origin, target, props);
	}

	static Circle(origin, target, props) {
		if (!origin || !target) return false;
		var dx = origin.x - target.x;
		var dy = origin.y - target.y;
		var range = props.range;
		var minRange = props.minRange || 0;
		if (Math.abs(dx) + Math.abs(dy) > range) return false;
		if (Math.abs(dx) + Math.abs(dy) < minRange) return false;
		return true;
	}

	// special conditions

	static CanSee(origin, target, props) {
		if (!origin || !target || origin.parent != target.parent) return false;
		if (origin == target) return true;
		
		var board = origin.parent;

		var x = origin.x;
		var y = origin.y;
		var tx = target.x;
		var ty = target.y;
		while (true) {
			// It's not a straight line, but close enough for how I'm using it
			if (x < tx) x++;
			else if (x > tx) x--;
			if (y < ty) y++;
			else if (y > ty) y--;

			var square = board.at(x, y);
			if (square && (square.terrain & Square.BlockSight)) return false;
			if (x == tx && y == ty) return true;
			if (square.piece) return false; // TODO: Use props to decide which pieces block LoS
		}
	}

	static NearPiece(origin, target, props) {
		if (!target) return false;
		return target.parent.getAdjacent(target).some(square => {
			if (square.piece) return true; // TODO: Use props to decide which pieces count
			else return false;
		});
	}
}