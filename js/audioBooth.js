/***************************************************
 Class for playing sound effects
***************************************************/
class Sfx {
	static _sfxLibrary = {};

	static getSfx(path) {
		path = path || "/ERROR/";

		if (!this._sfxLibrary[path]) {
			var newSound = new Audio(`../sfx/${path}`);
			this._sfxLibrary[path] = new Sfx(newSound);
		}
		return this._sfxLibrary[path];
	}

	constructor(audio) {
		this._audio = audio;
	}

	play() {
		if (SaveData.sfxVolume <= 0) return;
		this._audio.volume = (SaveData.sfxVolume / 10);
		this._audio.play();
	}
}

/***************************************************
 Class for playing background music
***************************************************/
class Bgm {
	static _audio = null;
	static _path = null;

	static play(path, startTime, playOnce) {
		if (!this._audio) {
			this._audio = new Audio();
		}

		this.refreshVolume();

		if (!path) {
			this._path = "";
			this._audio.pause();
		} else if (path != this._path || this._audio.paused) {
			this._path = path;
			this._audio.src = `../bgm/${path}`;
			this._audio.autoplay = true;
			this._audio.loop = !playOnce;
			this._audio.load();
			if (startTime > 0) this._audio.currentTime = startTime;
		}	
	}

	static stop() {
		this._audio?.pause();
		return this._audio?.currentTime || 0;
	}

	static resume() {
		if (this._audio?.paused) {
			this._audio?.play();
		}
	}

	static nowPlaying() {
		return this._path;
	}

	static refreshVolume() {
		if (this._audio) {
			this._audio.volume = (SaveData.bgmVolume / 10);
		}
	}
}