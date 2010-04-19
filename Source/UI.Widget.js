/*
---
name: UI.Widget
description: Base Widget Class
requires: [UI, UI.Sheet, Core/Core, Core/Class, Core/Events, Core/Options, Core/Array]
provides: UI.Widget
...
*/

(function(){
	
var widgets = UI.widgets = {}, UID = 0;

var Widget = UI.Widget = new Class({
	
	Implements: [Events, Options],
	
	name: 'widget',
	
	options: {
		id: '',
		className: ''
	},
	
	initialize: function(options){
		this.uid = ART.uniqueID();

		this._parentWidget = null;
		this._childWidgets = [];
		
		this.setOptions(options);
		if (this.options.id) this.setID(this.options.id);

		this.classNames = [];
		if (this.options.className) this.options.className.split(' ').each(function(className){
			this.addClass(className);
		}, this);
		
		this.states = {disabled: false, focus: false, active: false};
	},
	
	/* ID */
	
	setID: function(id){
		this.id = id;
		return this;
	},
	
	/* classNames */
	
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
		if ((this._parentWidget && this._parentWidget.isDisabled()) || !this.isDisabled()) return false;
		this._disabledByParent = false;
		this.states.disabled = false;
		this.fireEvent('enable');
		
		this._childWidgets.each(function(child){
			if (child._disabledByParent) child.enable();
		});
		
		return true;
	},
	
	disable: function(){
		if (this.isDisabled()) return false;
		this.fireEvent('disable');
		
		this.blur();
			
		this._childWidgets.each(function(child){
			if (!child.states.disabled){
				child._disabledByParent = true;
				child.disable();
			}
		});
		
		this.states.disabled = true;
		
		return true;
	},
	
	isDisabled: function(){
		return this.states.disabled;
	},
	
	/* focus, blur */
	
	focus: function(){
		if (this.isDisabled() || this.isFocused()) return false;
		this.states.focus = true;
		this.fireEvent('focus');
		
		for (var w in widgets){
			var widget = widgets[w];
			if (widget != this && !this._childWidgets.contains(widget)) widget.blur();
		}
		
		return true;
	},
	
	blur: function(){
		if (this.isDisabled() || !this.isFocused()) return false;
		
		this.deactivate();
		this.states.focus = false;
		this.fireEvent('blur');
		
		this._childWidgets.each(function(child){
			child.blur();
		});
		
		return true;
	},
	
	isFocused: function(){
		return this.states.focus;
	},
	
	/* activate, deactivate */
	
	activate: function(){
		if (this.isDisabled() || this.isActive()) return false;
		this.focus();
		this.states.active = true;
		
		this.fireEvent('active');
		
		return true;
	},
	
	deactivate: function(){
		if (this.isDisabled() || !this.isActive()) return false;
		this.states.active = false;
		this.fireEvent('inactive');
		
		return true;
	},
	
	isActive: function(){
		return this.states.active;
	},
	
	/* child & parent relationship, registration */
	
	register: function(widget){
		widgets[this.uid] = this;
		
		if (widget && (widget instanceof Widget) && this._parentWidget !== widget){
			this._parentWidget && this._parentWidget._childWidgets.erase(this);
			this._parentWidget = widget;
			widget._childWidgets.push(this);
		}
		
		return this;
	},
	
	unregister: function(){
		if (widgets[this.uid]){
			delete widgets[this.uid];
			this.blur();

			if (this._parentWidget){
				this._parentWidget._childWidgets.erase(this);
				this._parentWidget = null;
			}
		}
		return this;
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
	
	var parentWidget = this._parentWidget;
	if (parentWidget) string = parentWidget.toString() + ' ' + string;
	
	return string;
};
	
})();
