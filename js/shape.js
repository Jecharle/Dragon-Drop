/***************************************************
 Static Shape library object
 ***************************************************/
class Shape {
    constructor() {
        console.log("Shape is a static object, do not instantiate");
    }

    static Square(x, y, props) {
        var minRange = props.minRange || 0;
        if (Math.abs(x) < minRange && Math.abs(y) < minRange) return false;
        return true;
    }

    static Line(x, y, props) {
        var minRange = props.minRange || 0;
        if (x && y) return false;
        if (Math.abs(x) < minRange && Math.abs(y) < minRange) return false;
        return true;
    }

    static Cross(x, y, props) {
        var minRange = props.minRange || 0;
        if (Math.abs(x) != Math.abs(y)) return false;
        if (Math.abs(x) < minRange && Math.abs(y) < minRange) return false;
        return true;
    }

    static Star(x, y, props) {
        return Shape.Line(x, y, props) || Shape.Cross(x, y, props);
    }

    static Circle(x, y, props) {
        var range = props.range || 1;
        var minRange = props.minRange || 0;
        if (Math.abs(x) + Math.abs(y) > range) return false;
        if (Math.abs(x) + Math.abs(y) < minRange) return false;
        return true;
    }
}