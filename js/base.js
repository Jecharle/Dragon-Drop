/***************************************************
 ElObj
The root class for objects linked to DOM elements
***************************************************/
class ElObj {
	constructor() {
		var el = document.createElement(this.elType);
		this.el = el;
		el.obj = this;
	}

	// type of element to create
	get elType() {
		return 'div';
	}
}