/***************************************************
 Static objects containing progress, settings etc.
***************************************************/
class Progress {
	constructor() {
		this._nodeStatus = {};
	}

	// TODO: store other forms of progress, too? 

	//#region node status
	static nodeStatus(fullId) {
		return this._nodeStatus[fullId];
	}
	static setNodeStatus(fullId, value) {
		this._nodeStatus[fullId] = value;
	}
	//#endregion node status
}

// TODO: Options, other unlocks, etc?