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
		this.close();
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

	_addLabel(text, control) {
		var newLabel = document.createElement('label');
		newLabel.innerText = text;
		if (control) newLabel.htmlFor = control.id;
		return newLabel;
	}

	_addRow(...classList) {
		var newRow = document.createElement('div');
		newRow.classList.add('menu-row', ...classList);
		return newRow;
	}

	// TODO: Add menu boxes, titles, checkboxes, other inputs in general?

	open() {
		this._show();
	}
	close() {
		this._hide();
	}

	// TODO: Should there be a "result" value, so the parent can get info back?
}

/***************************************************
 Option Menu
***************************************************/
class OptionsMenu extends Menu {

	open() {
		this._loadOptions();
		super.open();
	}

	//#region option rows
	_addAllControls() {
		this.el.appendChild(this._addTitle());
		var optionBox = this._titleHeader = document.createElement('div');
		optionBox.classList.add('menu-box');
		optionBox.appendChild(this._addEndTurnConfirmRow());
		optionBox.appendChild(this._addAutoFaceRow());
		optionBox.appendChild(this._addSoundRow());
		optionBox.appendChild(this._addMusicRow());
		optionBox.appendChild(this._addCloseRow());
		this.el.appendChild(optionBox);
	}

	_addTitle() {
		this._titleHeader = document.createElement('h1');
		this._titleHeader.innerText = "Options";
		return this._titleHeader;
	}

	_addEndTurnConfirmRow() {
		var row = this._addRow();
		this._endTurnConfirmCheckbox = document.createElement('input');
		this._endTurnConfirmCheckbox.id = "turnPromptCheckbox";
		this._endTurnConfirmCheckbox.type = "checkbox";
		row.appendChild(this._endTurnConfirmCheckbox);
		row.appendChild(this._addLabel("End turn confirmation", this._endTurnConfirmCheckbox));
		return row;
	}

	_addAutoFaceRow() {
		var row = this._addRow();
		this._autoFaceCheckbox = document.createElement('input');
		this._autoFaceCheckbox.id = "autoFaceCheckbox";
		this._autoFaceCheckbox.type = "checkbox";
		row.appendChild(this._autoFaceCheckbox);
		row.appendChild(this._addLabel("Automatic facing", this._autoFaceCheckbox));
		return row;
	}

	_addSoundRow() {
		var row = this._addRow('volume-slider');
		this._sfxVolumeSlider = document.createElement('input');
		this._sfxVolumeSlider.id = "sfxVolumeSlider";
		this._sfxVolumeSlider.type = "range";
		this._sfxVolumeSlider.min = 0;
		this._sfxVolumeSlider.max = 10;
		row.appendChild(this._addLabel("Sound volume", this._sfxVolumeSlider));
		row.appendChild(this._sfxVolumeSlider);
		return row;
	}

	_addMusicRow() {
		var row = this._addRow('volume-slider');
		this._bgmVolumeSlider = document.createElement('input');
		this._bgmVolumeSlider.id = "bgmVolumeSlider";
		this._bgmVolumeSlider.type = "range";
		this._bgmVolumeSlider.min = 0;
		this._bgmVolumeSlider.max = 10;
		row.appendChild(this._addLabel("Music volume", this._bgmVolumeSlider));
		row.appendChild(this._bgmVolumeSlider);
		return row;
	}

	_addCloseRow() {
		var row = this._addRow('accept-cancel');
		this._acceptButton = this._addButton("Accept", 'close-button');
		this._acceptButton.onclick = () => {
			this._saveChanges();
			this.close();
		}
		row.appendChild(this._acceptButton);

		this._cancelButton = this._addButton("Cancel", 'close-button');
		this._cancelButton.onclick = () => {
			this.close();
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