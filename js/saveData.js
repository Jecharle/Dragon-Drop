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
	static _save(attribute) {
		var textData = JSON.stringify(this[attribute]);
		localStorage.setItem(attribute, textData);
	}
	static _load(attribute) {
		var textData = localStorage.getItem(attribute);
		if (textData) {
			this[attribute] = JSON.parse(textData);
		}
	}
	static _delete(attribute) {
		localStorage.removeItem(attribute);
	}
	//#endregion save / load
}