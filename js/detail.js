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
		this._subEl.classList.add('inner');
		this.el.appendChild(this._subEl);

		this._deltaEl = document.createElement(this.elType);
		this._deltaEl.classList.add('change');
		this.el.appendChild(this._deltaEl);

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
		if (value >= 0 && this.maxValue >= 0 && this._subEl) {
			var delta = this._value - value;
			this._value = value;
			this._subEl.style.width = Lifebar.width(value);

			if (delta) {
				var leftEdge = Lifebar.width(Math.min(value, value+delta));
				this._deltaEl.style.width = Lifebar.width(Math.abs(delta), true);
				this._deltaEl.style.backgroundPositionX = "-"+leftEdge;
				this._deltaEl.style.left = leftEdge;
			}
		}
	}

	get maxValue() {
		return this._maxValue;
	}
	set maxValue(value) {
		if (value >= 0) {
			this._maxValue = value;
			this.el.style.width = Lifebar.width(value);
		}
	}

	static width(value, noPadding) {
		var width = value*6;
		if (width > 0 && !noPadding) width += 2;
		return width+"px";
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

/***************************************************
 Animated sprite effect
***************************************************/
class SpriteEffect extends SpriteElObj {
	constructor(square, duration, ...classList) {
		super();
		this.el.classList.add(...classList)
		setTimeout(() => {
			this.el.parentElement.removeChild(this.el);
		}, duration);
		this.square = square;
		this.el.style.transform = `translate(${square.screenX}px, ${square.screenY}px)`;
		this.el.style.zIndex = square.screenZ;
	}

	get elClass() {
		return 'vfx-sprite';
	}

	animateMove(origin, style) {
		switch (style) {
			case "arc":
				this._animateArc(origin);
				break;
			case "return":
				this._animateReturn(origin);
				break;
			default:
			case "straight":
				this._animateStraight(origin);
				break;
		}
	}
	_animateStraight(origin) {
		var keyframes = [
			{
				transform: origin.screenPosition,
				zIndex: origin.screenZ
			},
			{}];
		var time = 200;
		this.el.animate(keyframes, {duration: time, easing: "linear"});
	}
	_animateArc(origin) {
		var keyframes = [
			{
				transform: origin.screenPosition,
				zIndex: origin.screenZ
			},
			{}];
		var time = 400;
		this.el.animate(keyframes, {duration: time, easing: "linear"});

		var jumpframes = [
			{ },
			{ top: "128px" }
		];
		this.el.animate(jumpframes, {duration: time/2, iterations: 2, direction: "alternate", easing: "ease-out"});
	}
	_animateReturn(origin) {
		var keyframes = [
			{
				transform: origin.screenPosition,
				zIndex: origin.screenZ
			},
			{}];
		var time = 200;
		this.el.animate(keyframes, {duration: time, iterations: 2, direction: "alternate", easing: "ease-out"});
	}
}