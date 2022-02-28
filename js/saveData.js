/***************************************************
 Static objects containing progress, settings etc.
***************************************************/
class SaveData {

	static flags = {};
	static mapEvent = {};
	static options = {};

	//#region flags
	static setFlag(flag, value) {
		if (!flag) return;
		this.flags[flag] = value;
	}
	static getFlag(flag) {
		if (!flag) return 0;
		return this.flags[flag] || 0;
	}
	//#endregion flag

	//#region mapEvent
	static setEventClear(eventId) {
		if (!eventId) return;
		this.mapEvent[eventId] = 1;
	}
	static getEventClear(eventId) {
		if (!eventId) return false;
		return !!this.mapEvent[eventId];
	}
	//#endregion mapEvent

	//#region options
	static setOption(option, value) {
		if (!option) return;
		this.options[option] = value;
	}
	static getOption(option) {
		if (!option) return 0;
		return this.options[option] || 0;
	}

	static get textSpeed() {
		return 1-this.getOption('textSpeed');
	}
	static set textSpeed(value) {
		this.setOption('textSpeed', 1-value);
	}

	static get textAuto() {
		return !!this.getOption('textAuto');
	}
	static set textAuto(value) {
		this.setOption('textAuto', !!value);
	}

	static get confirmEndTurn() {
		return !this.getOption('confirmTurnEnd');
	}
	static set confirmEndTurn(value) {
		this.setOption('confirmTurnEnd', !value);
	}

	static get autoFace() {
		return !!this.getOption('autoFace');
	}
	static set autoFace(value) {
		this.setOption('autoFace', !!value);
	}

	static get sfxVolume() {
		return 10-this.getOption('sfxVolume');
	}
	static set sfxVolume(value) {
		this.setOption('sfxVolume', 10-value);
	}

	static get bgmVolume() {
		return 10-this.getOption('bgmVolume');
	}
	static set bgmVolume(value) {
		this.setOption('bgmVolume', 10-value);
	}
	//#endregion options

	//#region save / load
	static get storage() { return localStorage; }

	static _saveAttribute(attribute) {
		var textData = JSON.stringify(this[attribute]);
		if (textData) {
			this.storage.setItem(attribute, textData);
		} else {
			this.storage.removeItem(attribute);
		}
	}
	static _loadAttribute(attribute) {
		var textData = this.storage.getItem(attribute);
		if (textData) {
			this[attribute] = JSON.parse(textData);
		} else {
			this[attribute] = {};
		}
	}
	static _clearAttribute(attribute) {
		this[attribute] = {};
		this.storage.removeItem(attribute);
	}

	static loadAll() {
		this._loadAttribute('flags');
		this._loadAttribute('mapEvent');
		this._loadAttribute('options');
	}
	static saveAll() {
		this._saveAttribute('flags');
		this._saveAttribute('mapEvent');
		this._saveAttribute('options');
	}
	/**
	 * WARNING: THIS WILL IN FACT ERASE *ALL* SAVED PROGRESS AND SETTINGS
	 */
	static clearAll() {
		this.storage.clear();
		this.loadAll();
	}

	static loadMap() {
		this._loadAttribute('mapEvent');
	}
	static saveMap() {
		this._saveAttribute('mapEvent');
	}
	static clearMap() {
		this._clearAttribute('mapEvent');
	}

	static loadFlags() {
		this._loadAttribute('flags');
	}
	static saveFlags() {
		this._saveAttribute('flags');
	}
	static clearFlags() {
		this._clearAttribute('flags');
	}

	static loadOptions() {
		this._loadAttribute('options');
	}
	static saveOptions() {
		this._saveAttribute('options');
	}
	static clearOptions() {
		this._clearAttribute('options');
	}
	//#endregion save / load
}