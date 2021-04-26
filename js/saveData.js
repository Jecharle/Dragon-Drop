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
	static _saveAttribute(attribute) {
		var textData = JSON.stringify(this[attribute]);
		if (textData) {
			localStorage.setItem(attribute, textData);
		} else {
			this._clearAttribute(attribute);
		}
	}
	static _loadAttribute(attribute) {
		var textData = localStorage.getItem(attribute);
		if (textData) {
			this[attribute] = JSON.parse(textData);
		}
	}
	static _clearAttribute(attribute) {
		localStorage.removeItem(attribute);
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
		localStorage.clear();
	}

	// TODO: Specific load/save functions for different groupings of data?
	//#endregion save / load
}