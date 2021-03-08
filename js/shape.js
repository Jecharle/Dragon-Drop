/***************************************************
 Static Shape library object
 ***************************************************/
function Shape() {
    console.log("Shape is a static object, do not instantiate");
};

 Shape.Square = function(x, y, size) {
    return true;
};

Shape.Line = function(x, y, size) {
    if (x && y) return false;
    return true;
};

Shape.Cross = function(x, y, size) {
    if (Math.abs(x) != Math.abs(y)) return false;
    return true;
};

Shape.Star = function(x, y, size) {
    return this.Line(x, y, size) || this.Cross(x, y, size);
};

Shape.Circle = function(x, y, size) {
    if (Math.abs(x) + Math.abs(y) > size / 2) return false;
    return true;
};