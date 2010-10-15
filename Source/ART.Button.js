/*
---
name: ART.Button
description: Base Button Class
requires: [UI.Sheet, UI.Widget, ART.Widget, Core/Class, Core/Element, Core/Element.Event, ART/ART.Rectangle, ART/ART.Font]
provides: ART.Button
...
*/

UI.Sheet.define('button', {
	'border-color': ['hsb(0, 0, 0, 0.6)', 'hsb(0, 0, 0, 0.7)'],
	'reflection-color': ['hsb(0, 0, 100)', 'hsb(0, 0, 0, 0)'],
	'background-color': ['hsb(0, 0, 90)', 'hsb(0, 0, 70)'],
	'shadow-color': 'hsb(0, 0, 0, 0.18)',
	'border-radius': [4, 4, 4, 4],
	'font-family': 'Moderna',
	'font-variant': 'normal',
	'font-size': 12,
	'font-color': 'hsb(0, 0, 5)',
	'padding': [6, 8, 5, 8]
});

UI.Sheet.define('button:focus', {
	'background-color': ['hsb(0, 0, 95)', 'hsb(0, 0, 75)'],
	'border-color': ['hsb(205, 80, 100)', 'hsb(205, 100, 95)']
});

UI.Sheet.define('button:active', {
	'border-color': ['hsb(0, 0, 0, 0.7)', 'hsb(0, 0, 0, 0.8)'],
	'reflection-color': ['hsb(0, 0, 50)', 'hsb(0, 0, 0, 0)'],
	'background-color': ['hsb(0, 0, 60)', 'hsb(0, 0, 70)']
});

UI.Sheet.define('button:disabled', {
	'background-color': ['hsb(0, 0, 95)', 'hsb(0, 0, 75)'],
	'border-color': ['hsb(0, 0, 0, 0.4)', 'hsb(0, 0, 0, 0.5)'],
	'font-color': 'hsb(0, 0, 5, 0.5)'
});

(function(){
	
var Button = ART.Button = new Class({
	
	Extends: ART.Widget,
	
	name: 'button',
	
	options: {
		tabIndex: null
	},
	
	initialize: function(text, options){
		this.parent(options);
		
		this.shadowLayer = new ART.Rectangle;
		this.borderLayer = new ART.Rectangle;
		this.reflectionLayer = new ART.Rectangle;
		this.backgroundLayer = new ART.Rectangle;
		this.textLayer = new ART.Font;
		
		this.canvas.grab(this.shadowLayer, this.borderLayer, this.reflectionLayer, this.backgroundLayer, this.textLayer);
		
		this.text = text;
		
		var element = this.element, self = this;
		
		element.addEvents({

			keydown: function(event){
				if (event.key.match(/space|enter/)) self.activate();
			},
			
			keyup: function(event){
				if (event.key.match(/space|enter/) && self.deactivate()) self.fireEvent('press');
			}

		});

		this.bound = {
			
			mousedown: function(){
				self.activate();
			},
			
			mouseup: function(){
				if (self.deactivate()) self.fireEvent('press');
			}
		
		};

		this.attach();

	},
	
	draw: function(newSheet){
		var sheet = this.parent(newSheet);

		// console.log('»', this.id, ':', 'Drawing', Hash.getLength(sheet), 'properties', Hash.getKeys(sheet));

		var fontChanged = !!(sheet.fontFamily || sheet.fontVariant || sheet.fontSize);
		var boxChanged = !!(sheet.padding || sheet.borderRadius || fontChanged);
		
		var cs = this.currentSheet;
		
		if (fontChanged){
			this.textLayer.draw(cs.fontFamily, cs.fontVariant, this.text, cs.fontSize);
			this.textBox = this.textLayer.measure();
		}
		
		if (boxChanged){
			var width = Math.round(this.textBox.width) + cs.padding[1] + cs.padding[3];
			var height = Math.round(this.textBox.height) + cs.padding[0] + cs.padding[2];
			
			this.resize(width, height + 1);
			
			var brt = cs.borderRadius[0], brr = cs.borderRadius[1];
			var brb = cs.borderRadius[2], brl = cs.borderRadius[3];
			
			this.shadowLayer.draw(width, height, cs.borderRadius).translate(0, 1);
			this.borderLayer.draw(width, height, cs.borderRadius);
			this.reflectionLayer.draw(width - 2, height - 2, [brt - 1, brr - 1, brb - 1, brl - 1]).translate(1, 1);
			this.backgroundLayer.draw(width - 2, height - 3, [brt - 1, brr - 1, brb - 1, brl - 1]).translate(1, 2);
			
			this.textLayer.translate(cs.padding[3], cs.padding[0]);
		}
		
		if (sheet.shadowColor) this.shadowLayer.fill.apply(this.shadowLayer, $splat(sheet.shadowColor));
		if (sheet.borderColor) this.borderLayer.fill.apply(this.borderLayer, $splat(sheet.borderColor));
		if (sheet.reflectionColor) this.reflectionLayer.fill.apply(this.reflectionLayer, $splat(sheet.reflectionColor));
		if (sheet.backgroundColor) this.backgroundLayer.fill.apply(this.backgroundLayer, $splat(sheet.backgroundColor));
		if (sheet.fontColor) this.textLayer.fill.apply(this.textLayer, $splat(sheet.fontColor));
		
		return this;
		
	},
	
	enable: function(){
		if (!this.parent()) return false;
		this.attach();
		return true;
	},
	
	disable: function(){
		if (!this.parent()) return false;
		this.detach();
		return true;
	},

	attach: function(){
		this.element.addEvents(this.bound);
	},

	detach: function(){
		this.element.removeEvents(this.bound);
	}
	
});
	
})();
