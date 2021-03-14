/***************************************************
 Detail
The root class for popup numbers, cooldowns,
lifebars, and other displays on pieces
***************************************************/
class Detail extends ElObj {
	constructor(startValue) {
		super();
		this.value = startValue;
	}

	get value() {
		return this._value;
	}
	set value(value) {
		this._value = value;
		this.el.innerHTML = ""+value;
	}

	get elType() {
		return 'span';
	}
};

/***************************************************
 Lifebar
***************************************************/
class Lifebar extends Detail {
	constructor(startValue) {
		super();
		this.el.classList.add('lifebar');

		this._subEl = document.createElement(this.elType); // TEMP?
		this._subEl.classList.add('inner-lifebar');
		this.el.appendChild(this._subEl);
		this.value = startValue;
	}

	get elType() {
		return 'div';
	}

	set value(value) {
		if (value >= 0 && value <= 1 && this._subEl) {
			this._value = value;
			this._subEl.style.width = String(Math.floor(value*100))+"%";
		}
	}
}

/***************************************************
 PopupText
***************************************************/
class PopupText extends Detail {
	constructor(startValue) {
		super(startValue);
		this.el.classList.add('popup-text');
		this.el.addEventListener('animationend', ev => {
			ev.target.parentElement.removeChild(ev.target);
		});
	}
}

/***************************************************
 CooldownLabel
***************************************************/
class CooldownLabel extends Detail {
	constructor(startValue) {
		super(startValue);
		this.el.classList.add('cooldown-label');
	}
}

/***************************************************
 Skill Description
***************************************************/
class SkillDescription extends Detail {
	constructor(startValue) {
		super(startValue);
		this.el.classList.add('skill-description');
	}

	get elType() {
		return 'div';
	}
}