/*
---
name: UI.Sheet
description: StyleSheet cascading emulator
author: Jan Kassens
requires: [UI, Core/Array, Core/String, Slick/Slick.Parser]
provides: UI.Sheet
...
*/

(function(){ // http://www.w3.org/TR/CSS21/cascade.html#specificity

var Sheet = UI.Sheet = {};

rules = [];

var parseSelector = function(selector){
	return selector.map(function(chunk){
		var result = [];
		if (chunk.tag && chunk.tag != '*'){
			result.push(chunk.tag);
		}
		if (chunk.pseudos) chunk.pseudos.each(function(pseudo){
			result.push(':' + pseudo.key);
		});
		if (chunk.classes) chunk.classes.each(function(klass){
			result.push('.' + klass);
		});
		return result;
	});
};

var getSpecificity = function(selector){
	specificity = 0;
	selector.each(function(chunk){
		if (chunk.tag && chunk.tag != '*') specificity++;
		specificity += (chunk.pseudos || []).length;
		specificity += (chunk.classes || []).length * 100;
	});
	return specificity;
};

Sheet.define = function(selectors, style){
	Slick.parse(selectors).expressions.each(function(selector){
		var rule = {
			'specificity': getSpecificity(selector),
			'selector': parseSelector(selector),
			'style': {}
		};
		for (var p in style) rule.style[p.camelCase()] = style[p];
		rules.push(rule);
	});
	
	return this;
};

var containsAll = function(self, other){
	return other.every(function(x){
		return self.contains(x);
	}, this);
};

Sheet.lookup = function(selector){
	var style = {};
	rules.sort(function(a, b){
		return a.specificity - b.specificity;
	});

	selector = parseSelector(Slick.parse(selector).expressions[0]);
	rules.each(function(rule){
		var i = rule.selector.length - 1, j = selector.length - 1;
		if (!containsAll(selector[j], rule.selector[i])) return;
		while (i-- > 0){
			while (true){
				if (j-- <= 0) return;
				if (containsAll(selector[j], rule.selector[i])) break;
			}
		}
		$mixin(style, rule.style);
	});
	return style;
};

})();
