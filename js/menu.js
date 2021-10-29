/***************************************************
 Menu
 The root class for button-based menus for options,
 title screens, and maybe also dialog
***************************************************/
class Menu extends ElObj {
	constructor(parent) {
		super();
		this.parent = parent;
		this._addAllControls();
		this._callback = null;
		this._isOpen = false;
		this.close(null);
	}

	get elClass() {
		return 'menu';
	}

	_addAllControls() {
		this._closeButton = this._addButton("Close", 'close-button');
		this._closeButton.onclick = () => {
			this.close(0);
		}
		this.el.appendChild(this._closeButton);
	}

	//#region controls
	_addButton(text, ...classList) {
		var newButton = document.createElement('div');
		newButton.classList.add("button", ...classList);
		newButton.innerText = text;
		return newButton;
	}

	_addCheckbox(id, ...classList) {
		var newCheckbox = document.createElement('input');
		newCheckbox.classList.add(...classList);
		newCheckbox.type = "checkbox";
		newCheckbox.id = id;
		return newCheckbox;
	}

	_addSlider(id, min, max, ...classList) {
		var newSlider = document.createElement('input');
		newSlider.classList.add(...classList);
		newSlider.type = "range";
		newSlider.min = min;
		newSlider.max = max;
		newSlider.id = id;
		return newSlider;
	}

	_addLabel(text, control, ...classList) {
		var newLabel = document.createElement('label');
		newLabel.classList.add(...classList);
		newLabel.innerText = text;
		if (control) newLabel.htmlFor = control.id;
		return newLabel;
	}

	_addTitle(text, ...classList) {
		var newTitle = document.createElement('h1');
		newTitle.classList.add(...classList);
		newTitle.innerText = text;
		return newTitle;
	}

	_addRow(...classList) {
		var newRow = document.createElement('div');
		newRow.classList.add('menu-row', ...classList);
		return newRow;
	}
	//#endregion controls

	//#region open/close
	open(callback) {
		this._callback = callback;
		this._isOpen = true;
		this._show();
	}
	close(result) {
		this._result = result || null;
		this._isOpen = false;

		this._hide();
		if (this._callback) {
			this._callback.call(this.parent, this.result);
		}
		this._callback = null;
	}

	get isOpen() {
		return this._isOpen;
	}
	get result() {
		return this._result;
	}
	//#endregion open/close

	//#region input events
	rightClick() {}

	keydown(key) { }
	keyup(key) { }
	//#endregion input events
}

/***************************************************
 Yes-No Prompt Menu
***************************************************/
class YesNoMenu extends Menu {
	constructor(parent) {
		super(parent);
		this.el.classList.add('yes-no-menu');
	}

	open(message, callback) {
		this._message.innerText = message;
		super.open(callback);
	}

	//#region rows
	_addAllControls() {
		this.el.appendChild(this._addTitle("Confirm"));
		this._message = this._addLabel("");
		this.el.appendChild(this._message);
		this.el.appendChild(this._addYesNoRow());
	}

	_addYesNoRow() {
		var row = this._addRow('yes-no');
		this._acceptButton = this._addButton("Yes", 'close-button');
		this._acceptButton.onclick = () => {
			this.close(1);
		}
		row.appendChild(this._acceptButton);

		this._cancelButton = this._addButton("No", 'close-button');
		this._cancelButton.onclick = () => {
			this.close(0);
		}
		row.appendChild(this._cancelButton);
		return row;
	}
	//#endregion rows

	//#region input events
	rightClick() {
		this.close(0);
	}

	keydown(key) {
		if (key == 'Enter') {
			this.close(1);
		} else if (key == 'Escape') {
			this.close(0);
		}
	}
	//#endregion input events
}

/***************************************************
 Option Menu
***************************************************/
class OptionsMenu extends Menu {
	constructor(parent) {
		super(parent);
		this.el.classList.add('option-menu');
	}

	open(callback) {
		this._loadOptions();
		super.open(callback);
	}

	_addAllControls() {
		this.el.appendChild(this._addTitle("Options"));
		
		var optionBox = document.createElement('div');
		optionBox.classList.add('menu-box');
		optionBox.appendChild(this._addTextSpeedRow());
		optionBox.appendChild(this._addEndTurnConfirmRow());
		optionBox.appendChild(this._addAutoFaceRow());
		optionBox.appendChild(this._addSoundRow());
		optionBox.appendChild(this._addMusicRow());
		optionBox.appendChild(this._addCloseRow());
		this.el.appendChild(optionBox);
	}

	//#region option rows
	_addTextSpeedRow() {
		var row = this._addRow('speed-slider');
		this._textSpeedSlider = this._addSlider("textSpeedSlider", 0, 2);
		row.appendChild(this._addLabel("Text speed", this._textSpeedSlider));
		row.appendChild(this._textSpeedSlider);
		return row;
	}
	
	_addEndTurnConfirmRow() {
		var row = this._addRow();
		this._endTurnConfirmCheckbox = this._addCheckbox("turnPromptCheckbox");
		row.appendChild(this._endTurnConfirmCheckbox);
		row.appendChild(this._addLabel("End turn confirmation", this._endTurnConfirmCheckbox));
		return row;
	}

	_addAutoFaceRow() {
		var row = this._addRow();
		this._autoFaceCheckbox = this._addCheckbox("autoFaceCheckbox");
		row.appendChild(this._autoFaceCheckbox);
		row.appendChild(this._addLabel("Automatic facing", this._autoFaceCheckbox));
		return row;
	}

	_addSoundRow() {
		var row = this._addRow('volume-slider');
		this._sfxVolumeSlider = this._addSlider("sfxVolumeSlider", 0, 10);
		row.appendChild(this._addLabel("Sound volume", this._sfxVolumeSlider));
		row.appendChild(this._sfxVolumeSlider);
		return row;
	}

	_addMusicRow() {
		var row = this._addRow('volume-slider');
		this._bgmVolumeSlider = this._addSlider("bgmVolumeSlider", 0, 10);
		row.appendChild(this._addLabel("Music volume", this._bgmVolumeSlider));
		row.appendChild(this._bgmVolumeSlider);
		return row;
	}

	_addCloseRow() {
		var row = this._addRow('accept-cancel');
		this._acceptButton = this._addButton("Accept", 'close-button');
		this._acceptButton.onclick = () => {
			this._saveChanges();
			this.close(1);
		}
		row.appendChild(this._acceptButton);

		this._cancelButton = this._addButton("Cancel", 'close-button');
		this._cancelButton.onclick = () => {
			this.close(0);
		}
		row.appendChild(this._cancelButton);
		return row;
	}
	//#endregion option rows

	//#region load/save
	_loadOptions() {
		SaveData.loadOptions();
		this._textSpeedSlider.value = SaveData.textSpeed;
		this._endTurnConfirmCheckbox.checked = SaveData.confirmEndTurn;
		this._autoFaceCheckbox.checked = SaveData.autoFace;
		this._sfxVolumeSlider.value = SaveData.sfxVolume;
		this._bgmVolumeSlider.value = SaveData.bgmVolume;
	}

	_saveChanges() {
		SaveData.textSpeed = this._textSpeedSlider.value;
		SaveData.confirmEndTurn = this._endTurnConfirmCheckbox.checked;
		SaveData.autoFace = this._autoFaceCheckbox.checked;
		SaveData.sfxVolume = this._sfxVolumeSlider.value;
		SaveData.bgmVolume = this._bgmVolumeSlider.value;
		Bgm.refreshVolume();
		SaveData.saveOptions();
	}
	//#endregion load/save

	//#region input events
	rightClick() {
		this.close(0);
	}

	keydown(key) {
		if (key == 'Enter') {
			this._saveChanges();
			this.close(1);
		} else if (key == 'Escape') {
			this.close(0);
		}
	}
	//#endregion input events
}

/***************************************************
 Battle Menu
***************************************************/
class BattleMenu extends Menu {
	constructor(parent) {
		super(parent);
		this.el.classList.add('battle-menu');
	}

	_addAllControls() {
		this.el.appendChild(this._addTitle("Paused"));

		// unpause
		this._resumeButton = this._addButton("Resume");
		this._resumeButton.onclick = () => {
			this.close(0);
		};
		this.el.appendChild(this._resumeButton);

		// options menu
		this._optionsButton = this._addButton("Options");
		this._optionsButton.onclick = () => {
			this.close(1);
		};
		this.el.appendChild(this._optionsButton);

		// quit the battle
		this._quitButton = this._addButton("Give Up");
		this._quitButton.onclick = () => {
			this.close(2);
		};
		this.el.appendChild(this._quitButton);
	}

	//#region input events
	rightClick() {
		this.close(0);
	}

	keydown(key) {
		if (key == 'Enter' || key == 'Escape') {
			this.close(0);
		}
	}
	//#endregion input events
}

/***************************************************
 Map Screen Menu
***************************************************/
class MapMenu extends Menu {
	constructor(parent) {
		super(parent);
		this.el.classList.add('map-menu');
	}

	_addAllControls() {
		this.el.appendChild(this._addTitle("Paused"));

		// unpause
		this._resumeButton = this._addButton("Resume");
		this._resumeButton.onclick = () => {
			this.close(0);
		};
		this.el.appendChild(this._resumeButton);

		// options menu
		this._optionsButton = this._addButton("Options");
		this._optionsButton.onclick = () => {
			this.close(1);
		};
		this.el.appendChild(this._optionsButton);

		// quit to title
		this._quitButton = this._addButton("Return to title");
		this._quitButton.onclick = () => {
			this.close(2);
		};
		this.el.appendChild(this._quitButton);
	}

	//#region input events
	rightClick() {
		this.close(0);
	}

	keydown(key) {
		if (key == 'Enter' || key == 'Escape') {
			this.close(0);
		}
	}
	//#endregion input events
}

/***************************************************
 Dialog box for text
***************************************************/
class DialogBox extends Menu {
	constructor(parent) {
		super(parent);
		this.el.classList.add('dialog-box');
		this._queue = [];
		this._message = "";
		this._progress = 0;
		this._intervalFunction = null;
		this._textSfx = Sfx.getSfx("step1.wav");

		this.el.onclick = () => {
			this._skip();
		};
	}

	_addAllControls() {
		this._portrait = document.createElement("div");
		this._portrait.classList.add('face');
		this.el.appendChild(this._portrait);
		
		this._textArea = this._addLabel("", null, 'dialog');
		this.el.appendChild(this._textArea);
	}



	//#region advancing
	_start(message) {
		var input = message.split("|");
		
		if (input.length > 1) this.style = input[0].split(" ");

		this._progress = 0;
		this._message = input.length > 0 ? input[input.length-1] : "";
		this._textArea.innerText = "";
		this.el.classList.remove('done');

		this._intervalFunction = setInterval(() => {
			this._step();
		}, [80, 40, 20][SaveData.textSpeed]);
		
		// TODO: Minor delay / startup transition, so it doesn't feel abrupt
	}
	_step() {
		this._progress++;

		if (this.isDone) {
			this._finish();
		} else {
			this._textArea.innerText = this._message.substr(0, this._progress);
			if (this._progress % 3 == 0) this._textSfx.play();
		}
	}
	_finish() {
		this.el.classList.add('done');
		this._progress = this._message.length;
		this._textArea.innerText = this._message;
		if (this._intervalFunction) clearInterval(this._intervalFunction);
	}
	get isDone() {
		return !(this._message && this._progress < this._message.length);
	}

	_skip() {
		if (!this.isDone) {
			this._finish();
		} else if (this._queue.length > 0) {
			this._start(this._queue.shift());
		} else {
			this.close(0);
		}
	}
	//#endregion advancing

	//#region open/close
	open(messageList, callback) {
		this._queue = messageList;
		this._start(this._queue.shift());
		super.open(callback);
	}

	close() {
		if (!this.isDone) this._finish();
		super.close(0);
	}
	//#endregion open/close

	//#region input events
	rightClick() {
		this._skip();
	}

	keydown(key) {
		if (key == 'Enter' || key == 'Escape' || key == 'Space' || key == ' ') {
			this._skip();
		}
	}
	//#endregion input events
}