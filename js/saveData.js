/***************************************************
 Static objects containing progress, settings etc.
***************************************************/
class SaveData {

	static mapEvent = {};
	static options = {};

	static setEventClear(eventId) {
		if (!eventId) return;
		this.mapEvent[eventId] = true;
	}
	static getEventClear(eventId) {
		if (!eventId) return false;
		return !!this.mapEvent[eventId];
	}
}