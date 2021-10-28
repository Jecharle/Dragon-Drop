/***************************************************
 Static object that handles sound & music playback
***************************************************/
class AudioBooth {
	static sfx = {};
	static bgm = {};
	static _bgmAudio = null;

	static getSfx(path) {
		if (!path) return null;

		if (!this.sfx[path]) {
			var newSound = new Audio("../sfx/"+path);
			this.sfx[path] = new Sfx(newSound);
		}
		return this.sfx[path];
	}

	static getBgm(path) {
		if (!path) return null;

		if (!this._bgmAudio) {
			this._bgmAudio = new Audio();
			this._bgmAudio.loop = true;
		}

		if (!this.bgm[path]) {
			this.bgm[path] = new Bgm(this._bgmAudio, path);
		}
		return this.bgm[path];
	}

	static stopBgm() {
		if (this._bgmAudio) {
			this._bgmAudio.pause();
		}
	}

	static refreshBgmVolume() {
		if (this._bgmAudio) {
			this._bgmAudio.volume = (SaveData.bgmVolume / 10);
		}
	}
}

/***************************************************
 AudioBooth -> Sfx
 Wrapper for playing sound effects
***************************************************/
class Sfx {
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
 AudioBooth -> Bgm
 Wrapper for background music
***************************************************/
class Bgm {
	constructor(audio, track) {
		this._audio = audio;
		this._track = track;
		this._pausedAt = 0;
	}

	play(startPosition) {
		this._audio.pause();
		this._audio.volume = (SaveData.bgmVolume / 10);
		this._audio.src = "../bgm/"+this._track;
		this._audio.load();
		this._audio.currentTime = startPosition || 0;
		this._audio.play();
	}

	stop() {
		this._audio.pause();
		this._pausedAt = this._audio.currentTime;
	}

	resume() {
		if (this._audio.paused) {
			this.play(this._pausedAt);
		}
	}
}