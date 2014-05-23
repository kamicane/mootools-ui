/*
---
name: ART.Widget
description: ART Widget Class
requires: [UI.Widget, Core/Class, Core/Element, Core/Element.Event, ART/ART.Base]
provides: ART.Widget
...
*/

(function(){
	
var Widget = ART.Widget = new Class({

	Extends: UI.Widget,

	options: {
		tabIndex: -1
	},
	
	initialize: function(options){
		this.element = new Element('div').setStyles({display: 'inline-block', position: 'relative', outline: 'none'});
		this.canvas = new ART;
		$(this.canvas).setStyles({position: 'absolute', top: 0, left: 0}).inject(this.element);
		this.currentSheet = {};
		
		this.parent(options);
		
		this.setTabIndex(this.options.tabIndex);
		
		var self = this;
		
		this.element.addEvents({

			focus: function(){
				if (!self.isFocused()) self.focus();
			},

			blur: function(){
				if (self.isFocused()) self.blur();
			}
			
		});
	},
	
	/* tab indices */
	
	setTabIndex: function(index){
		this.element.tabIndex = this.tabIndex = index;
	},
	
	getTabIndex: function(){
		return this.tabIndex;
	},
	
	/* ARTSY Stuff */
	
	resize: function(width, height){
		this.element.setStyles({width: width, height: height});
		this.canvas.resize(width, height);
		return this;
	},
	
	draw: function(newSheet){
		var sheet = Object.merge(this.diffSheet(), newSheet || {});
		for (var property in sheet) this.currentSheet[property] = sheet[property];
		return sheet;
	},
	
	deferDraw: function(){
		if (!this.element.parentNode) return;

		var self = this;
		clearTimeout(this.drawTimer);
		this.drawTimer = setTimeout(function(){
			self.draw();
		}, 1);
	},
	
	/* ID */
	
	setID: function(id){
		this.parent(id);
		this.element.set('id', id);
		this.deferDraw();
		return this;
	},
	
	/* classNames */
	
	addClass: function(className){
		this.parent(className);
		this.element.addClass(className);
		this.deferDraw();
		return this;
	},
	
	removeClass: function(className){
		this.parent(className);
		this.element.removeClass(className);
		this.deferDraw();
		return this;
	},
	
	/* states */
	
	enable: function(){
		if (!this.parent()) return false;
		this.setTabIndex(this.oldTabIndex);
		this.deferDraw();
		return true;
	},
	
	disable: function(){
		if (!this.parent()) return false;
		this.oldTabIndex = this.tabIndex;
		this.setTabIndex(-1);
		this.deferDraw();
		return true;
	},
	
	focus: function(){
		if (!this.parent()) return false;
		this.element.focus();
		this.deferDraw();
		return true;
	},
	
	blur: function(){
		if (!this.parent()) return false;
		this.element.blur();
		this.deferDraw();
		return true;
	},
	
	activate: function(){
		if (!this.parent()) return false;
		this.deferDraw();
		return true;
	},
	
	deactivate: function(){
		if (!this.parent()) return false;
		this.deferDraw();
		return true;
	},
	
	/* DOM + Registration */
	
	inject: function(widget, element){
		element = (element) ? $(element) : $(widget);

		if (element && this.element.parentNode !== element){
			this.register(widget);
			this.element.inject(element);
			this.deferDraw();
		}

		return this;
	},
	
	eject: function(){
		if (this.element.parentNode){ // continue only if the element is in the dom
			this.element.dispose();
			this.unregister();
			// even though deferDraw will not fire when the element is not in the dom, this will cancel any pre-existing draw request.
			clearTimeout(this.drawTimer);
		}
		return this;
	},
	
	/* $ */
	
	toElement: function(){
		return this.element;
	}
	
});
	
})();
