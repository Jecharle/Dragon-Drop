/***************************************************
 Static Shape library object
 ***************************************************/
function Shape() {
    console.log("Shape is a static object, do not instantiate");
};

Shape.Square = function(x, y, size, minSize) {
    if (Math.abs(x) < minSize && Math.abs(y) < minSize) return false;
    return true;
};

Shape.Line = function(x, y, size, minSize) {
    if (x && y) return false;
    if (Math.abs(x) < minSize && Math.abs(y) < minSize) return false;
    return true;
};

Shape.Cross = function(x, y, size, minSize) {
    if (Math.abs(x) != Math.abs(y)) return false;
    if (Math.abs(x) < minSize && Math.abs(y) < minSize) return false;
    return true;
};

Shape.Star = function(x, y, size, minSize) {
    return this.Line(x, y, size, minSize) || this.Cross(x, y, size, minSize);
};

Shape.Circle = function(x, y, size, minSize) {
    if (Math.abs(x) + Math.abs(y) > size ) return false;
    if (Math.abs(x) + Math.abs(y) < minSize ) return false;
    return true;
};