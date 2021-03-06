/***************************************************
 Static Game object
 ***************************************************/
function Game() {
	console.log("Game object is static, do not instantiate");
};

Game.scene = function() {
	return this._scene;
};
Game.setScene = function(scene) {
	if (this._scene == scene) return;

	if (this._scene != null) {
		this._gameDiv.removeChild(this._scene.el);
		this._scene.end();
	}

	this._scene = scene;
	this._gameDiv.appendChild(scene.el);
	this._scene.start();
};

Game.globalKeydown = function(ev) {
	var scene = Game.scene();
	if (scene && !ev.repeat) scene.keydown(ev.key);
};
Game.globalKeyup = function(ev) {
	var scene = Game.scene();
	if (scene && !ev.repeat) scene.keyup(ev.key);
};

Game.begin = function() {
	document.addEventListener('keydown', Game.globalKeydown);
	document.addEventListener('keyup', Game.globalKeyup);

	this._gameDiv = document.createElement("div");
	this._gameDiv.classList.add("centered");
	this._gameDiv.id = "gameDiv";
	document.body.appendChild(this._gameDiv);

	this.setScene(new TestScene()); // TEMP
};

Game.begin();