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
 Phase change banner
***************************************************/
class PhaseBanner extends Detail {
	constructor(startValue) {
		super(startValue);
		this.el.addEventListener('animationend', ev => {
			ev.target.parentElement.removeChild(ev.target);
		});
	}

	get elClass() {
		return 'phase-banner';
	}
}

/***************************************************
 Battle end screen
***************************************************/
class EndScreen extends Detail {
	constructor(startValue) {
		super(startValue);
	}

	get elClass() {
		return 'battle-end';
	}
}

/***************************************************
 Lifebar
***************************************************/
class Lifebar extends Detail {
	constructor(startValue, startMaxValue) {
		super();

		this._subEl = document.createElement(this.elType);
		this.el.appendChild(this._subEl);
		this.maxValue = startMaxValue;
		this.value = startValue;
	}

	get elType() {
		return 'div';
	}
	get elClass() {
		return 'lifebar';
	}

	set value(value) {
		if (value >= 0 && this.maxValue > 0 && this._subEl) {
			this._value = value;
			this._subEl.style.width = String(value*6+2)+"px";
		}
	}

	get maxValue() {
		return this._maxValue;
	}
	set maxValue(value) {
		if (value > 0) {
			this._maxValue = value;
			this.el.style.width = String(value*6+2)+"px";
		}
	}
}

/***************************************************
 Popup text
***************************************************/
class PopupText extends Detail {
	constructor(startValue) {
		super(startValue);
		this.el.addEventListener('animationend', ev => {
			ev.target.parentElement.removeChild(ev.target);
		});
	}

	get elClass() {
		return 'popup-text';
	}
}

/***************************************************
 Cooldown label
***************************************************/
class CooldownLabel extends Detail {
	get elClass() {
		return 'cooldown-label';
	}
}

/***************************************************
 Skill description
***************************************************/
class SkillDescription extends Detail {
	get elType() {
		return 'div';
	}
	get elClass() {
		return 'skill-description';
	}
}