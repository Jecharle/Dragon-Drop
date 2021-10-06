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
	static async setScene(scene) {
		if (this._scene == scene) return;

		if (this._scene) {
			this._scene.end();
			this._scene.addTimedClass(550, "outro");
			await this.asyncPause(500);
			this.el.removeChild(this._scene.el);
		}

		this._scene = scene;

		if (this._scene) {
			this.el.appendChild(this._scene.el);
			this._scene.start();
			this._scene.addTimedClass(550, "intro");
		}
	}

	static globalKeydown(ev) {
		if (Game.scene && !ev.repeat) Game.scene.keydown(ev.key);
	}
	static globalKeyup(ev) {
		if (Game.scene && !ev.repeat) Game.scene.keyup(ev.key);
	}
	static beforeUnload(ev) {
		return null;//Game.scene.unsaved || null; // TEMP disabled for testing
	}

	static get width() {
		return 512;
	}
	static get height() {
		return 384;
	}

	static async asyncPause(milliseconds) {
		if (!milliseconds || milliseconds < 0) return;

		var timeout = new Promise((resolve, _reject) => {
			setTimeout(() => resolve(), milliseconds);
		});
		return await timeout;
	}
	static showLoading() {
		this.el.classList.add('loading');
	}
	static hideLoading() {
		this.el.classList.remove('loading');
	}

	static begin() {
		document.addEventListener('keydown', this.globalKeydown);
		document.addEventListener('keyup', this.globalKeyup);

		this.el = document.createElement("div");
		this.el.classList.add('game-window');
		document.body.appendChild(this.el);

		SaveData.loadAll();

		// TEMP initial party setup
		Party.add(new TestMeleePartyMember());
		Party.add(new TestSupportPartyMember());
		Party.add(new TestPositionPartyMember());
		Party.add(new TestStatusPartyMember() );

		/*MapSceneModel.load("testMap").then(mapModel => {
			this.setScene(new MapScene(null, mapModel));
		});*/
		BattleSceneModel.load("testBattle").then(battleModel => {
			this.setScene(new BattleScene(null, battleModel));
		});
	}
}
Game.begin();