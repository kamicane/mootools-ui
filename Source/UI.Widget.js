/*
---
name: UI.Widget
description: Base Widget Class
requires: [UI, UI.Sheet, Core/Core, Core/Class, Core/Events, Core/Options, Core/Array]
provides: UI.Widget
...
*/

(function(){
	
var widgets = {}, UID = 0;

var Widget = UI.Widget = new Class({
	
	Implements: [Events, Options],
	
	name: 'widget',
	
	options: {
		id: '',
		className: ''
	},
	
	initialize: function(options){
		var uid = ART.uniqueID();
		widgets[uid] = this;
		
		this.setOptions(options);
		if (this.options.id) this.setID(this.options.id);

		this.classNames = [];
		if (this.options.className) this.options.className.split(' ').each(function(className){
			this.addClass(className);
		}, this);

		this._parentWidget = null;
		this._childWidgets = [];
		
		this.states = {disabled: false, focus: false, active: false};
	},
	
	setID: function(id){
		this.id = id;
		return this;
	},
	
	addClass: function(className){
		this.classNames.push(className);
		return this;
	},
	
	removeClass: function(className){
		this.classNames.erase(className);
		return this;
	},
	
	hasClass: function(className){
		return this.classNames.contains(className);
	},
	
	/* enable, disable */
	
	enable: function(){
		var parentWidget = this.getParent();
		if ((parentWidget && parentWidget.states.disabled) || !this.states.disabled) return false;
		
		this.states.disabled = false;
		this.fireEvent('enable');
		
		this.getChildren().each(function(child){
			if (child._disabledByParent) child.enable();
		});
		
		return true;
	},
	
	disable: function(byParent){
		if (this.states.disabled) return false;
		
		this._disabledByParent = !!(byParent);
		this.blur();
		this.deactivate();
		this.states.disabled = true;
		this.fireEvent('disable');
					
		this.getChildren().each(function(child){
			child.disable(true);
		});
		
		return true;
	},
	
	isDisabled: function(){
		return this.states.disabled;
	},
	
	/* focus, blur */
	
	focus: function(){
		if (this.states.disabled || this.states.focus) return false;
		this.states.focus = true;
		this.fireEvent('focus');
		
		for (var w in widgets){
			var widget = widgets[w];
			if (widget != this && !this.getChildren().contains(widget)) widget.blur();
		}
		
		return true;
	},
	
	blur: function(){
		if (this.states.disabled || !this.states.focus) return false;

		this.states.focus = false;
		this.fireEvent('blur');
		
		this.getChildren().each(function(child){
			child.blur();
		});
		
		return true;
	},
	
	isFocused: function(){
		return this.states.focus;
	},
	
	/* activate, deactivate */
	
	activate: function(){
		if (this.states.disabled || this.states.active) return false;
		this.focus();
		this.states.active = true;
		
		this.fireEvent('active');
		
		return true;
	},
	
	deactivate: function(){
		if (this.states.disabled || !this.states.active) return false;
		this.states.active = false;
		this.fireEvent('inactive');
		
		return true;
	},
	
	isActive: function(){
		return this.states.active;
	},
	
	/* child & parent relationship */
	
	inject: function(widget){
		var parentWidget = this.getParent();
		if ((widget instanceof Widget) && parentWidget !== widget){
			if (parentWidget) this.eject();
			this._parentWidget = widget;
			widget._childWidgets.push(this);
			this.fireEvent('inject', widget);
		}
		return this;
	},
	
	eject: function(){
		var parentWidget = this.getParent();
		if (parentWidget){
			parentWidget._childWidgets.erase(this);
			this._parentWidget = null;
			this.fireEvent('eject', parentWidget);
		}
		return this;
	},
	
	grab: function(){
		for (var i = 0; i < arguments.length; i++){
			var widget = arguments[i];
			if ((widget instanceof Widget)) widget.inject(this);
		}
		return this;
	},
	
	getParent: function(){
		return this._parentWidget;
	},
	
	getChildren: function(){
		return this._childWidgets;
	},
	
	/* Sheet integration */
	
	getSheet: function(){
		return UI.Sheet.lookup(this.toString());
	},
	
	diffSheet: function(){
		var oldSheet = this._oldSheet;
		if (!oldSheet) return this._oldSheet = this.getSheet();
		var newSheet = this.getSheet();
		
		var mixSheet = {};
		
		for (var p in newSheet){
			var newValue = newSheet[p], oldValue = oldSheet[p];
			if (String(newValue).toString() != String(oldValue).toString()){
				mixSheet[p] = oldSheet[p] = newValue;
			}
		}
		
		return mixSheet;
	}
	
});

Widget.prototype.toString = function(){
	var string = '';
	if (this.name) string += this.name;
	if (this.id) string += "#" + this.id;
	if (this.classNames.length) string += '.' + this.classNames.join('.');

	for (var s in this.states){
		if (this.states[s]) string += ':' + s;
	}
	
	var parentWidget = this.getParent();
	if (parentWidget) string = parentWidget.toString() + ' ' + string;
	
	return string;
};
	
})();
