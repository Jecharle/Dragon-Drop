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

	//#region save / load
	static get storage() { return sessionStorage; } // TEMP: Don't keep saves while I'm testing things

	static _saveAttribute(attribute) {
		var textData = JSON.stringify(this[attribute]);
		if (textData) {
			this.storage.setItem(attribute, textData);
		} else {
			this._clearAttribute(attribute);
		}
	}
	static _loadAttribute(attribute) {
		var textData = this.storage.getItem(attribute);
		if (textData) {
			this[attribute] = JSON.parse(textData);
		}
	}
	static _clearAttribute(attribute) {
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
	//#endregion save / load
}