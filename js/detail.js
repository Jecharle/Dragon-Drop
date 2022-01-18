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

	static numberSprite(value, showPlus) {
		var numberEl = document.createElement('div');
		numberEl.classList.add('icon', 'number');
		numberEl.style.backgroundPositionX = `${-8*Math.abs(value)}px`;
		if (showPlus || value < 0) {
			var signEl = document.createElement('div');
			if (value < 0) signEl.classList.add('minus');
			else signEl.classList.add('plus');
			numberEl.appendChild(signEl);
		}
		return numberEl;
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

	set value(value) {
		this._value = value;
		this.el.innerHTML = `<strong>${value}</strong>`;
	}

	get elClass() {
		return 'phase-banner';
	}
}

/***************************************************
 Skill name banner
***************************************************/
class SkillBanner extends Detail {
	constructor(startValue) {
		super(startValue);
		this.el.addEventListener('animationend', ev => {
			ev.target.parentElement.removeChild(ev.target);
		});
	}

	get elClass() {
		return 'skill-banner';
	}
}

/***************************************************
 Battle end screen
***************************************************/
class EndScreen extends Detail {
	constructor(startValue) {
		super(startValue);
	}

	set value(value) {
		this._value = value;
		this.el.innerHTML = `<strong>${value}</strong>`;
	}

	get elClass() {
		return 'battle-end';
	}
}

/***************************************************
 Lifebar
***************************************************/
class Lifebar extends Detail {
	constructor(startValue, startMaxValue, defenseValue) {
		super();

		this._subEl = document.createElement(this.elType);
		this._subEl.classList.add('inner');
		this.el.appendChild(this._subEl);

		this._deltaEl = document.createElement(this.elType);
		this._deltaEl.classList.add('change');
		this.el.appendChild(this._deltaEl);

		this._defEl = document.createElement(this.elType);
		this._defEl.classList.add('defense');
		this.el.appendChild(this._defEl);

		this.maxValue = startMaxValue;
		this.value = startValue;
		this.defenseValue = defenseValue || 0;
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

	get defenseValue() {
		return this._defense;
	}
	set defenseValue(value) {
		this._defense = value;
		this._defEl.classList.toggle('icon', value != 0);
		this.el.style.marginLeft = (value != 0) ? "8px" : "";

		if (this._defEl.firstChild) this._defEl.removeChild(this._defEl.firstChild);
		if (value) this._defEl.appendChild(Detail.numberSprite(value));
	}

	static width(value, noPadding) {
		var width = value*3;
		if (width > 0 && !noPadding) width += 1;
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
			this._addIcon('power', {
				icon: statusObject[UnitPiece.Power] > 0 ? 'up' : 'down',
				double: Math.abs(statusObject[UnitPiece.Power]) > 1
			});
		}
		if (statusObject[UnitPiece.Defense]) {
			this._addIcon('defense', {
				icon: statusObject[UnitPiece.Defense] > 0 ? 'up' : 'down',
				double: Math.abs(statusObject[UnitPiece.Defense]) > 1
			});
		}
		if (statusObject[UnitPiece.Speed]) {
			this._addIcon('speed', {
				icon: statusObject[UnitPiece.Speed] > 0 ? 'up' : 'down',
				double: Math.abs(statusObject[UnitPiece.Speed]) > 1
			});
		}

		if (statusObject[UnitPiece.Charge]) {
			this._addIcon('power', {
				icon: 'time',
				double: Math.abs(statusObject[UnitPiece.Charge]) > 1
			});
		}
		if (statusObject[UnitPiece.Accelerate]) {
			this._addIcon('speed', {
				icon: 'time',
				double: Math.abs(statusObject[UnitPiece.Accelerate]) > 1
			});
		}


		if (statusObject[UnitPiece.Regenerate]) {
			this._addIcon('regenerate', {
				number: statusObject[UnitPiece.Regenerate]
			});
		}
		if (statusObject[UnitPiece.Burn]) {
			this._addIcon('burn', {
				number: -statusObject[UnitPiece.Burn]
			});
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

	_addIcon(style, props) {
		var newIconEl = this._newIcon(style);
		newIconEl.classList.add('icon', style);
		if (props) {
			if (props.icon) newIconEl.appendChild(this._newIcon(props.icon));
			else if (props.number) newIconEl.appendChild(Detail.numberSprite(props.number, props.plus));
			if (props.double) newIconEl.appendChild(this._newIcon('double'));
		}
		this._subEl.appendChild(newIconEl);
		this._icons.push(newIconEl);
	}
	_newIcon(...styles) {
		var iconEl = document.createElement('div');
		iconEl.classList.add('icon', ...styles);
		return iconEl;
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
	constructor(startValue, ...classList) {
		super(startValue);
		this.el.classList.add(...classList);
		setTimeout(() => {
			this.el.parentElement.removeChild(this.el);
		}, 1000);
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

	set value(value) {
		this._value = value;
		this.el.innerHTML = `<strong>${value}</strong>`;
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
		this.el.innerHTML = `<strong>${value}</strong>`;
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

	_updateText() {
		this.el.innerHTML = `<strong>${this._value}/${this._maxValue}</strong>`;
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
		this.el.classList.add(...classList);
		setTimeout(() => {
			this.el.parentElement.removeChild(this.el);
		}, duration);
		this.square = square;
		this.el.style.transform = square.screenPosition;
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
			{ transform: origin.screenPosition },
			{}];
		var time = 200;
		this.el.animate(keyframes, {duration: time, easing: "linear"});
	}
	_animateArc(origin) {
		var keyframes = [
			{ transform: origin.screenPosition },
			{}];
		var time = 400;
		this.el.animate(keyframes, {duration: time, easing: "linear"});

		var jumpframes = [
			{ },
			{ bottom: "64px" }
		];
		this.spriteEl.animate(jumpframes, {duration: time/2, iterations: 2, direction: "alternate", easing: "ease-out"});
	}
	_animateReturn(origin) {
		var keyframes = [
			{ transform: origin.screenPosition },
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
		if (this._end.hidden || this._start.hidden) {
			this._hide();
			return;
		}

		var dx = (this._end.screenX - this._start.screenX);
		var dy = (this._end.screenY - this._start.screenY);
		var width = Math.sqrt(dx*dx + dy*dy);
		var angle = Math.atan2(dy, dx)*180/Math.PI;
		var screenX = this._start.screenX;
		var screenY = this._start.screenY;

		this.el.style.transform = `translate(${screenX}px, ${screenY}px) rotate(${angle}deg)`;
		this.el.style.width = `${width}px`;
		
		this._show();

		this.inRange = (this._start.inRange && this._end.inRange)
		this.el.classList.toggle('selectable', this.inRange);
	}
}