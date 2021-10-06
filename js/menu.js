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

	_addRow(...classList) {
		var newRow = document.createElement('div');
		newRow.classList.add('menu-row', ...classList);
		this.el.appendChild(newRow);
		return newRow;
	}

	open() {
		this._show();
	}
	close() {
		this._hide();
	}

	// TODO: Should there be a "result" value, so the parent can get info back?

	// TODO: For the formatting, probably gonna use a lot of flexboxes and less absolute positioning
}

/***************************************************
 Option Menu
***************************************************/
class OptionsMenu extends Menu {

	open() {
		this._loadOptions();
		super.open();
	}

	// TODO: Block access to the parent element while the menu is up?

	//#region option rows
	_addAllControls() {
		this._addTitle();
		// TODO: End-of-turn prompt frequency radio button
		this._addAutoFaceRow();
		// TODO: SFX volume slider
		// TODO: BGM volume slider
		this._addCloseRow();
	}

	_addTitle() {
		this._titleHeader = document.createElement('h1');
		this._titleHeader.innerText = "Options";
		this.el.appendChild(this._titleHeader);
	}

	_addAutoFaceRow() {
		var row = this._addRow();

		this._autoFaceCheckbox = document.createElement('input');
		this._autoFaceCheckbox.id = "autoFaceCheckbox";
		this._autoFaceCheckbox.type = "checkbox";
		row.appendChild(this._autoFaceCheckbox);

		this._autoFaceLabel = document.createElement('label');
		this._autoFaceLabel.innerText = "Automatically face nearest enemy";
		this._autoFaceLabel.htmlFor = "autoFaceCheckbox";
		row.appendChild(this._autoFaceLabel);
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
	}
	//#endregion option rows

	//#region load/save
	_loadOptions() {
		// TODO: Set option values based on the content of SaveData
		this._autoFaceCheckbox.checked = !!SaveData.getOption('autoFace');
	}

	_saveChanges() {
		// TODO: Pull the option values into the SaveData structure
		SaveData.setOption('autoFace', !!this._autoFaceCheckbox.checked);
		SaveData.saveOptions();
	}
	//#endregion load/save
}