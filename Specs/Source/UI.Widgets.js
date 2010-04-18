module('UI.Widgets');

test('should create a few widgets with options', function(){
	g.parentWidget = new UI.Widget({name: 'window', id: 'windowID', className: 'super duper'});
	g.widget1 = new UI.Widget({name: 'button', id: 'buttonID1', className: 'super duper'});
	g.widget2 = new UI.Widget({name: 'button', id: 'buttonID2', className: 'super duper'});
});

// base inject / eject / grab

test('the injected widgets should have as parent the child widgets', function(){
	g.widget1.inject(g.parentWidget);
	g.widget2.inject(g.parentWidget);
	
	equals(g.widget1.getParent() === g.parentWidget, true);
	equals(g.widget2.getParent() === g.parentWidget, true);
});

test('the parent widget should have as children the child widgets', function(){
	var children = g.parentWidget.getChildren();
	
	equals(children.length, 2);
	equals(children.contains(g.widget1), true);
	equals(children.contains(g.widget2), true);
});

test('the widget should be able to be ejected from whatever parent', function(){
	g.widget1.eject();
	g.widget2.eject();
	equals(g.widget1.getParent(), null);
	equals(g.widget2.getParent(), null);
	
	var children = g.parentWidget.getChildren();
	
	equals(children.length, 0);
	equals(children.contains(g.widget1), false);
	equals(children.contains(g.widget2), false);
	
});

test('the parent widget should be able to grab widgets', function(){
	g.parentWidget.grab(g.widget1, g.widget2);
	
	equals(g.widget1.getParent() === g.parentWidget, true);
	equals(g.widget2.getParent() === g.parentWidget, true);
	
	var children = g.parentWidget.getChildren();
	
	equals(children.length, 2);
	equals(children.contains(g.widget1), true);
	equals(children.contains(g.widget2), true);
});

// enable / disable

test('disabling the parent should also disable the children...', function(){
	g.parentWidget.disable();
	
	equals(g.widget1.isDisabled(), true);
	equals(g.widget2.isDisabled(), true);
});

test('...and re-enabling it should re-enable the children...', function(){
	g.parentWidget.enable();
	
	equals(g.widget1.isDisabled(), false);
	equals(g.widget2.isDisabled(), false);
});

test('...unless they were disabled by hand.', function(){
	g.widget1.disable();
	g.parentWidget.disable();
	
	equals(g.widget1.isDisabled(), true);
	equals(g.widget2.isDisabled(), true);
	
	g.parentWidget.enable();
	
	equals(g.widget1.isDisabled(), true);
	equals(g.widget2.isDisabled(), false);
	
	g.widget1.enable();
});

test('enabling the child of a disabled parent should not be allowed.', function(){
	g.parentWidget.disable();
	g.widget1.enable();
	equals(g.widget1.isDisabled(), true);
	g.parentWidget.enable();
});

// focus / blur

test('focusing the parent should not blur the children, if focused', function(){
	g.widget1.focus();
	
	g.parentWidget.focus();
	
	equals(g.widget1.isFocused(), true);
	equals(g.parentWidget.isFocused(), true);
	equals(g.widget2.isFocused(), false);
});

test('blurring the parent should blur every children', function(){
	g.widget2.focus();
	
	g.parentWidget.blur();
	
	equals(g.widget1.isFocused(), false);
	equals(g.widget2.isFocused(), false);
});

test('focusing a widget should blur the other', function(){
	g.widget1.focus();
	g.widget2.focus();
	
	equals(g.widget1.isFocused(), false);
	equals(g.widget2.isFocused(), true);
	
	g.widget2.blur();
});
