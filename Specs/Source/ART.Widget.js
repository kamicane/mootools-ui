module('ART.Widget');

test('should create a new Class extending ART.Widget', function(){

	g.MyWidget = new Class({

		Extends: ART.Widget,
		
		drawIndex: 0,

		draw: function(){
			this.drawIndex++;
			equals(this.drawIndex, 1);
			start();
		}

	});

});

asyncTest('ART.Widget instances should call the method draw only once, even when multiple actions are called.', function(){
	var wiggy = new g.MyWidget;
	wiggy.disable();
	wiggy.enable();
	wiggy.focus();
	wiggy.blur();
	wiggy.activate();
	wiggy.deactivate();
});

test('ART.Widget should mirror classNames and ids to its element.', function(){
	var wiggy = new g.MyWidget({className: 'someClass1 someClass2', id: 'someID'});
	
	equals($(wiggy).get('id'), 'someID');
	equals($(wiggy).hasClass('someClass1'), true);
	equals($(wiggy).hasClass('someClass2'), true);
	
	wiggy.addClass('someClass3');
	
	equals($(wiggy).hasClass('someClass3'), true);
	
	wiggy.setID('someOtherID');
	
	equals($(wiggy).get('id'), 'someOtherID');
});

test('ART.Widget resize method should resize its element.', function(){
	var wiggy = new g.MyWidget;
	
	wiggy.resize(200, 100);
	
	equals($(wiggy).getStyle('width'), '200px');
	equals($(wiggy).getStyle('height'), '100px');
	
	wiggy.resize(300, 200);
	
	equals($(wiggy).getStyle('width'), '300px');
	equals($(wiggy).getStyle('height'), '200px');
});
