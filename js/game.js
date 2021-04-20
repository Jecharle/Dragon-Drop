/***************************************************
(Static) Handles global input and processes Scenes
***************************************************/
class Game {
	constructor() {
		console.log("Game object is static, do not instantiate");
	}

	static get scene() {
		return Game._scene;
	}
	static setScene(scene) {
		if (Game._scene == scene) return;

		if (Game._scene != null) {
			Game.el.removeChild(Game._scene.el);
			Game._scene.end();
		}

		Game._scene = scene;
		Game.el.appendChild(scene.el);
		Game._scene.start();
	}

	static globalKeydown(ev) {
		if (Game.scene && !ev.repeat) Game.scene.keydown(ev.key);
	}
	static globalKeyup(ev) {
		if (Game.scene && !ev.repeat) Game.scene.keyup(ev.key);
	}
	static beforeUnload(ev) {
		return null//Game.scene.unsaved || null; // DISABLED FOR TESTING
	}

	static async asyncPause(milliseconds) {
		if (!milliseconds || milliseconds < 0) return;

		var timeout = new Promise((resolve, _reject) => {
			setTimeout(() => resolve(), milliseconds);
		});
		return await timeout;
	}

	static begin() {
		document.addEventListener('keydown', Game.globalKeydown);
		document.addEventListener('keyup', Game.globalKeyup);

		Game.el = document.createElement("div");
		Game.el.classList.add("game-window");
		document.body.appendChild(Game.el);

		// TEMP
		Party.add(new TestMeleePartyMember());
		Party.add(new TestSupportPartyMember());
		Party.add(new TestPositionPartyMember());
		Game.setScene(new BattleScene( new TestMap(), Party.getUnits() ));
	}
}
Game.begin();