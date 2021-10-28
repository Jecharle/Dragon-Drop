/***************************************************
 Static object that handles sound & music playback
***************************************************/
class AudioBooth {
	static sfx = {};

	static getSfx(path) {
		if (!path) return null;

		if (!this.sfx[path]) {
			var newSound = new Audio(path);
			this.sfx[path] = new Sfx(newSound);
		}
		return this.sfx[path];
	}

	// TODO: Current music
	// TODO: Method to change music source
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