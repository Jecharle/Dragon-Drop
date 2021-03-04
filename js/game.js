/***************************************************
 Static Game object
 ***************************************************/
function Game() {
	console.log("Game object is static, do not instantiate");
};

// track the active scene
Game.scene = function() {
	return this._scene;
};

Game.setScene = function(scene) {
	if (this._scene == scene) return;

	if (this._scene != null) {
		document.body.removeChild(this._scene.el);
		this._scene.end();
	}

	this._scene = scene;
	document.body.appendChild(scene.el);
	this._scene.start();
};

// capture key inputs
Game.globalKeydown = function(ev) {
	var scene = Game.scene();
	if (scene && !ev.repeat) scene.keydown(ev.key);
};

Game.globalKeyup = function(ev) {
	var scene = Game.scene();
	if (scene && !ev.repeat) scene.keyup(ev.key);
};

// what to do on boot
Game.begin = function() {
	document.addEventListener('keydown', Game.globalKeydown);
	document.addEventListener('keyup', Game.globalKeyup);

	this.setScene(new TestScene()); // TEMP
};

Game.begin();