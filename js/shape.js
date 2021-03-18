/***************************************************
 Static Shape library object
***************************************************/
class Shape {
	constructor() {
		console.log("Shape is a static object, do not instantiate");
	}

	static Square(origin, target, props) {
		if (!origin || !target) return false;
		var x = origin.x - target.x;
		var y = origin.y - target.y;
		var minRange = props.minRange || 0;
		if (Math.abs(x) < minRange && Math.abs(y) < minRange) return false;
		return true;
	}

	static Line(origin, target, props) {
		if (!origin || !target) return false;
		var x = origin.x - target.x;
		var y = origin.y - target.y;
		var minRange = props.minRange || 0;
		if (x && y) return false;
		if (Math.abs(x) < minRange && Math.abs(y) < minRange) return false;
		return true;
	}

	static Cross(origin, target, props) {
		if (!origin || !target) return false;
		var x = origin.x - target.x;
		var y = origin.y - target.y;
		var minRange = props.minRange || 0;
		if (Math.abs(x) != Math.abs(y)) return false;
		if (Math.abs(x) < minRange && Math.abs(y) < minRange) return false;
		return true;
	}

	static Star(origin, target, props) {
		return Shape.Line(origin, target, props) || Shape.Cross(origin, target, props);
	}

	static Circle(origin, target, props) {
		if (!origin || !target) return false;
		var x = origin.x - target.x;
		var y = origin.y - target.y;
		var range = props.range;
		var minRange = props.minRange || 0;
		if (Math.abs(x) + Math.abs(y) > range) return false;
		if (Math.abs(x) + Math.abs(y) < minRange) return false;
		return true;
	}

	static LineOfSight(origin, target, props) {
		// TODO: Props can specify what counts as blocking?
		return origin.parent.canSee(origin, target, props);
	}
}