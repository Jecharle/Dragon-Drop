/***************************************************
(Static) Handles global input and processes Scenes
***************************************************/
class Game {
	constructor() {
		console.log("Game object is static, do not instantiate");
	}

	static get scene() {
		return this._scene;
	}
	static setScene(scene) {
		if (this._scene == scene) return;

		if (this._scene) {
			this.el.removeChild(this._scene.el);
			this._scene.end();
		}

		this._scene = scene;

		if (this._scene) {
			this.el.appendChild(this._scene.el);
			this._scene.start();
		}
	}

	static globalKeydown(ev) {
		if (Game.scene && !ev.repeat) Game.scene.keydown(ev.key);
	}
	static globalKeyup(ev) {
		if (Game.scene && !ev.repeat) Game.scene.keyup(ev.key);
	}
	static beforeUnload(ev) {
		return Game.scene.unsaved || null;
	}

	static async asyncPause(milliseconds) {
		if (!milliseconds || milliseconds < 0) return;

		var timeout = new Promise((resolve, _reject) => {
			setTimeout(() => resolve(), milliseconds);
		});
		return await timeout;
	}

	static begin() {
		document.addEventListener('keydown', this.globalKeydown);
		document.addEventListener('keyup', this.globalKeyup);

		this.el = document.createElement("div");
		this.el.classList.add("game-window");
		document.body.appendChild(this.el);

		// TEMP
		Party.add(new TestMeleePartyMember());
		Party.add(new TestSupportPartyMember());
		Party.add(new TestPositionPartyMember());
		//this.setScene(new BattleScene( null, new TestBattle(), Party.getUnits() ));
		this.setScene(new MapScene( null, new TestMap() ));
	}
}
Game.begin();