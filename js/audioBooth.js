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
	static _bgmLibrary = {};
	static _audio = null;
	static _nowPlaying = null;

	static getBgm(path) {
		if (!path) return null;

		if (!this._audio) {
			this._audio = new Audio();
			this._audio.loop = true;
		}

		if (!this._bgmLibrary[path]) {
			this._bgmLibrary[path] = new Bgm(path);
		}
		return this._bgmLibrary[path];
	}

	constructor(track) {
		this._track = track;
		this._pausedAt = 0;
	}

	play(startPosition) {
		Bgm._audio.volume = (SaveData.bgmVolume / 10);
		Bgm._audio.src = `../bgm/${this._track}`;
		Bgm._audio.load();
		Bgm._audio.currentTime = startPosition || 0;
		Bgm._audio.play();
		Bgm._nowPlaying = this;
	}

	stop() {
		Bgm._audio.pause();
		this._pausedAt = Bgm._audio.currentTime;
	}

	resume() {
		if (Bgm._audio.paused) {
			this.play(this._pausedAt);
		}
	}

	static nowPlaying() {
		return this._nowPlaying;
	}

	static refreshVolume() {
		if (this._audio) {
			this._audio.volume = (SaveData.bgmVolume / 10);
		}
	}
}