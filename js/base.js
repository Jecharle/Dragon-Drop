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

	get style() {
		return this._style;
	}
	set style(value) {
		if (this._style) {
			this.el.classList.remove(this._style);
		}
		if (value) {
			this.el.classList.add(value);
		}
		this._style = value;
	}
}