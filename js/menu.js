/***************************************************
 Menu
 The root class for button-based menus for options,
 title screens, and maybe also dialog
***************************************************/
class Menu extends ElObj {
	constructor(parent) {
		super();
		this.parent = parent;
		this._addAllButtons();
		this.close();
	}

	get elClass() {
		return 'menu';
	}

	_addAllButtons() {
		this._closeButton = this._addButton("Close", 'close-button');
		this._closeButton.onclick = () => {
			this.close();
		}
		this.el.appendChild(this._closeButton);
	}

	_addButton(text, ...classList) {
		var newButton = document.createElement("button");
		newButton.classList.add(...classList);
		newButton.innerText = text;
		newButton.type = "button";
		return newButton;
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
		// TODO: Set options from the saved option data
		super.open();
	}

	_addAllButtons() {
		this._closeButton = this._addButton("Confirm", 'close-button');
		this._closeButton.onclick = () => {
			this._applyChanges();
			this.close();
		}
		this.el.appendChild(this._closeButton);

		this._closeButton = this._addButton("Cancel", 'close-button');
		this._closeButton.onclick = () => {
			this.close();
		}
		this.el.appendChild(this._closeButton);
	}

	// TODO: Block access to the background elements while the menu is up?

	// TODO: Auto-facing options
	// TODO: End-of-turn prompt option
	// TODO: Enemy turn speed option?
	// TODO: SFX volume
	// TODO: BGM volume

	// TODO: Save option changes

	// TODO: Cancel changes

	// TODO: Reset to default?

	// Each button is created and styled along with its labels
	// Each button triggers an effect in the menu

	_applyChanges() {
		SaveData.saveOptions();
	}
}