module('UI.Widget');

// base

test('should return an instance of widget', function(){
	g.Widget = new Class({
		Extends: UI.Widget,
		name: 'button'
	});
	g.widget = new g.Widget({id: 'buttonID', className: 'super duper'});
	equals(g.widget instanceof UI.Widget, true);
});

// options

test('should parse the id and className options', function(){
	equals(g.widget.name, 'button');
	equals(g.widget.id, 'buttonID');
	equals(g.widget.hasClass('super'), true);
	equals(g.widget.hasClass('duper'), true);
});

// classNames

test('should add and remove classNames', function(){
	g.widget.addClass('iper').addClass('mega');
	equals(g.widget.hasClass('iper'), true);
	equals(g.widget.hasClass('mega'), true);
	g.widget.removeClass('iper').removeClass('mega');
	equals(g.widget.hasClass('iper'), false);
	equals(g.widget.hasClass('mega'), false);
});

// states

test('should enable and disable, read the disabled status', function(){
	g.widget.disable();
	equals(g.widget.isDisabled(), true);
	g.widget.enable();
	equals(g.widget.isDisabled(), false);
});

test('should focus and blur, read the focused status', function(){
	g.widget.focus();
	equals(g.widget.isFocused(), true);
	g.widget.blur();
	equals(g.widget.isFocused(), false);
});

test('should activate and deactivate, read the active status', function(){
	g.widget.activate();
	equals(g.widget.isActive(), true);
	g.widget.deactivate();
	equals(g.widget.isActive(), false);
});

// states that affect each other

test('should not be able to activate if disabled', function(){
	g.widget.disable();
	g.widget.activate();
	equals(g.widget.isActive(), false);
	g.widget.enable();
});

test('should not be able to focus if disabled', function(){
	g.widget.disable();
	g.widget.focus();
	equals(g.widget.isFocused(), false);
	g.widget.enable();
});

test('should focus when active', function(){
	g.widget.activate();
	equals(g.widget.isFocused(), true);
	g.widget.deactivate();
});

test('should blur and deactivate when disabled', function(){
	g.widget.focus();
	g.widget.activate();
	g.widget.disable();
	equals(g.widget.isFocused(), false);
	equals(g.widget.isActive(), false);
	g.widget.enable();
});

// css selector string

test('should return the css "selector" string', function(){
	equals(g.widget.toString(), 'button#buttonID.super.duper');
	g.widget.disable();
	equals(g.widget.toString(), 'button#buttonID.super.duper:disabled');
	g.widget.enable();
	g.widget.activate();
	equals(g.widget.toString(), 'button#buttonID.super.duper:focus:active');
	g.widget.deactivate();
	equals(g.widget.toString(), 'button#buttonID.super.duper:focus');
	g.widget.blur();
});

// sheets

UI.Sheet.define("button#buttonID", {
	backgroundColor: "gray",
	color: "black"
});

UI.Sheet.define("button#buttonID:disabled", {
	color: "white"
});

UI.Sheet.define("button#buttonID:focus", {
	color: "pink"
});

test('should return the defined sheet, based on the states', function(){
	same(g.widget.getSheet(), {backgroundColor: "gray", color: "black", base: 1, asterix: 1});
	g.widget.disable();
	same(g.widget.getSheet(), {backgroundColor: "gray", color: "white", base: 1, asterix: 1});
	g.widget.enable();
	g.widget.focus();
	same(g.widget.getSheet(), {backgroundColor: "gray", color: "pink", base: 1, asterix: 1});
	g.widget.blur();
});

test('should diff the previously retrieved sheet', function(){
	same(g.widget.diffSheet(), {backgroundColor: "gray", color: "black", base: 1, asterix: 1});
	g.widget.focus();
	same(g.widget.diffSheet(), {color: "pink"});
	g.widget.blur();
});
