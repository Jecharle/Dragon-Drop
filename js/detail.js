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
 Status icon list
***************************************************/
class StatusList extends Detail {
	constructor(statusObject) {
		super();
		this._subEl = document.createElement(this.elType);
		this._subEl.classList.add('inner');
		this.el.appendChild(this._subEl);
		this.value = statusObject;
	}

	get elClass() {
		return 'status-list';
	}

	set value(statusObject) {
		this._clearIcons();
		if (!statusObject) return;
		
		if (statusObject[UnitPiece.Power]) {
			this._addIcon('power', statusObject[UnitPiece.Power] > 0 ? 'up' : 'down');
		}
		if (statusObject[UnitPiece.Defense]) {
			this._addIcon('defense', statusObject[UnitPiece.Defense] > 0 ? 'up' : 'down');
		}
		if (statusObject[UnitPiece.Speed]) {
			this._addIcon('speed', statusObject[UnitPiece.Speed] > 0 ? 'up' : 'down');
		}

		if (statusObject[UnitPiece.Charge]) {
			this._addIcon('power', 'time');
		}

		// TODO: Better way to indicate amount
		if (statusObject[UnitPiece.Regenerate]) {
			this._addIcon('regenerate');
		}
		if (statusObject[UnitPiece.Poison]) {
			this._addIcon(statusObject['_poisonType'], statusObject[UnitPiece.Poison]);
		}

		if (statusObject[UnitPiece.Evade]) {
			this._addIcon('evade');
		}

		if (statusObject[UnitPiece.Anchor]) {
			this._addIcon('anchor');
		}

		if (this._icons.length > 1) {
			this._subEl.style.animationDuration = `${this._icons.length}s`;
			this._subEl.style.animationTimingFunction = `steps(${this._icons.length})`;
		} else {
			this._subEl.style.animationDuration = null;
			this._subEl.style.animationTimingFunction = null;
		}
	}

	_addIcon(style, value) {
		var newIconEl = this._newIcon(style);
		newIconEl.classList.add('icon', style);
		if (value) {
			if (isNaN(value)) newIconEl.appendChild(this._newIcon(value));
			else newIconEl.appendChild(this._newNumber(value));
		}
		this._subEl.appendChild(newIconEl);
		this._icons.push(newIconEl);
	}
	_newIcon(...styles) {
		var iconEl = document.createElement('div');
		iconEl.classList.add('icon', ...styles);
		return iconEl;
	}
	_newNumber(value, showPlus) {
		var numberEl = document.createElement('div');
		numberEl.classList.add('number');
		numberEl.style.backgroundPositionX = `${-16*Math.abs(value)}px`;
		if (value < 0) {
			var signEl = document.createElement('div');
			signEl.classList.add('minus');
			numberEl.appendChild(signEl);
		} else if (showPlus) {
			var signEl = document.createElement('div');
			signEl.classList.add('plus');
			numberEl.appendChild(signEl);
		}
		return numberEl;
	}
	_clearIcons() {
		if (this._icons) this._icons.forEach(el => this._subEl.removeChild(el));
		this._icons = [];
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
 Limited quantity label
***************************************************/
class QuantityLabel extends Detail {
	set value(value) {
		value += "";
		if (value.length) value = "x"+value;
		this._value = value;
		this.el.innerHTML = value;
	}
	get elClass() {
		return 'quantity-label';
	}
}

/***************************************************
 Label showing a current / max value
***************************************************/
class CurrentMaxLabel extends Detail {
	constructor(startValue, startMaxValue) {
		super();

		this.maxValue = startMaxValue;
		this.value = startValue;
	}

	get elClass() {
		return 'capacity-label';
	}

	set value(value) {
		this._value = value;
		this._updateText();	
	}

	get maxValue() {
		return this._maxValue;
	}
	set maxValue(value) {
		this._maxValue = value;
		this._updateText();
	}

	// TODO: Also, text describing what it's counting?
	_updateText() {
		this.el.innerHTML = `${this._value}/${this._maxValue}`;
	}
}

/***************************************************
 Skill description
***************************************************/
class HoverDescription extends Detail {
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

	//#region animate
	static get Straight() { return 0; }
	static get Arc() { return 1; }
	static get Return() { return 2; }

	animateMove(origin, style) {
		switch (style) {
			case SpriteEffect.Arc:
				this._animateArc(origin);
				break;
			case SpriteEffect.Return:
				this._animateReturn(origin);
				break;
			default:
			case SpriteEffect.Straight:
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
			{ top: "-128px" }
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
	//#endregion animate
}

/***************************************************
 Edge connecting map nodes
***************************************************/
class Edge extends ElObj {
	constructor(startPosition, endPosition, oneWay) {
		super();
		this._start = startPosition;
		this._end = endPosition;
		this._oneWay = !!oneWay;
		this.refresh();
	}

	get elClass() { return 'line'; }

	get start() { return this._start; }
	get end() { return this._end; }
	get oneWay() { return this._oneWay; }

	get hidden() {
		return (this._end.hidden || this._start.hidden);
	}

	otherNode(node) {
		if (node == this.start) return this.end;
		else if (node == this.end && !this._oneWay) return this.start;
		else return null;
	}

	refresh() {
		var dx = (this._end.screenX - this._start.screenX);
		var dy = (this._end.screenY - this._start.screenY);
		var width = Math.sqrt(dx*dx + dy*dy);
		var angle = Math.atan2(dy, dx)*180/Math.PI;
		var screenX = this._start.screenX;
		var screenY = this._start.screenY;

		this.el.style.transform = `translate(${screenX}px, ${screenY}px) rotate(${angle}deg)`;
		this.el.style.width = `${width}px`;

		if (this._end.hidden || this._start.hidden) this._hide();
		else this._show();
	}
}