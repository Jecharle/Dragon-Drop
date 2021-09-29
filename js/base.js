/***************************************************
 ElObj
The root class for objects linked to DOM elements
***************************************************/
class ElObj {
	constructor() {
		this.el = document.createElement(this.elType);
		if (this.elClass) this.el.classList.add(this.elClass);
		this.el.obj = this;
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

	_hide() {
		this.el.style.display = "none";
	}
	_show() {
		this.el.style.display = "";
	}

	addTimedClass(duration, ...classList) {
		this.el.classList.add(...classList);
		setTimeout(() => this.el.classList.remove(...classList), duration);
	}
}

class SpriteElObj extends ElObj {
	constructor() {
		super();
		this.spriteEl =  document.createElement('div');
		this.spriteEl.classList.add('sprite');
		this.spriteEl.obj = this;
		this.el.appendChild(this.spriteEl);
	}
}