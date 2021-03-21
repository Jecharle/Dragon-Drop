/***************************************************
 ElObj
The root class for objects linked to DOM elements
***************************************************/
class ElObj {
	constructor() {
		var el = document.createElement(this.elType);
		if (this.elClass) el.classList.add(this.elClass);
		this.el = el;
		el.obj = this;
	}

	get elType() {
		return 'div';
	}
	get elClass() {
		return '';
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