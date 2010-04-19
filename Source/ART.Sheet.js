/*
---
name: ART.Sheet
description: StyleSheet cascading emulator extension
requires: [UI.Sheet, UI.Widget, ART.Widget]
provides: ART.Sheet
...
*/

ART.Sheet = {

	define: function(name, properties){
		UI.Sheet.define(name, properties);
		UI.widgets.each(function(uid, widget){
			widget.deferDraw();
		});
	},
	
	lookup: function(name){
		return UI.Sheet.lookup(name);
	}

};
