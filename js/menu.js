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
		this.close(null);
	}

	get elClass() {
		return 'menu';
	}

	_addAllControls() {
		this._closeButton = this._addButton("Close", 'close-button');
		this._closeButton.onclick = () => {
			this.close();
		}
		this.el.appendChild(this._closeButton);
	}

	_addButton(text, ...classList) {
		var newButton = document.createElement('button');
		newButton.classList.add(...classList);
		newButton.innerText = text;
		newButton.type = "button";
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

	// TODO: Add menu boxes, titles, checkboxes, other inputs in general?

	open(callback) {
		this._callback = callback;
		this._show();
	}
	close(result) {
		this._result = result || null;

		if (this._callback) {
			this._callback.call(this.parent);
		}
		this._callback = null;

		this._hide();
	}

	get result() {
		return this._result;
	}
	// TODO: Should there be a "result" value, so the parent can get info back?
}

/***************************************************
 Option Menu
***************************************************/
class OptionsMenu extends Menu {

	open(callback) {
		this._loadOptions();
		super.open(callback);
	}

	//#region option rows
	_addAllControls() {
		this.el.appendChild(this._addTitle("Options"));
		
		var optionBox = document.createElement('div');
		optionBox.classList.add('menu-box');
		optionBox.appendChild(this._addEndTurnConfirmRow());
		optionBox.appendChild(this._addAutoFaceRow());
		optionBox.appendChild(this._addSoundRow());
		optionBox.appendChild(this._addMusicRow());
		optionBox.appendChild(this._addCloseRow());
		this.el.appendChild(optionBox);
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
		this._endTurnConfirmCheckbox.checked = SaveData.confirmEndTurn;
		this._autoFaceCheckbox.checked = SaveData.autoFace;
		this._sfxVolumeSlider.value = SaveData.sfxVolume;
		this._bgmVolumeSlider.value = SaveData.bgmVolume;
	}

	_saveChanges() {
		SaveData.confirmEndTurn = this._endTurnConfirmCheckbox.checked;
		SaveData.autoFace = this._autoFaceCheckbox.checked;
		SaveData.sfxVolume = this._sfxVolumeSlider.value;
		SaveData.bgmVolume = this._bgmVolumeSlider.value;
		SaveData.saveOptions();
	}
	//#endregion load/save
}