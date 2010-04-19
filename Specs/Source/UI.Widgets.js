module('UI.Widgets');

test('should create a few widgets with options', function(){
	g.parentWidget = new UI.Widget({name: 'window', id: 'windowID', className: 'super duper'});
	g.widget1 = new UI.Widget({name: 'button', id: 'buttonID1', className: 'super duper'});
	g.widget2 = new UI.Widget({name: 'button', id: 'buttonID2', className: 'super duper'});
});

// base register / unregister

test('should be able to register with a parent widget', function(){
	g.widget1.register(g.parentWidget);
	g.widget2.register(g.parentWidget);
	
	equals(g.widget1._parentWidget === g.parentWidget, true);
	equals(g.widget2._parentWidget === g.parentWidget, true);
});

test('the parent widget should have as children the child widgets', function(){
	var children = g.parentWidget._childWidgets;
	
	equals(children.length, 2);
	equals(children.contains(g.widget1), true);
	equals(children.contains(g.widget2), true);
});

test('should unregister widgets', function(){
	g.widget1.unregister();
	g.widget2.unregister();
	equals(g.widget1._parentWidget, null);
	equals(g.widget2._parentWidget, null);
	
	var children = g.parentWidget._childWidgets;
	
	equals(children.length, 0);
	equals(children.contains(g.widget1), false);
	equals(children.contains(g.widget2), false);
	
	g.widget1.register(g.parentWidget);
	g.widget2.register(g.parentWidget);
	
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
