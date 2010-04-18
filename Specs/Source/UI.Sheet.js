module('UI.Sheet');

test('should return an empty object when no rule is found', function(){
	same(UI.Sheet.lookup('*'), {});
	same(UI.Sheet.lookup('foo'), {});
});

test('should define multiple rules for comma seperated selectors', function(){
	UI.Sheet.define('multiA, multiB', {m: 1});
	same(UI.Sheet.lookup('multiA'), {m: 1});
	same(UI.Sheet.lookup('multiB'), {m: 1});
	same(UI.Sheet.lookup('multiC'), {});
});

test('should define some rules', function(){
	UI.Sheet.define('*', {base: 1, asterix: 1});
	same(UI.Sheet.lookup('*'), {base: 1, asterix: 1});
	
	UI.Sheet.define('foo', {base: 2, extended: 1});
	UI.Sheet.define('foo.classA', {extended: 2});
	UI.Sheet.define('foo.classB', {'class': 'b', 'tag': 'foo'});
	UI.Sheet.define('foo.classA.classB', {'class': 'a and b'});
	UI.Sheet.define('foo.classA', {'class': 'a'});

	UI.Sheet.define('nested rule', {'x': 1});
});

test('should merge with *', function(){
	same(UI.Sheet.lookup('*'), {base: 1, asterix: 1});
	same(UI.Sheet.lookup('madeup'), {base: 1, asterix: 1});
	same(UI.Sheet.lookup('foo'), {base: 2, extended: 1, asterix: 1});
});

test('should find the class', function(){
	same(UI.Sheet.lookup('.classA'), {asterix: 1, base: 1});
	same(UI.Sheet.lookup('foo.classA'), {asterix: 1, base: 2, extended: 2, 'class': 'a'});
	same(UI.Sheet.lookup('foo.classA'), {asterix: 1, base: 2, extended: 2, 'class': 'a'});
	same(UI.Sheet.lookup('foo.classB.classA.madeup'), {asterix: 1, base: 2, extended: 2, 'class': 'a and b', tag: 'foo'});
});

test('should match nested rules', function(){
	same(UI.Sheet.lookup('rule'), {asterix: 1, base: 1});
	same(UI.Sheet.lookup('rule nested'), {asterix: 1, base: 1});
	same(UI.Sheet.lookup('nested rule'), {asterix: 1, base: 1, x: 1});
	same(UI.Sheet.lookup('xxx nested xxx xxx rule'), {asterix: 1, base: 1, x: 1});
	same(UI.Sheet.lookup('xxx nested xxx xxx rule xxx'), {asterix: 1, base: 1});
	same(UI.Sheet.lookup('nested.foo rule'), {asterix: 1, base: 1, x: 1});
});

test('should match pseudos', function(){
	UI.Sheet.define('rule:somePseudo', {base: 2, asterix: 2});

	same(UI.Sheet.lookup('rule:someOtherPseudo'), UI.Sheet.lookup('rule'));
	same(UI.Sheet.lookup('rule:somePseudo'), {base: 2, asterix: 2});
});
