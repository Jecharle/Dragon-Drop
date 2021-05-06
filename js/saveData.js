/***************************************************
 Static objects containing progress, settings etc.
***************************************************/
class SaveData {

	static mapEvent = {};
	static options = {};

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
		this._loadAttribute('mapEvent');
		this._loadAttribute('options');
	}
	static saveAll() {
		this._saveAttribute('mapEvent');
		this._saveAttribute('options');
	}
	/**
	 * WARNING: THIS WILL IN FACT ERASE *ALL* SAVED PROGRESS AND SETTINGS
	 */
	static clearAll() {
		this.storage.clear();
	}

	// TODO: Specific load/save functions for different groupings of data?
	//#endregion save / load
}