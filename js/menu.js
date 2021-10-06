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
	}

	get elClass() {
		return 'menu';
	}

	_addAllButtons() {
		this._closeButton = this._addButton('close-button');
		this._closeButton.onclick = () => {
			this.close();
		}
		this.el.appendChild(this._closeButton);
	}

	_addButton(...classList) {
		var newButton = document.createElement("button");
		newButton.classList.add(...classList);
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

	// TODO: Auto-turn options
	// TODO: End-of-turn prompt option
	// TODO: Enemy turn speed option?
	// TODO: Placeholders for volume options

	// TODO: Save option changes

	// TODO: Cancel changes

	// TODO: Reset to default?

	// Each button is created and styled along with its labels
	// Each button triggers an effect in the menu

	close() {
		SaveData.saveOptions();
		super.close();
	}
}