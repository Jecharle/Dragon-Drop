/***************************************************
 ElObj
The root class for objects linked to DOM elements
***************************************************/
class ElObj {
	constructor() {
		this.el = document.createElement(this.elType);
		if (this.elClass) this.el.classList.add(this.elClass);
		this.el.obj = this;
		this._style = [];
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
		if (!Array.isArray(value)) {
			value = [value];
		}
		value = value.filter(val => val != null);

		if (this._style.length > 0) {
			this.el.classList.remove(...this._style);
		}
		if (value.length > 0) {
			this.el.classList.add(...value);
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

/***************************************************
 SpriteElObj
The root class for objects with separate sprites
***************************************************/
class SpriteElObj extends ElObj {
	constructor() {
		super();
		this.spriteEl =  document.createElement('div');
		this.spriteEl.classList.add('sprite');
		this.spriteEl.obj = this;
		this.el.appendChild(this.spriteEl);
	}
}

/***************************************************
 UiElObj
The root class for objects with buttons and things
***************************************************/
class UiElObj extends ElObj {

	// TODO: Basic handling for key input too?

	//#region controls
	_addButton(text, onclick, ...classList) {
		var newButton = document.createElement('div');
		newButton.classList.add("button", ...classList);
		newButton.innerText = text;
		newButton.onclick = onclick; // TODO: Put a wrapper around this
		return newButton;
	}

	_addCheckbox(id, ...classList) {
		var newCheckbox = document.createElement('input');
		newCheckbox.classList.add(...classList);
		newCheckbox.type = "checkbox";
		newCheckbox.id = id;
		return newCheckbox;
	}

	_addSlider(id, min, max, ...classList) {
		var newSlider = document.createElement('input');
		newSlider.classList.add(...classList);
		newSlider.type = "range";
		newSlider.min = min;
		newSlider.max = max;
		newSlider.id = id;
		return newSlider;
	}

	_addLabel(text, control, ...classList) {
		var newLabel = document.createElement('label');
		newLabel.classList.add(...classList);
		newLabel.innerText = text;
		if (control) newLabel.htmlFor = control.id;
		return newLabel;
	}

	_addTitle(text, ...classList) {
		var newTitle = document.createElement('h1');
		newTitle.classList.add(...classList);
		newTitle.innerText = text;
		return newTitle;
	}

	_addRow(...classList) {
		var newRow = document.createElement('div');
		newRow.classList.add('menu-row', ...classList);
		return newRow;
	}
	//#endregion controls
}