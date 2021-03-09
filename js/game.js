/***************************************************
 Static Game object
 ***************************************************/
class Game {
	constructor() {
		console.log("Game object is static, do not instantiate");
	}

	static scene = function() {
		return Game._scene;
	}
	static setScene = function(scene) {
		if (Game._scene == scene) return;

		if (Game._scene != null) {
			Game._gameDiv.removeChild(Game._scene.el);
			Game._scene.end();
		}

		Game._scene = scene;
		Game._gameDiv.appendChild(scene.el);
		Game._scene.start();
	}

	static globalKeydown = function(ev) {
		var scene = Game.scene();
		if (scene && !ev.repeat) scene.keydown(ev.key);
	}
	static globalKeyup = function(ev) {
		var scene = Game.scene();
		if (scene && !ev.repeat) scene.keyup(ev.key);
	}

	static begin = function() {
		document.addEventListener('keydown', Game.globalKeydown);
		document.addEventListener('keyup', Game.globalKeyup);

		Game._gameDiv = document.createElement("div");
		Game._gameDiv.classList.add("centered");
		Game._gameDiv.id = "gameDiv";
		document.body.appendChild(Game._gameDiv);

		Game.setScene(new TestScene()); // TEMP
	}
}
Game.begin();