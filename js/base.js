/***************************************************
 ElObj
 The root class for objects linked to DOM elements
 ***************************************************/
 class ElObj {
	constructor() {
		var el = document.createElement(this.elType());
		this.el = el;
		el.obj = this;
	}

	// type of element to create
	elType() {
		return 'div';
	}
}