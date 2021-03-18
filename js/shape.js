/***************************************************
 Static Shape library object
***************************************************/
class Shape {
	constructor() {
		console.log("Shape is a static object, do not instantiate");
	}

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

	static LineOfSight(origin, target, props) {
		return origin.parent.canSee(origin, target, props);
	}
}