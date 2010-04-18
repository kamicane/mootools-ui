
/*
---

name: Core

description: The core of MooTools, contains all the base functions and the Native and Hash implementations. Required by all the other scripts.

license: MIT-style license.

copyright: Copyright (c) 2006-2008 [Valerio Proietti](http://mad4milk.net/).

authors: The MooTools production team (http://mootools.net/developers/)

inspiration:
  - Class implementation inspired by [Base.js](http://dean.edwards.name/weblog/2006/03/base/) Copyright (c) 2006 Dean Edwards, [GNU Lesser General Public License](http://opensource.org/licenses/lgpl-license.php)
  - Some functionality inspired by [Prototype.js](http://prototypejs.org) Copyright (c) 2005-2007 Sam Stephenson, [MIT License](http://opensource.org/licenses/mit-license.php)

provides: [MooTools, Native, Hash.base, Array.each, $util]

...
*/

var MooTools = {
	'version': '1.2.5dev',
	'build': 'f167725345e98638889a49335790690609541d73'
};

var Native = function(options){
	options = options || {};
	var name = options.name;
	var legacy = options.legacy;
	var protect = options.protect;
	var methods = options.implement;
	var generics = options.generics;
	var initialize = options.initialize;
	var afterImplement = options.afterImplement || function(){};
	var object = initialize || legacy;
	generics = generics !== false;

	object.constructor = Native;
	object.$family = {name: 'native'};
	if (legacy && initialize) object.prototype = legacy.prototype;
	object.prototype.constructor = object;

	if (name){
		var family = name.toLowerCase();
		object.prototype.$family = {name: family};
		Native.typize(object, family);
	}

	var add = function(obj, name, method, force){
		if (!protect || force || !obj.prototype[name]) obj.prototype[name] = method;
		if (generics) Native.genericize(obj, name, protect);
		afterImplement.call(obj, name, method);
		return obj;
	};

	object.alias = function(a1, a2, a3){
		if (typeof a1 == 'string'){
			var pa1 = this.prototype[a1];
			if ((a1 = pa1)) return add(this, a2, a1, a3);
		}
		for (var a in a1) this.alias(a, a1[a], a2);
		return this;
	};

	object.implement = function(a1, a2, a3){
		if (typeof a1 == 'string') return add(this, a1, a2, a3);
		for (var p in a1) add(this, p, a1[p], a2);
		return this;
	};

	if (methods) object.implement(methods);

	return object;
};

Native.genericize = function(object, property, check){
	if ((!check || !object[property]) && typeof object.prototype[property] == 'function') object[property] = function(){
		var args = Array.prototype.slice.call(arguments);
		return object.prototype[property].apply(args.shift(), args);
	};
};

Native.implement = function(objects, properties){
	for (var i = 0, l = objects.length; i < l; i++) objects[i].implement(properties);
};

Native.typize = function(object, family){
	if (!object.type) object.type = function(item){
		return ($type(item) === family);
	};
};

(function(){
	var natives = {'Array': Array, 'Date': Date, 'Function': Function, 'Number': Number, 'RegExp': RegExp, 'String': String};
	for (var n in natives) new Native({name: n, initialize: natives[n], protect: true});

	var types = {'boolean': Boolean, 'native': Native, 'object': Object};
	for (var t in types) Native.typize(types[t], t);

	var generics = {
		'Array': ["concat", "indexOf", "join", "lastIndexOf", "pop", "push", "reverse", "shift", "slice", "sort", "splice", "toString", "unshift", "valueOf"],
		'String': ["charAt", "charCodeAt", "concat", "indexOf", "lastIndexOf", "match", "replace", "search", "slice", "split", "substr", "substring", "toLowerCase", "toUpperCase", "valueOf"]
	};
	for (var g in generics){
		for (var i = generics[g].length; i--;) Native.genericize(natives[g], generics[g][i], true);
	}
})();

var Hash = new Native({

	name: 'Hash',

	initialize: function(object){
		if ($type(object) == 'hash') object = $unlink(object.getClean());
		for (var key in object) this[key] = object[key];
		return this;
	}

});

Hash.implement({

	forEach: function(fn, bind){
		for (var key in this){
			if (this.hasOwnProperty(key)) fn.call(bind, this[key], key, this);
		}
	},

	getClean: function(){
		var clean = {};
		for (var key in this){
			if (this.hasOwnProperty(key)) clean[key] = this[key];
		}
		return clean;
	},

	getLength: function(){
		var length = 0;
		for (var key in this){
			if (this.hasOwnProperty(key)) length++;
		}
		return length;
	}

});

Hash.alias('forEach', 'each');

Array.implement({

	forEach: function(fn, bind){
		for (var i = 0, l = this.length; i < l; i++) fn.call(bind, this[i], i, this);
	}

});

Array.alias('forEach', 'each');

function $A(iterable){
	if (iterable.item){
		var l = iterable.length, array = new Array(l);
		while (l--) array[l] = iterable[l];
		return array;
	}
	return Array.prototype.slice.call(iterable);
};

function $arguments(i){
	return function(){
		return arguments[i];
	};
};

function $chk(obj){
	return !!(obj || obj === 0);
};

function $clear(timer){
	clearTimeout(timer);
	clearInterval(timer);
	return null;
};

function $defined(obj){
	return (obj != undefined);
};

function $each(iterable, fn, bind){
	var type = $type(iterable);
	((type == 'arguments' || type == 'collection' || type == 'array') ? Array : Hash).each(iterable, fn, bind);
};

function $empty(){};

function $extend(original, extended){
	for (var key in (extended || {})) original[key] = extended[key];
	return original;
};

function $H(object){
	return new Hash(object);
};

function $lambda(value){
	return ($type(value) == 'function') ? value : function(){
		return value;
	};
};

function $merge(){
	var args = Array.slice(arguments);
	args.unshift({});
	return $mixin.apply(null, args);
};

function $mixin(mix){
	for (var i = 1, l = arguments.length; i < l; i++){
		var object = arguments[i];
		if ($type(object) != 'object') continue;
		for (var key in object){
			var op = object[key], mp = mix[key];
			mix[key] = (mp && $type(op) == 'object' && $type(mp) == 'object') ? $mixin(mp, op) : $unlink(op);
		}
	}
	return mix;
};

function $pick(){
	for (var i = 0, l = arguments.length; i < l; i++){
		if (arguments[i] != undefined) return arguments[i];
	}
	return null;
};

function $random(min, max){
	return Math.floor(Math.random() * (max - min + 1) + min);
};

function $splat(obj){
	var type = $type(obj);
	return (type) ? ((type != 'array' && type != 'arguments') ? [obj] : obj) : [];
};

var $time = Date.now || function(){
	return +new Date;
};

function $try(){
	for (var i = 0, l = arguments.length; i < l; i++){
		try {
			return arguments[i]();
		} catch(e){}
	}
	return null;
};

function $type(obj){
	if (obj == undefined) return false;
	if (obj.$family) return (obj.$family.name == 'number' && !isFinite(obj)) ? false : obj.$family.name;
	if (obj.nodeName){
		switch (obj.nodeType){
			case 1: return 'element';
			case 3: return (/\S/).test(obj.nodeValue) ? 'textnode' : 'whitespace';
		}
	} else if (typeof obj.length == 'number'){
		if (obj.callee) return 'arguments';
		else if (obj.item) return 'collection';
	}
	return typeof obj;
};

function $unlink(object){
	var unlinked;
	switch ($type(object)){
		case 'object':
			unlinked = {};
			for (var p in object) unlinked[p] = $unlink(object[p]);
		break;
		case 'hash':
			unlinked = new Hash(object);
		break;
		case 'array':
			unlinked = [];
			for (var i = 0, l = object.length; i < l; i++) unlinked[i] = $unlink(object[i]);
		break;
		default: return object;
	}
	return unlinked;
};


/*
---

name: Browser

description: The Browser Core. Contains Browser initialization, Window and Document, and the Browser Hash.

license: MIT-style license.

requires: [Native, $util]

provides: [Browser, Window, Document, $exec]

...
*/

var Browser = $merge({

	Engine: {name: 'unknown', version: 0},

	Platform: {name: (window.orientation != undefined) ? 'ipod' : (navigator.platform.match(/mac|win|linux/i) || ['other'])[0].toLowerCase()},

	Features: {xpath: !!(document.evaluate), air: !!(window.runtime), query: !!(document.querySelector)},

	Plugins: {},

	Engines: {

		presto: function(){
			return (!window.opera) ? false : ((arguments.callee.caller) ? 960 : ((document.getElementsByClassName) ? 950 : 925));
		},

		trident: function(){
			return (!window.ActiveXObject) ? false : ((window.XMLHttpRequest) ? ((document.querySelectorAll) ? 6 : 5) : 4);
		},

		webkit: function(){
			return (navigator.taintEnabled) ? false : ((Browser.Features.xpath) ? ((Browser.Features.query) ? 525 : 420) : 419);
		},

		gecko: function(){
			return (!document.getBoxObjectFor && window.mozInnerScreenX == null) ? false : ((document.getElementsByClassName) ? 19 : 18);
		}

	}

}, Browser || {});

Browser.Platform[Browser.Platform.name] = true;

Browser.detect = function(){

	for (var engine in this.Engines){
		var version = this.Engines[engine]();
		if (version){
			this.Engine = {name: engine, version: version};
			this.Engine[engine] = this.Engine[engine + version] = true;
			break;
		}
	}

	return {name: engine, version: version};

};

Browser.detect();

Browser.Request = function(){
	return $try(function(){
		return new XMLHttpRequest();
	}, function(){
		return new ActiveXObject('MSXML2.XMLHTTP');
	}, function(){
		return new ActiveXObject('Microsoft.XMLHTTP');
	});
};

Browser.Features.xhr = !!(Browser.Request());

Browser.Plugins.Flash = (function(){
	var version = ($try(function(){
		return navigator.plugins['Shockwave Flash'].description;
	}, function(){
		return new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version');
	}) || '0 r0').match(/\d+/g);
	return {version: parseInt(version[0] || 0 + '.' + version[1], 10) || 0, build: parseInt(version[2], 10) || 0};
})();

function $exec(text){
	if (!text) return text;
	if (window.execScript){
		window.execScript(text);
	} else {
		var script = document.createElement('script');
		script.setAttribute('type', 'text/javascript');
		script[(Browser.Engine.webkit && Browser.Engine.version < 420) ? 'innerText' : 'text'] = text;
		document.head.appendChild(script);
		document.head.removeChild(script);
	}
	return text;
};

Native.UID = 1;

var $uid = (Browser.Engine.trident) ? function(item){
	return (item.uid || (item.uid = [Native.UID++]))[0];
} : function(item){
	return item.uid || (item.uid = Native.UID++);
};

var Window = new Native({

	name: 'Window',

	legacy: (Browser.Engine.trident) ? null: window.Window,

	initialize: function(win){
		$uid(win);
		if (!win.Element){
			win.Element = $empty;
			if (Browser.Engine.webkit) win.document.createElement("iframe"); //fixes safari 2
			win.Element.prototype = (Browser.Engine.webkit) ? window["[[DOMElement.prototype]]"] : {};
		}
		win.document.window = win;
		return $extend(win, Window.Prototype);
	},

	afterImplement: function(property, value){
		window[property] = Window.Prototype[property] = value;
	}

});

Window.Prototype = {$family: {name: 'window'}};

new Window(window);

var Document = new Native({

	name: 'Document',

	legacy: (Browser.Engine.trident) ? null: window.Document,

	initialize: function(doc){
		$uid(doc);
		doc.head = doc.getElementsByTagName('head')[0];
		doc.html = doc.getElementsByTagName('html')[0];
		if (Browser.Engine.trident && Browser.Engine.version <= 4) $try(function(){
			doc.execCommand("BackgroundImageCache", false, true);
		});
		if (Browser.Engine.trident) doc.window.attachEvent('onunload', function(){
			doc.window.detachEvent('onunload', arguments.callee);
			doc.head = doc.html = doc.window = null;
		});
		return $extend(doc, Document.Prototype);
	},

	afterImplement: function(property, value){
		document[property] = Document.Prototype[property] = value;
	}

});

Document.Prototype = {$family: {name: 'document'}};

new Document(document);


/*
---

name: Array

description: Contains Array Prototypes like each, contains, and erase.

license: MIT-style license.

requires: [$util, Array.each]

provides: Array

...
*/

Array.implement({

	every: function(fn, bind){
		for (var i = 0, l = this.length; i < l; i++){
			if (!fn.call(bind, this[i], i, this)) return false;
		}
		return true;
	},

	filter: function(fn, bind){
		var results = [];
		for (var i = 0, l = this.length; i < l; i++){
			if (fn.call(bind, this[i], i, this)) results.push(this[i]);
		}
		return results;
	},

	clean: function(){
		return this.filter($defined);
	},

	indexOf: function(item, from){
		var len = this.length;
		for (var i = (from < 0) ? Math.max(0, len + from) : from || 0; i < len; i++){
			if (this[i] === item) return i;
		}
		return -1;
	},

	map: function(fn, bind){
		var results = [];
		for (var i = 0, l = this.length; i < l; i++) results[i] = fn.call(bind, this[i], i, this);
		return results;
	},

	some: function(fn, bind){
		for (var i = 0, l = this.length; i < l; i++){
			if (fn.call(bind, this[i], i, this)) return true;
		}
		return false;
	},

	associate: function(keys){
		var obj = {}, length = Math.min(this.length, keys.length);
		for (var i = 0; i < length; i++) obj[keys[i]] = this[i];
		return obj;
	},

	link: function(object){
		var result = {};
		for (var i = 0, l = this.length; i < l; i++){
			for (var key in object){
				if (object[key](this[i])){
					result[key] = this[i];
					delete object[key];
					break;
				}
			}
		}
		return result;
	},

	contains: function(item, from){
		return this.indexOf(item, from) != -1;
	},

	extend: function(array){
		for (var i = 0, j = array.length; i < j; i++) this.push(array[i]);
		return this;
	},
	
	getLast: function(){
		return (this.length) ? this[this.length - 1] : null;
	},

	getRandom: function(){
		return (this.length) ? this[$random(0, this.length - 1)] : null;
	},

	include: function(item){
		if (!this.contains(item)) this.push(item);
		return this;
	},

	combine: function(array){
		for (var i = 0, l = array.length; i < l; i++) this.include(array[i]);
		return this;
	},

	erase: function(item){
		for (var i = this.length; i--; i){
			if (this[i] === item) this.splice(i, 1);
		}
		return this;
	},

	empty: function(){
		this.length = 0;
		return this;
	},

	flatten: function(){
		var array = [];
		for (var i = 0, l = this.length; i < l; i++){
			var type = $type(this[i]);
			if (!type) continue;
			array = array.concat((type == 'array' || type == 'collection' || type == 'arguments') ? Array.flatten(this[i]) : this[i]);
		}
		return array;
	},

	hexToRgb: function(array){
		if (this.length != 3) return null;
		var rgb = this.map(function(value){
			if (value.length == 1) value += value;
			return value.toInt(16);
		});
		return (array) ? rgb : 'rgb(' + rgb + ')';
	},

	rgbToHex: function(array){
		if (this.length < 3) return null;
		if (this.length == 4 && this[3] == 0 && !array) return 'transparent';
		var hex = [];
		for (var i = 0; i < 3; i++){
			var bit = (this[i] - 0).toString(16);
			hex.push((bit.length == 1) ? '0' + bit : bit);
		}
		return (array) ? hex : '#' + hex.join('');
	}

});


/*
---

name: String

description: Contains String Prototypes like camelCase, capitalize, test, and toInt.

license: MIT-style license.

requires: Native

provides: String

...
*/

String.implement({

	test: function(regex, params){
		return ((typeof regex == 'string') ? new RegExp(regex, params) : regex).test(this);
	},

	contains: function(string, separator){
		return (separator) ? (separator + this + separator).indexOf(separator + string + separator) > -1 : this.indexOf(string) > -1;
	},

	trim: function(){
		return this.replace(/^\s+|\s+$/g, '');
	},

	clean: function(){
		return this.replace(/\s+/g, ' ').trim();
	},

	camelCase: function(){
		return this.replace(/-\D/g, function(match){
			return match.charAt(1).toUpperCase();
		});
	},

	hyphenate: function(){
		return this.replace(/[A-Z]/g, function(match){
			return ('-' + match.charAt(0).toLowerCase());
		});
	},

	capitalize: function(){
		return this.replace(/\b[a-z]/g, function(match){
			return match.toUpperCase();
		});
	},

	escapeRegExp: function(){
		return this.replace(/([-.*+?^${}()|[\]\/\\])/g, '\\$1');
	},

	toInt: function(base){
		return parseInt(this, base || 10);
	},

	toFloat: function(){
		return parseFloat(this);
	},

	hexToRgb: function(array){
		var hex = this.match(/^#?(\w{1,2})(\w{1,2})(\w{1,2})$/);
		return (hex) ? hex.slice(1).hexToRgb(array) : null;
	},

	rgbToHex: function(array){
		var rgb = this.match(/\d{1,3}/g);
		return (rgb) ? rgb.rgbToHex(array) : null;
	},

	stripScripts: function(option){
		var scripts = '';
		var text = this.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, function(){
			scripts += arguments[1] + '\n';
			return '';
		});
		if (option === true) $exec(scripts);
		else if ($type(option) == 'function') option(scripts, text);
		return text;
	},

	substitute: function(object, regexp){
		return this.replace(regexp || (/\\?\{([^{}]+)\}/g), function(match, name){
			if (match.charAt(0) == '\\') return match.slice(1);
			return (object[name] != undefined) ? object[name] : '';
		});
	}

});


/*
---

name: Number

description: Contains Number Prototypes like limit, round, times, and ceil.

license: MIT-style license.

requires: [Native, $util]

provides: Number

...
*/

Number.implement({

	limit: function(min, max){
		return Math.min(max, Math.max(min, this));
	},

	round: function(precision){
		precision = Math.pow(10, precision || 0);
		return Math.round(this * precision) / precision;
	},

	times: function(fn, bind){
		for (var i = 0; i < this; i++) fn.call(bind, i, this);
	},

	toFloat: function(){
		return parseFloat(this);
	},

	toInt: function(base){
		return parseInt(this, base || 10);
	}

});

Number.alias('times', 'each');

(function(math){
	var methods = {};
	math.each(function(name){
		if (!Number[name]) methods[name] = function(){
			return Math[name].apply(null, [this].concat($A(arguments)));
		};
	});
	Number.implement(methods);
})(['abs', 'acos', 'asin', 'atan', 'atan2', 'ceil', 'cos', 'exp', 'floor', 'log', 'max', 'min', 'pow', 'sin', 'sqrt', 'tan']);


/*
---

name: Function

description: Contains Function Prototypes like create, bind, pass, and delay.

license: MIT-style license.

requires: [Native, $util]

provides: Function

...
*/

Function.implement({

	extend: function(properties){
		for (var property in properties) this[property] = properties[property];
		return this;
	},

	create: function(options){
		var self = this;
		options = options || {};
		return function(event){
			var args = options.arguments;
			args = (args != undefined) ? $splat(args) : Array.slice(arguments, (options.event) ? 1 : 0);
			if (options.event) args = [event || window.event].extend(args);
			var returns = function(){
				return self.apply(options.bind || null, args);
			};
			if (options.delay) return setTimeout(returns, options.delay);
			if (options.periodical) return setInterval(returns, options.periodical);
			if (options.attempt) return $try(returns);
			return returns();
		};
	},

	run: function(args, bind){
		return this.apply(bind, $splat(args));
	},

	pass: function(args, bind){
		return this.create({bind: bind, arguments: args});
	},

	bind: function(bind, args){
		return this.create({bind: bind, arguments: args});
	},

	bindWithEvent: function(bind, args){
		return this.create({bind: bind, arguments: args, event: true});
	},

	attempt: function(args, bind){
		return this.create({bind: bind, arguments: args, attempt: true})();
	},

	delay: function(delay, bind, args){
		return this.create({bind: bind, arguments: args, delay: delay})();
	},

	periodical: function(periodical, bind, args){
		return this.create({bind: bind, arguments: args, periodical: periodical})();
	}

});


/*
---

name: Hash

description: Contains Hash Prototypes. Provides a means for overcoming the JavaScript practical impossibility of extending native Objects.

license: MIT-style license.

requires: Hash.base

provides: Hash

...
*/

Hash.implement({

	has: Object.prototype.hasOwnProperty,

	keyOf: function(value){
		for (var key in this){
			if (this.hasOwnProperty(key) && this[key] === value) return key;
		}
		return null;
	},

	hasValue: function(value){
		return (Hash.keyOf(this, value) !== null);
	},

	extend: function(properties){
		Hash.each(properties || {}, function(value, key){
			Hash.set(this, key, value);
		}, this);
		return this;
	},

	combine: function(properties){
		Hash.each(properties || {}, function(value, key){
			Hash.include(this, key, value);
		}, this);
		return this;
	},

	erase: function(key){
		if (this.hasOwnProperty(key)) delete this[key];
		return this;
	},

	get: function(key){
		return (this.hasOwnProperty(key)) ? this[key] : null;
	},

	set: function(key, value){
		if (!this[key] || this.hasOwnProperty(key)) this[key] = value;
		return this;
	},

	empty: function(){
		Hash.each(this, function(value, key){
			delete this[key];
		}, this);
		return this;
	},

	include: function(key, value){
		if (this[key] == undefined) this[key] = value;
		return this;
	},

	map: function(fn, bind){
		var results = new Hash;
		Hash.each(this, function(value, key){
			results.set(key, fn.call(bind, value, key, this));
		}, this);
		return results;
	},

	filter: function(fn, bind){
		var results = new Hash;
		Hash.each(this, function(value, key){
			if (fn.call(bind, value, key, this)) results.set(key, value);
		}, this);
		return results;
	},

	every: function(fn, bind){
		for (var key in this){
			if (this.hasOwnProperty(key) && !fn.call(bind, this[key], key)) return false;
		}
		return true;
	},

	some: function(fn, bind){
		for (var key in this){
			if (this.hasOwnProperty(key) && fn.call(bind, this[key], key)) return true;
		}
		return false;
	},

	getKeys: function(){
		var keys = [];
		Hash.each(this, function(value, key){
			keys.push(key);
		});
		return keys;
	},

	getValues: function(){
		var values = [];
		Hash.each(this, function(value){
			values.push(value);
		});
		return values;
	},

	toQueryString: function(base){
		var queryString = [];
		Hash.each(this, function(value, key){
			if (base) key = base + '[' + key + ']';
			var result;
			switch ($type(value)){
				case 'object': result = Hash.toQueryString(value, key); break;
				case 'array':
					var qs = {};
					value.each(function(val, i){
						qs[i] = val;
					});
					result = Hash.toQueryString(qs, key);
				break;
				default: result = key + '=' + encodeURIComponent(value);
			}
			if (value != undefined) queryString.push(result);
		});

		return queryString.join('&');
	}

});

Hash.alias({keyOf: 'indexOf', hasValue: 'contains'});


/*
---

name: Event

description: Contains the Event Class, to make the event object cross-browser.

license: MIT-style license.

requires: [Window, Document, Hash, Array, Function, String]

provides: Event

...
*/

var Event = new Native({

	name: 'Event',

	initialize: function(event, win){
		win = win || window;
		var doc = win.document;
		event = event || win.event;
		if (event.$extended) return event;
		this.$extended = true;
		var type = event.type;
		var target = event.target || event.srcElement;
		while (target && target.nodeType == 3) target = target.parentNode;

		if (type.test(/key/)){
			var code = event.which || event.keyCode;
			var key = Event.Keys.keyOf(code);
			if (type == 'keydown'){
				var fKey = code - 111;
				if (fKey > 0 && fKey < 13) key = 'f' + fKey;
			}
			key = key || String.fromCharCode(code).toLowerCase();
		} else if (type.match(/(click|mouse|menu)/i)){
			doc = (!doc.compatMode || doc.compatMode == 'CSS1Compat') ? doc.html : doc.body;
			var page = {
				x: event.pageX || event.clientX + doc.scrollLeft,
				y: event.pageY || event.clientY + doc.scrollTop
			};
			var client = {
				x: (event.pageX) ? event.pageX - win.pageXOffset : event.clientX,
				y: (event.pageY) ? event.pageY - win.pageYOffset : event.clientY
			};
			if (type.match(/DOMMouseScroll|mousewheel/)){
				var wheel = (event.wheelDelta) ? event.wheelDelta / 120 : -(event.detail || 0) / 3;
			}
			var rightClick = (event.which == 3) || (event.button == 2);
			var related = null;
			if (type.match(/over|out/)){
				switch (type){
					case 'mouseover': related = event.relatedTarget || event.fromElement; break;
					case 'mouseout': related = event.relatedTarget || event.toElement;
				}
				if (!(function(){
					while (related && related.nodeType == 3) related = related.parentNode;
					return true;
				}).create({attempt: Browser.Engine.gecko})()) related = false;
			}
		}

		return $extend(this, {
			event: event,
			type: type,

			page: page,
			client: client,
			rightClick: rightClick,

			wheel: wheel,

			relatedTarget: related,
			target: target,

			code: code,
			key: key,

			shift: event.shiftKey,
			control: event.ctrlKey,
			alt: event.altKey,
			meta: event.metaKey
		});
	}

});

Event.Keys = new Hash({
	'enter': 13,
	'up': 38,
	'down': 40,
	'left': 37,
	'right': 39,
	'esc': 27,
	'space': 32,
	'backspace': 8,
	'tab': 9,
	'delete': 46
});

Event.implement({

	stop: function(){
		return this.stopPropagation().preventDefault();
	},

	stopPropagation: function(){
		if (this.event.stopPropagation) this.event.stopPropagation();
		else this.event.cancelBubble = true;
		return this;
	},

	preventDefault: function(){
		if (this.event.preventDefault) this.event.preventDefault();
		else this.event.returnValue = false;
		return this;
	}

});


/*
---

name: Class

description: Contains the Class Function for easily creating, extending, and implementing reusable Classes.

license: MIT-style license.

requires: [$util, Native, Array, String, Function, Number, Hash]

provides: Class

...
*/

function Class(params){
	
	if (params instanceof Function) params = {initialize: params};
	
	var newClass = function(){
		Object.reset(this);
		if (newClass._prototyping) return this;
		this._current = $empty;
		var value = (this.initialize) ? this.initialize.apply(this, arguments) : this;
		delete this._current; delete this.caller;
		return value;
	}.extend(this);
	
	newClass.implement(params);
	
	newClass.constructor = Class;
	newClass.prototype.constructor = newClass;

	return newClass;

};

Function.prototype.protect = function(){
	this._protected = true;
	return this;
};

Object.reset = function(object, key){
		
	if (key == null){
		for (var p in object) Object.reset(object, p);
		return object;
	}
	
	delete object[key];
	
	switch ($type(object[key])){
		case 'object':
			var F = function(){};
			F.prototype = object[key];
			var i = new F;
			object[key] = Object.reset(i);
		break;
		case 'array': object[key] = $unlink(object[key]); break;
	}
	
	return object;
	
};

new Native({name: 'Class', initialize: Class}).extend({

	instantiate: function(F){
		F._prototyping = true;
		var proto = new F;
		delete F._prototyping;
		return proto;
	},
	
	wrap: function(self, key, method){
		if (method._origin) method = method._origin;
		
		return function(){
			if (method._protected && this._current == null) throw new Error('The method "' + key + '" cannot be called.');
			var caller = this.caller, current = this._current;
			this.caller = current; this._current = arguments.callee;
			var result = method.apply(this, arguments);
			this._current = current; this.caller = caller;
			return result;
		}.extend({_owner: self, _origin: method, _name: key});

	}
	
});

Class.implement({
	
	implement: function(key, value){
		
		if ($type(key) == 'object'){
			for (var p in key) this.implement(p, key[p]);
			return this;
		}
		
		var mutator = Class.Mutators[key];
		
		if (mutator){
			value = mutator.call(this, value);
			if (value == null) return this;
		}
		
		var proto = this.prototype;

		switch ($type(value)){
			
			case 'function':
				if (value._hidden) return this;
				proto[key] = Class.wrap(this, key, value);
			break;
			
			case 'object':
				var previous = proto[key];
				if ($type(previous) == 'object') $mixin(previous, value);
				else proto[key] = $unlink(value);
			break;
			
			case 'array':
				proto[key] = $unlink(value);
			break;
			
			default: proto[key] = value;

		}
		
		return this;

	}
	
});

Class.Mutators = {
	
	Extends: function(parent){

		this.parent = parent;
		this.prototype = Class.instantiate(parent);

		this.implement('parent', function(){
			var name = this.caller._name, previous = this.caller._owner.parent.prototype[name];
			if (!previous) throw new Error('The method "' + name + '" has no parent.');
			return previous.apply(this, arguments);
		}.protect());

	},

	Implements: function(items){
		$splat(items).each(function(item){
			if (item instanceof Function) item = Class.instantiate(item);
			this.implement(item);
		}, this);

	}
	
};


/*
---

name: Class.Extras

description: Contains Utility Classes that can be implemented into your own Classes to ease the execution of many common tasks.

license: MIT-style license.

requires: Class

provides: [Chain, Events, Options]

...
*/

var Chain = new Class({

	$chain: [],

	chain: function(){
		this.$chain.extend(Array.flatten(arguments));
		return this;
	},

	callChain: function(){
		return (this.$chain.length) ? this.$chain.shift().apply(this, arguments) : false;
	},

	clearChain: function(){
		this.$chain.empty();
		return this;
	}

});

var Events = new Class({

	$events: {},

	addEvent: function(type, fn, internal){
		type = Events.removeOn(type);
		if (fn != $empty){
			this.$events[type] = this.$events[type] || [];
			this.$events[type].include(fn);
			if (internal) fn.internal = true;
		}
		return this;
	},

	addEvents: function(events){
		for (var type in events) this.addEvent(type, events[type]);
		return this;
	},

	fireEvent: function(type, args, delay){
		type = Events.removeOn(type);
		if (!this.$events || !this.$events[type]) return this;
		this.$events[type].each(function(fn){
			fn.create({'bind': this, 'delay': delay, 'arguments': args})();
		}, this);
		return this;
	},

	removeEvent: function(type, fn){
		type = Events.removeOn(type);
		if (!this.$events[type]) return this;
		if (!fn.internal) this.$events[type].erase(fn);
		return this;
	},

	removeEvents: function(events){
		var type;
		if ($type(events) == 'object'){
			for (type in events) this.removeEvent(type, events[type]);
			return this;
		}
		if (events) events = Events.removeOn(events);
		for (type in this.$events){
			if (events && events != type) continue;
			var fns = this.$events[type];
			for (var i = fns.length; i--; i) this.removeEvent(type, fns[i]);
		}
		return this;
	}

});

Events.removeOn = function(string){
	return string.replace(/^on([A-Z])/, function(full, first){
		return first.toLowerCase();
	});
};

var Options = new Class({

	setOptions: function(){
		this.options = $merge.run([this.options].extend(arguments));
		if (!this.addEvent) return this;
		for (var option in this.options){
			if ($type(this.options[option]) != 'function' || !(/^on[A-Z]/).test(option)) continue;
			this.addEvent(option, this.options[option]);
			delete this.options[option];
		}
		return this;
	}

});


/*
---

name: Element

description: One of the most important items in MooTools. Contains the dollar function, the dollars function, and an handful of cross-browser, time-saver methods to let you easily work with HTML Elements.

license: MIT-style license.

requires: [Window, Document, Array, String, Function, Number, Hash]

provides: [Element, Elements, $, $$, Iframe]

...
*/

var Element = new Native({

	name: 'Element',

	legacy: window.Element,

	initialize: function(tag, props){
		var konstructor = Element.Constructors.get(tag);
		if (konstructor) return konstructor(props);
		if (typeof tag == 'string') return document.newElement(tag, props);
		return document.id(tag).set(props);
	},

	afterImplement: function(key, value){
		Element.Prototype[key] = value;
		if (Array[key]) return;
		Elements.implement(key, function(){
			var items = [], elements = true;
			for (var i = 0, j = this.length; i < j; i++){
				var returns = this[i][key].apply(this[i], arguments);
				items.push(returns);
				if (elements) elements = ($type(returns) == 'element');
			}
			return (elements) ? new Elements(items) : items;
		});
	}

});

Element.Prototype = {$family: {name: 'element'}};

Element.Constructors = new Hash;

var IFrame = new Native({

	name: 'IFrame',

	generics: false,

	initialize: function(){
		var params = Array.link(arguments, {properties: Object.type, iframe: $defined});
		var props = params.properties || {};
		var iframe = document.id(params.iframe);
		var onload = props.onload || $empty;
		delete props.onload;
		props.id = props.name = $pick(props.id, props.name, iframe ? (iframe.id || iframe.name) : 'IFrame_' + $time());
		iframe = new Element(iframe || 'iframe', props);
		var onFrameLoad = function(){
			var host = $try(function(){
				return iframe.contentWindow.location.host;
			});
			if (!host || host == window.location.host){
				var win = new Window(iframe.contentWindow);
				new Document(iframe.contentWindow.document);
				$extend(win.Element.prototype, Element.Prototype);
			}
			onload.call(iframe.contentWindow, iframe.contentWindow.document);
		};
		var contentWindow = $try(function(){
			return iframe.contentWindow;
		});
		((contentWindow && contentWindow.document.body) || window.frames[props.id]) ? onFrameLoad() : iframe.addListener('load', onFrameLoad);
		return iframe;
	}

});

var Elements = new Native({

	initialize: function(elements, options){
		options = $extend({ddup: true, cash: true}, options);
		elements = elements || [];
		if (options.ddup || options.cash){
			var uniques = {}, returned = [];
			for (var i = 0, l = elements.length; i < l; i++){
				var el = document.id(elements[i], !options.cash);
				if (options.ddup){
					if (uniques[el.uid]) continue;
					uniques[el.uid] = true;
				}
				if (el) returned.push(el);
			}
			elements = returned;
		}
		return (options.cash) ? $extend(elements, this) : elements;
	}

});

Elements.implement({

	filter: function(filter, bind){
		if (!filter) return this;
		return new Elements(Array.filter(this, (typeof filter == 'string') ? function(item){
			return item.match(filter);
		} : filter, bind));
	}

});

Document.implement({

	newElement: function(tag, props){
		if (Browser.Engine.trident && props){
			['name', 'type', 'checked'].each(function(attribute){
				if (!props[attribute]) return;
				tag += ' ' + attribute + '="' + props[attribute] + '"';
				if (attribute != 'checked') delete props[attribute];
			});
			tag = '<' + tag + '>';
		}
		return document.id(this.createElement(tag)).set(props);
	},

	newTextNode: function(text){
		return this.createTextNode(text);
	},

	getDocument: function(){
		return this;
	},

	getWindow: function(){
		return this.window;
	},
	
	id: (function(){
		
		var types = {

			string: function(id, nocash, doc){
				id = doc.getElementById(id);
				return (id) ? types.element(id, nocash) : null;
			},
			
			element: function(el, nocash){
				$uid(el);
				if (!nocash && !el.$family && !(/^object|embed$/i).test(el.tagName)){
					var proto = Element.Prototype;
					for (var p in proto) el[p] = proto[p];
				};
				return el;
			},
			
			object: function(obj, nocash, doc){
				if (obj.toElement) return types.element(obj.toElement(doc), nocash);
				return null;
			}
			
		};

		types.textnode = types.whitespace = types.window = types.document = $arguments(0);
		
		return function(el, nocash, doc){
			if (el && el.$family && el.uid) return el;
			var type = $type(el);
			return (types[type]) ? types[type](el, nocash, doc || document) : null;
		};

	})()

});

if (window.$ == null) Window.implement({
	$: function(el, nc){
		return document.id(el, nc, this.document);
	}
});

Window.implement({

	$$: function(selector){
		if (arguments.length == 1 && typeof selector == 'string') return this.document.getElements(selector);
		var elements = [];
		var args = Array.flatten(arguments);
		for (var i = 0, l = args.length; i < l; i++){
			var item = args[i];
			switch ($type(item)){
				case 'element': elements.push(item); break;
				case 'string': elements.extend(this.document.getElements(item, true));
			}
		}
		return new Elements(elements);
	},

	getDocument: function(){
		return this.document;
	},

	getWindow: function(){
		return this;
	}

});

Native.implement([Element, Document], {

	getElement: function(selector, nocash){
		return document.id(this.getElements(selector, true)[0] || null, nocash);
	},

	getElements: function(tags, nocash){
		tags = tags.split(',');
		var elements = [];
		var ddup = (tags.length > 1);
		tags.each(function(tag){
			var partial = this.getElementsByTagName(tag.trim());
			(ddup) ? elements.extend(partial) : elements = partial;
		}, this);
		return new Elements(elements, {ddup: ddup, cash: !nocash});
	}

});

(function(){

var collected = {}, storage = {};
var props = {input: 'checked', option: 'selected', textarea: (Browser.Engine.webkit && Browser.Engine.version < 420) ? 'innerHTML' : 'value'};

var get = function(uid){
	return (storage[uid] || (storage[uid] = {}));
};

var clean = function(item, retain){
	if (!item) return;
	var uid = item.uid;
	if (retain !== true) retain = false;
	if (Browser.Engine.trident){
		if (item.clearAttributes){
			var clone = retain && item.cloneNode(false);
			item.clearAttributes();
			if (clone) item.mergeAttributes(clone);
		} else if (item.removeEvents){
			item.removeEvents();
		}
		if ((/object/i).test(item.tagName)){
			for (var p in item){
				if (typeof item[p] == 'function') item[p] = $empty;
			}
			Element.dispose(item);
		}
	}	
	if (!uid) return;
	collected[uid] = storage[uid] = null;
};

var purge = function(){
	Hash.each(collected, clean);
	if (Browser.Engine.trident) $A(document.getElementsByTagName('object')).each(clean);
	if (window.CollectGarbage) CollectGarbage();
	collected = storage = null;
};

var walk = function(element, walk, start, match, all, nocash){
	var el = element[start || walk];
	var elements = [];
	while (el){
		if (el.nodeType == 1 && (!match || Element.match(el, match))){
			if (!all) return document.id(el, nocash);
			elements.push(el);
		}
		el = el[walk];
	}
	return (all) ? new Elements(elements, {ddup: false, cash: !nocash}) : null;
};

var attributes = {
	'html': 'innerHTML',
	'class': 'className',
	'for': 'htmlFor',
	'defaultValue': 'defaultValue',
	'text': (Browser.Engine.trident || (Browser.Engine.webkit && Browser.Engine.version < 420)) ? 'innerText' : 'textContent'
};
var bools = ['compact', 'nowrap', 'ismap', 'declare', 'noshade', 'checked', 'disabled', 'readonly', 'multiple', 'selected', 'noresize', 'defer'];
var camels = ['value', 'type', 'defaultValue', 'accessKey', 'cellPadding', 'cellSpacing', 'colSpan', 'frameBorder', 'maxLength', 'readOnly', 'rowSpan', 'tabIndex', 'useMap'];

bools = bools.associate(bools);

Hash.extend(attributes, bools);
Hash.extend(attributes, camels.associate(camels.map(String.toLowerCase)));

var inserters = {

	before: function(context, element){
		if (element.parentNode) element.parentNode.insertBefore(context, element);
	},

	after: function(context, element){
		if (!element.parentNode) return;
		var next = element.nextSibling;
		(next) ? element.parentNode.insertBefore(context, next) : element.parentNode.appendChild(context);
	},

	bottom: function(context, element){
		element.appendChild(context);
	},

	top: function(context, element){
		var first = element.firstChild;
		(first) ? element.insertBefore(context, first) : element.appendChild(context);
	}

};

inserters.inside = inserters.bottom;

Hash.each(inserters, function(inserter, where){

	where = where.capitalize();

	Element.implement('inject' + where, function(el){
		inserter(this, document.id(el, true));
		return this;
	});

	Element.implement('grab' + where, function(el){
		inserter(document.id(el, true), this);
		return this;
	});

});

Element.implement({

	set: function(prop, value){
		switch ($type(prop)){
			case 'object':
				for (var p in prop) this.set(p, prop[p]);
				break;
			case 'string':
				var property = Element.Properties.get(prop);
				(property && property.set) ? property.set.apply(this, Array.slice(arguments, 1)) : this.setProperty(prop, value);
		}
		return this;
	},

	get: function(prop){
		var property = Element.Properties.get(prop);
		return (property && property.get) ? property.get.apply(this, Array.slice(arguments, 1)) : this.getProperty(prop);
	},

	erase: function(prop){
		var property = Element.Properties.get(prop);
		(property && property.erase) ? property.erase.apply(this) : this.removeProperty(prop);
		return this;
	},

	setProperty: function(attribute, value){
		var key = attributes[attribute];
		if (value == undefined) return this.removeProperty(attribute);
		if (key && bools[attribute]) value = !!value;
		(key) ? this[key] = value : this.setAttribute(attribute, '' + value);
		return this;
	},

	setProperties: function(attributes){
		for (var attribute in attributes) this.setProperty(attribute, attributes[attribute]);
		return this;
	},

	getProperty: function(attribute){
		var key = attributes[attribute];
		var value = (key) ? this[key] : this.getAttribute(attribute, 2);
		return (bools[attribute]) ? !!value : (key) ? value : value || null;
	},

	getProperties: function(){
		var args = $A(arguments);
		return args.map(this.getProperty, this).associate(args);
	},

	removeProperty: function(attribute){
		var key = attributes[attribute];
		(key) ? this[key] = (key && bools[attribute]) ? false : '' : this.removeAttribute(attribute);
		return this;
	},

	removeProperties: function(){
		Array.each(arguments, this.removeProperty, this);
		return this;
	},

	hasClass: function(className){
		return this.className.contains(className, ' ');
	},

	addClass: function(className){
		if (!this.hasClass(className)) this.className = (this.className + ' ' + className).clean();
		return this;
	},

	removeClass: function(className){
		this.className = this.className.replace(new RegExp('(^|\\s)' + className + '(?:\\s|$)'), '$1');
		return this;
	},

	toggleClass: function(className){
		return this.hasClass(className) ? this.removeClass(className) : this.addClass(className);
	},

	adopt: function(){
		Array.flatten(arguments).each(function(element){
			element = document.id(element, true);
			if (element) this.appendChild(element);
		}, this);
		return this;
	},

	appendText: function(text, where){
		return this.grab(this.getDocument().newTextNode(text), where);
	},

	grab: function(el, where){
		inserters[where || 'bottom'](document.id(el, true), this);
		return this;
	},

	inject: function(el, where){
		inserters[where || 'bottom'](this, document.id(el, true));
		return this;
	},

	replaces: function(el){
		el = document.id(el, true);
		el.parentNode.replaceChild(this, el);
		return this;
	},

	wraps: function(el, where){
		el = document.id(el, true);
		return this.replaces(el).grab(el, where);
	},

	getPrevious: function(match, nocash){
		return walk(this, 'previousSibling', null, match, false, nocash);
	},

	getAllPrevious: function(match, nocash){
		return walk(this, 'previousSibling', null, match, true, nocash);
	},

	getNext: function(match, nocash){
		return walk(this, 'nextSibling', null, match, false, nocash);
	},

	getAllNext: function(match, nocash){
		return walk(this, 'nextSibling', null, match, true, nocash);
	},

	getFirst: function(match, nocash){
		return walk(this, 'nextSibling', 'firstChild', match, false, nocash);
	},

	getLast: function(match, nocash){
		return walk(this, 'previousSibling', 'lastChild', match, false, nocash);
	},

	getParent: function(match, nocash){
		return walk(this, 'parentNode', null, match, false, nocash);
	},

	getParents: function(match, nocash){
		return walk(this, 'parentNode', null, match, true, nocash);
	},
	
	getSiblings: function(match, nocash){
		return this.getParent().getChildren(match, nocash).erase(this);
	},

	getChildren: function(match, nocash){
		return walk(this, 'nextSibling', 'firstChild', match, true, nocash);
	},

	getWindow: function(){
		return this.ownerDocument.window;
	},

	getDocument: function(){
		return this.ownerDocument;
	},

	getElementById: function(id, nocash){
		var el = this.ownerDocument.getElementById(id);
		if (!el) return null;
		for (var parent = el.parentNode; parent != this; parent = parent.parentNode){
			if (!parent) return null;
		}
		return document.id(el, nocash);
	},

	getSelected: function(){
		return new Elements($A(this.options).filter(function(option){
			return option.selected;
		}));
	},

	getComputedStyle: function(property){
		if (this.currentStyle) return this.currentStyle[property.camelCase()];
		var computed = this.getDocument().defaultView.getComputedStyle(this, null);
		return (computed) ? computed.getPropertyValue([property.hyphenate()]) : null;
	},

	toQueryString: function(){
		var queryString = [];
		this.getElements('input, select, textarea', true).each(function(el){
			if (!el.name || el.disabled || el.type == 'submit' || el.type == 'reset' || el.type == 'file') return;
			var value = (el.tagName.toLowerCase() == 'select') ? Element.getSelected(el).map(function(opt){
				return opt.value;
			}) : ((el.type == 'radio' || el.type == 'checkbox') && !el.checked) ? null : el.value;
			$splat(value).each(function(val){
				if (typeof val != 'undefined') queryString.push(el.name + '=' + encodeURIComponent(val));
			});
		});
		return queryString.join('&');
	},

	clone: function(contents, keepid){
		contents = contents !== false;
		var clone = this.cloneNode(contents);
		var clean = function(node, element){
			if (!keepid) node.removeAttribute('id');
			if (Browser.Engine.trident){
				node.clearAttributes();
				node.mergeAttributes(element);
				node.removeAttribute('uid');
				if (node.options){
					var no = node.options, eo = element.options;
					for (var j = no.length; j--;) no[j].selected = eo[j].selected;
				}
			}
			var prop = props[element.tagName.toLowerCase()];
			if (prop && element[prop]) node[prop] = element[prop];
		};

		if (contents){
			var ce = clone.getElementsByTagName('*'), te = this.getElementsByTagName('*');
			for (var i = ce.length; i--;) clean(ce[i], te[i]);
		}

		clean(clone, this);
		return document.id(clone);
	},

	destroy: function(){
		Element.empty(this);
		Element.dispose(this);
		clean(this, true);
		return null;
	},

	empty: function(){
		$A(this.childNodes).each(function(node){
			Element.destroy(node);
		});
		return this;
	},

	dispose: function(){
		return (this.parentNode) ? this.parentNode.removeChild(this) : this;
	},

	hasChild: function(el){
		el = document.id(el, true);
		if (!el) return false;
		if (Browser.Engine.webkit && Browser.Engine.version < 420) return $A(this.getElementsByTagName(el.tagName)).contains(el);
		return (this.contains) ? (this != el && this.contains(el)) : !!(this.compareDocumentPosition(el) & 16);
	},

	match: function(tag){
		return (!tag || (tag == this) || (Element.get(this, 'tag') == tag));
	}

});

Native.implement([Element, Window, Document], {

	addListener: function(type, fn){
		if (type == 'unload'){
			var old = fn, self = this;
			fn = function(){
				self.removeListener('unload', fn);
				old();
			};
		} else {
			collected[this.uid] = this;
		}
		if (this.addEventListener) this.addEventListener(type, fn, false);
		else this.attachEvent('on' + type, fn);
		return this;
	},

	removeListener: function(type, fn){
		if (this.removeEventListener) this.removeEventListener(type, fn, false);
		else this.detachEvent('on' + type, fn);
		return this;
	},

	retrieve: function(property, dflt){
		var storage = get(this.uid), prop = storage[property];
		if (dflt != undefined && prop == undefined) prop = storage[property] = dflt;
		return $pick(prop);
	},

	store: function(property, value){
		var storage = get(this.uid);
		storage[property] = value;
		return this;
	},

	eliminate: function(property){
		var storage = get(this.uid);
		delete storage[property];
		return this;
	}

});

window.addListener('unload', purge);

})();

Element.Properties = new Hash;

Element.Properties.style = {

	set: function(style){
		this.style.cssText = style;
	},

	get: function(){
		return this.style.cssText;
	},

	erase: function(){
		this.style.cssText = '';
	}

};

Element.Properties.tag = {

	get: function(){
		return this.tagName.toLowerCase();
	}

};

Element.Properties.html = (function(){
	var wrapper = document.createElement('div');

	var translations = {
		table: [1, '<table>', '</table>'],
		select: [1, '<select>', '</select>'],
		tbody: [2, '<table><tbody>', '</tbody></table>'],
		tr: [3, '<table><tbody><tr>', '</tr></tbody></table>']
	};
	translations.thead = translations.tfoot = translations.tbody;

	var html = {
		set: function(){
			var html = Array.flatten(arguments).join('');
			var wrap = Browser.Engine.trident && translations[this.get('tag')];
			if (wrap){
				var first = wrapper;
				first.innerHTML = wrap[1] + html + wrap[2];
				for (var i = wrap[0]; i--;) first = first.firstChild;
				this.empty().adopt(first.childNodes);
			} else {
				this.innerHTML = html;
			}
		}
	};

	html.erase = html.set;

	return html;
})();

if (Browser.Engine.webkit && Browser.Engine.version < 420) Element.Properties.text = {
	get: function(){
		if (this.innerText) return this.innerText;
		var temp = this.ownerDocument.newElement('div', {html: this.innerHTML}).inject(this.ownerDocument.body);
		var text = temp.innerText;
		temp.destroy();
		return text;
	}
};


/*
---

name: Element.Style

description: Contains methods for interacting with the styles of Elements in a fashionable way.

license: MIT-style license.

requires: Element

provides: Element.Style

...
*/

Element.Properties.styles = {set: function(styles){
	this.setStyles(styles);
}};

Element.Properties.opacity = {

	set: function(opacity, novisibility){
		if (!novisibility){
			if (opacity == 0){
				if (this.style.visibility != 'hidden') this.style.visibility = 'hidden';
			} else {
				if (this.style.visibility != 'visible') this.style.visibility = 'visible';
			}
		}
		if (!this.currentStyle || !this.currentStyle.hasLayout) this.style.zoom = 1;
		if (Browser.Engine.trident) this.style.filter = (opacity == 1) ? '' : 'alpha(opacity=' + opacity * 100 + ')';
		this.style.opacity = opacity;
		this.store('opacity', opacity);
	},

	get: function(){
		return this.retrieve('opacity', 1);
	}

};

Element.implement({

	setOpacity: function(value){
		return this.set('opacity', value, true);
	},

	getOpacity: function(){
		return this.get('opacity');
	},

	setStyle: function(property, value){
		switch (property){
			case 'opacity': return this.set('opacity', parseFloat(value));
			case 'float': property = (Browser.Engine.trident) ? 'styleFloat' : 'cssFloat';
		}
		property = property.camelCase();
		if ($type(value) != 'string'){
			var map = (Element.Styles.get(property) || '@').split(' ');
			value = $splat(value).map(function(val, i){
				if (!map[i]) return '';
				return ($type(val) == 'number') ? map[i].replace('@', Math.round(val)) : val;
			}).join(' ');
		} else if (value == String(Number(value))){
			value = Math.round(value);
		}
		this.style[property] = value;
		return this;
	},

	getStyle: function(property){
		switch (property){
			case 'opacity': return this.get('opacity');
			case 'float': property = (Browser.Engine.trident) ? 'styleFloat' : 'cssFloat';
		}
		property = property.camelCase();
		var result = this.style[property];
		if (!$chk(result)){
			result = [];
			for (var style in Element.ShortStyles){
				if (property != style) continue;
				for (var s in Element.ShortStyles[style]) result.push(this.getStyle(s));
				return result.join(' ');
			}
			result = this.getComputedStyle(property);
		}
		if (result){
			result = String(result);
			var color = result.match(/rgba?\([\d\s,]+\)/);
			if (color) result = result.replace(color[0], color[0].rgbToHex());
		}
		if (Browser.Engine.presto || (Browser.Engine.trident && !$chk(parseInt(result, 10)))){
			if (property.test(/^(height|width)$/)){
				var values = (property == 'width') ? ['left', 'right'] : ['top', 'bottom'], size = 0;
				values.each(function(value){
					size += this.getStyle('border-' + value + '-width').toInt() + this.getStyle('padding-' + value).toInt();
				}, this);
				return this['offset' + property.capitalize()] - size + 'px';
			}
			if ((Browser.Engine.presto) && String(result).test('px')) return result;
			if (property.test(/(border(.+)Width|margin|padding)/)) return '0px';
		}
		return result;
	},

	setStyles: function(styles){
		for (var style in styles) this.setStyle(style, styles[style]);
		return this;
	},

	getStyles: function(){
		var result = {};
		Array.flatten(arguments).each(function(key){
			result[key] = this.getStyle(key);
		}, this);
		return result;
	}

});

Element.Styles = new Hash({
	left: '@px', top: '@px', bottom: '@px', right: '@px',
	width: '@px', height: '@px', maxWidth: '@px', maxHeight: '@px', minWidth: '@px', minHeight: '@px',
	backgroundColor: 'rgb(@, @, @)', backgroundPosition: '@px @px', color: 'rgb(@, @, @)',
	fontSize: '@px', letterSpacing: '@px', lineHeight: '@px', clip: 'rect(@px @px @px @px)',
	margin: '@px @px @px @px', padding: '@px @px @px @px', border: '@px @ rgb(@, @, @) @px @ rgb(@, @, @) @px @ rgb(@, @, @)',
	borderWidth: '@px @px @px @px', borderStyle: '@ @ @ @', borderColor: 'rgb(@, @, @) rgb(@, @, @) rgb(@, @, @) rgb(@, @, @)',
	zIndex: '@', 'zoom': '@', fontWeight: '@', textIndent: '@px', opacity: '@'
});

Element.ShortStyles = {margin: {}, padding: {}, border: {}, borderWidth: {}, borderStyle: {}, borderColor: {}};

['Top', 'Right', 'Bottom', 'Left'].each(function(direction){
	var Short = Element.ShortStyles;
	var All = Element.Styles;
	['margin', 'padding'].each(function(style){
		var sd = style + direction;
		Short[style][sd] = All[sd] = '@px';
	});
	var bd = 'border' + direction;
	Short.border[bd] = All[bd] = '@px @ rgb(@, @, @)';
	var bdw = bd + 'Width', bds = bd + 'Style', bdc = bd + 'Color';
	Short[bd] = {};
	Short.borderWidth[bdw] = Short[bd][bdw] = All[bdw] = '@px';
	Short.borderStyle[bds] = Short[bd][bds] = All[bds] = '@';
	Short.borderColor[bdc] = Short[bd][bdc] = All[bdc] = 'rgb(@, @, @)';
});


/*
---

name: Element.Event

description: Contains Element methods for dealing with events. This file also includes mouseenter and mouseleave custom Element Events.

license: MIT-style license.

requires: [Element, Event]

provides: Element.Event

...
*/

Element.Properties.events = {set: function(events){
	this.addEvents(events);
}};

Native.implement([Element, Window, Document], {

	addEvent: function(type, fn){
		var events = this.retrieve('events', {});
		events[type] = events[type] || {'keys': [], 'values': []};
		if (events[type].keys.contains(fn)) return this;
		events[type].keys.push(fn);
		var realType = type, custom = Element.Events.get(type), condition = fn, self = this;
		if (custom){
			if (custom.onAdd) custom.onAdd.call(this, fn);
			if (custom.condition){
				condition = function(event){
					if (custom.condition.call(this, event)) return fn.call(this, event);
					return true;
				};
			}
			realType = custom.base || realType;
		}
		var defn = function(){
			return fn.call(self);
		};
		var nativeEvent = Element.NativeEvents[realType];
		if (nativeEvent){
			if (nativeEvent == 2){
				defn = function(event){
					event = new Event(event, self.getWindow());
					if (condition.call(self, event) === false) event.stop();
				};
			}
			this.addListener(realType, defn);
		}
		events[type].values.push(defn);
		return this;
	},

	removeEvent: function(type, fn){
		var events = this.retrieve('events');
		if (!events || !events[type]) return this;
		var pos = events[type].keys.indexOf(fn);
		if (pos == -1) return this;
		events[type].keys.splice(pos, 1);
		var value = events[type].values.splice(pos, 1)[0];
		var custom = Element.Events.get(type);
		if (custom){
			if (custom.onRemove) custom.onRemove.call(this, fn);
			type = custom.base || type;
		}
		return (Element.NativeEvents[type]) ? this.removeListener(type, value) : this;
	},

	addEvents: function(events){
		for (var event in events) this.addEvent(event, events[event]);
		return this;
	},

	removeEvents: function(events){
		var type;
		if ($type(events) == 'object'){
			for (type in events) this.removeEvent(type, events[type]);
			return this;
		}
		var attached = this.retrieve('events');
		if (!attached) return this;
		if (!events){
			for (type in attached) this.removeEvents(type);
			this.eliminate('events');
		} else if (attached[events]){
			while (attached[events].keys[0]) this.removeEvent(events, attached[events].keys[0]);
			attached[events] = null;
		}
		return this;
	},

	fireEvent: function(type, args, delay){
		var events = this.retrieve('events');
		if (!events || !events[type]) return this;
		events[type].keys.each(function(fn){
			fn.create({'bind': this, 'delay': delay, 'arguments': args})();
		}, this);
		return this;
	},

	cloneEvents: function(from, type){
		from = document.id(from);
		var fevents = from.retrieve('events');
		if (!fevents) return this;
		if (!type){
			for (var evType in fevents) this.cloneEvents(from, evType);
		} else if (fevents[type]){
			fevents[type].keys.each(function(fn){
				this.addEvent(type, fn);
			}, this);
		}
		return this;
	}

});

Element.NativeEvents = {
	click: 2, dblclick: 2, mouseup: 2, mousedown: 2, contextmenu: 2, //mouse buttons
	mousewheel: 2, DOMMouseScroll: 2, //mouse wheel
	mouseover: 2, mouseout: 2, mousemove: 2, selectstart: 2, selectend: 2, //mouse movement
	keydown: 2, keypress: 2, keyup: 2, //keyboard
	focus: 2, blur: 2, change: 2, reset: 2, select: 2, submit: 2, //form elements
	load: 1, unload: 1, beforeunload: 2, resize: 1, move: 1, DOMContentLoaded: 1, readystatechange: 1, //window
	error: 1, abort: 1, scroll: 1 //misc
};

(function(){

var $check = function(event){
	var related = event.relatedTarget;
	if (related == undefined) return true;
	if (related === false) return false;
	return ($type(this) != 'document' && related != this && related.prefix != 'xul' && !this.hasChild(related));
};

Element.Events = new Hash({

	mouseenter: {
		base: 'mouseover',
		condition: $check
	},

	mouseleave: {
		base: 'mouseout',
		condition: $check
	},

	mousewheel: {
		base: (Browser.Engine.gecko) ? 'DOMMouseScroll' : 'mousewheel'
	}

});

})();


/*
---

name: Element.Dimensions

description: Contains methods to work with size, scroll, or positioning of Elements and the window object.

license: MIT-style license.

credits:
  - Element positioning based on the [qooxdoo](http://qooxdoo.org/) code and smart browser fixes, [LGPL License](http://www.gnu.org/licenses/lgpl.html).
  - Viewport dimensions based on [YUI](http://developer.yahoo.com/yui/) code, [BSD License](http://developer.yahoo.com/yui/license.html).

requires: Element

provides: Element.Dimensions

...
*/

(function(){

Element.implement({

	scrollTo: function(x, y){
		if (isBody(this)){
			this.getWindow().scrollTo(x, y);
		} else {
			this.scrollLeft = x;
			this.scrollTop = y;
		}
		return this;
	},

	getSize: function(){
		if (isBody(this)) return this.getWindow().getSize();
		return {x: this.offsetWidth, y: this.offsetHeight};
	},

	getScrollSize: function(){
		if (isBody(this)) return this.getWindow().getScrollSize();
		return {x: this.scrollWidth, y: this.scrollHeight};
	},

	getScroll: function(){
		if (isBody(this)) return this.getWindow().getScroll();
		return {x: this.scrollLeft, y: this.scrollTop};
	},

	getScrolls: function(){
		var element = this, position = {x: 0, y: 0};
		while (element && !isBody(element)){
			position.x += element.scrollLeft;
			position.y += element.scrollTop;
			element = element.parentNode;
		}
		return position;
	},

	getOffsetParent: function(){
		var element = this;
		if (isBody(element)) return null;
		if (!Browser.Engine.trident) return element.offsetParent;
		while ((element = element.parentNode) && !isBody(element)){
			if (styleString(element, 'position') != 'static') return element;
		}
		return null;
	},

	getOffsets: function(){
		if (this.getBoundingClientRect){
			var bound = this.getBoundingClientRect(),
				html = document.id(this.getDocument().documentElement),
				htmlScroll = html.getScroll(),
				elemScrolls = this.getScrolls(),
				elemScroll = this.getScroll(),
				isFixed = (styleString(this, 'position') == 'fixed');

			return {
				x: bound.left.toInt() + elemScrolls.x - elemScroll.x + ((isFixed) ? 0 : htmlScroll.x) - html.clientLeft,
				y: bound.top.toInt()  + elemScrolls.y - elemScroll.y + ((isFixed) ? 0 : htmlScroll.y) - html.clientTop
			};
		}

		var element = this, position = {x: 0, y: 0};
		if (isBody(this)) return position;

		while (element && !isBody(element)){
			position.x += element.offsetLeft;
			position.y += element.offsetTop;

			if (Browser.Engine.gecko){
				if (!borderBox(element)){
					position.x += leftBorder(element);
					position.y += topBorder(element);
				}
				var parent = element.parentNode;
				if (parent && styleString(parent, 'overflow') != 'visible'){
					position.x += leftBorder(parent);
					position.y += topBorder(parent);
				}
			} else if (element != this && Browser.Engine.webkit){
				position.x += leftBorder(element);
				position.y += topBorder(element);
			}

			element = element.offsetParent;
		}
		if (Browser.Engine.gecko && !borderBox(this)){
			position.x -= leftBorder(this);
			position.y -= topBorder(this);
		}
		return position;
	},

	getPosition: function(relative){
		if (isBody(this)) return {x: 0, y: 0};
		var offset = this.getOffsets(),
				scroll = this.getScrolls();
		var position = {
			x: offset.x - scroll.x,
			y: offset.y - scroll.y
		};
		var relativePosition = (relative && (relative = document.id(relative))) ? relative.getPosition() : {x: 0, y: 0};
		return {x: position.x - relativePosition.x, y: position.y - relativePosition.y};
	},

	getCoordinates: function(element){
		if (isBody(this)) return this.getWindow().getCoordinates();
		var position = this.getPosition(element),
				size = this.getSize();
		var obj = {
			left: position.x,
			top: position.y,
			width: size.x,
			height: size.y
		};
		obj.right = obj.left + obj.width;
		obj.bottom = obj.top + obj.height;
		return obj;
	},

	computePosition: function(obj){
		return {
			left: obj.x - styleNumber(this, 'margin-left'),
			top: obj.y - styleNumber(this, 'margin-top')
		};
	},

	setPosition: function(obj){
		return this.setStyles(this.computePosition(obj));
	}

});


Native.implement([Document, Window], {

	getSize: function(){
		if (Browser.Engine.presto || Browser.Engine.webkit){
			var win = this.getWindow();
			return {x: win.innerWidth, y: win.innerHeight};
		}
		var doc = getCompatElement(this);
		return {x: doc.clientWidth, y: doc.clientHeight};
	},

	getScroll: function(){
		var win = this.getWindow(), doc = getCompatElement(this);
		return {x: win.pageXOffset || doc.scrollLeft, y: win.pageYOffset || doc.scrollTop};
	},

	getScrollSize: function(){
		var doc = getCompatElement(this), min = this.getSize();
		return {x: Math.max(doc.scrollWidth, min.x), y: Math.max(doc.scrollHeight, min.y)};
	},

	getPosition: function(){
		return {x: 0, y: 0};
	},

	getCoordinates: function(){
		var size = this.getSize();
		return {top: 0, left: 0, bottom: size.y, right: size.x, height: size.y, width: size.x};
	}

});

// private methods

var styleString = Element.getComputedStyle;

function styleNumber(element, style){
	return styleString(element, style).toInt() || 0;
};

function borderBox(element){
	return styleString(element, '-moz-box-sizing') == 'border-box';
};

function topBorder(element){
	return styleNumber(element, 'border-top-width');
};

function leftBorder(element){
	return styleNumber(element, 'border-left-width');
};

function isBody(element){
	return (/^(?:body|html)$/i).test(element.tagName);
};

function getCompatElement(element){
	var doc = element.getDocument();
	return (!doc.compatMode || doc.compatMode == 'CSS1Compat') ? doc.html : doc.body;
};

})();

//aliases
Element.alias('setPosition', 'position'); //compatability

Native.implement([Window, Document, Element], {

	getHeight: function(){
		return this.getSize().y;
	},

	getWidth: function(){
		return this.getSize().x;
	},

	getScrollTop: function(){
		return this.getScroll().y;
	},

	getScrollLeft: function(){
		return this.getScroll().x;
	},

	getScrollHeight: function(){
		return this.getScrollSize().y;
	},

	getScrollWidth: function(){
		return this.getScrollSize().x;
	},

	getTop: function(){
		return this.getPosition().y;
	},

	getLeft: function(){
		return this.getPosition().x;
	}

});


/*
---

name: Fx

description: Contains the basic animation logic to be extended by all other Fx Classes.

license: MIT-style license.

requires: [Chain, Events, Options]

provides: Fx

...
*/

var Fx = new Class({

	Implements: [Chain, Events, Options],

	options: {
		/*
		onStart: $empty,
		onCancel: $empty,
		onComplete: $empty,
		*/
		fps: 50,
		unit: false,
		duration: 500,
		link: 'ignore'
	},

	initialize: function(options){
		this.subject = this.subject || this;
		this.setOptions(options);
		this.options.duration = Fx.Durations[this.options.duration] || this.options.duration.toInt();
		var wait = this.options.wait;
		if (wait === false) this.options.link = 'cancel';
	},

	getTransition: function(){
		return function(p){
			return -(Math.cos(Math.PI * p) - 1) / 2;
		};
	},

	step: function(){
		var time = $time();
		if (time < this.time + this.options.duration){
			var delta = this.transition((time - this.time) / this.options.duration);
			this.set(this.compute(this.from, this.to, delta));
		} else {
			this.set(this.compute(this.from, this.to, 1));
			this.complete();
		}
	},

	set: function(now){
		return now;
	},

	compute: function(from, to, delta){
		return Fx.compute(from, to, delta);
	},

	check: function(){
		if (!this.timer) return true;
		switch (this.options.link){
			case 'cancel': this.cancel(); return true;
			case 'chain': this.chain(this.caller.bind(this, arguments)); return false;
		}
		return false;
	},

	start: function(from, to){
		if (!this.check(from, to)) return this;
		this.from = from;
		this.to = to;
		this.time = 0;
		this.transition = this.getTransition();
		this.startTimer();
		this.onStart();
		return this;
	},

	complete: function(){
		if (this.stopTimer()) this.onComplete();
		return this;
	},

	cancel: function(){
		if (this.stopTimer()) this.onCancel();
		return this;
	},

	onStart: function(){
		this.fireEvent('start', this.subject);
	},

	onComplete: function(){
		this.fireEvent('complete', this.subject);
		if (!this.callChain()) this.fireEvent('chainComplete', this.subject);
	},

	onCancel: function(){
		this.fireEvent('cancel', this.subject).clearChain();
	},

	pause: function(){
		this.stopTimer();
		return this;
	},

	resume: function(){
		this.startTimer();
		return this;
	},

	stopTimer: function(){
		if (!this.timer) return false;
		this.time = $time() - this.time;
		this.timer = $clear(this.timer);
		return true;
	},

	startTimer: function(){
		if (this.timer) return false;
		this.time = $time() - this.time;
		this.timer = this.step.periodical(Math.round(1000 / this.options.fps), this);
		return true;
	}

});

Fx.compute = function(from, to, delta){
	return (to - from) * delta + from;
};

Fx.Durations = {'short': 250, 'normal': 500, 'long': 1000};


/*
---

name: Fx.CSS

description: Contains the CSS animation logic. Used by Fx.Tween, Fx.Morph, Fx.Elements.

license: MIT-style license.

requires: [Fx, Element.Style]

provides: Fx.CSS

...
*/

Fx.CSS = new Class({

	Extends: Fx,

	//prepares the base from/to object

	prepare: function(element, property, values){
		values = $splat(values);
		var values1 = values[1];
		if (!$chk(values1)){
			values[1] = values[0];
			values[0] = element.getStyle(property);
		}
		var parsed = values.map(this.parse);
		return {from: parsed[0], to: parsed[1]};
	},

	//parses a value into an array

	parse: function(value){
		value = $lambda(value)();
		value = (typeof value == 'string') ? value.split(' ') : $splat(value);
		return value.map(function(val){
			val = String(val);
			var found = false;
			Fx.CSS.Parsers.each(function(parser, key){
				if (found) return;
				var parsed = parser.parse(val);
				if ($chk(parsed)) found = {value: parsed, parser: parser};
			});
			found = found || {value: val, parser: Fx.CSS.Parsers.String};
			return found;
		});
	},

	//computes by a from and to prepared objects, using their parsers.

	compute: function(from, to, delta){
		var computed = [];
		(Math.min(from.length, to.length)).times(function(i){
			computed.push({value: from[i].parser.compute(from[i].value, to[i].value, delta), parser: from[i].parser});
		});
		computed.$family = {name: 'fx:css:value'};
		return computed;
	},

	//serves the value as settable

	serve: function(value, unit){
		if ($type(value) != 'fx:css:value') value = this.parse(value);
		var returned = [];
		value.each(function(bit){
			returned = returned.concat(bit.parser.serve(bit.value, unit));
		});
		return returned;
	},

	//renders the change to an element

	render: function(element, property, value, unit){
		element.setStyle(property, this.serve(value, unit));
	},

	//searches inside the page css to find the values for a selector

	search: function(selector){
		if (Fx.CSS.Cache[selector]) return Fx.CSS.Cache[selector];
		var to = {};
		Array.each(document.styleSheets, function(sheet, j){
			var href = sheet.href;
			if (href && href.contains('://') && !href.contains(document.domain)) return;
			var rules = sheet.rules || sheet.cssRules;
			Array.each(rules, function(rule, i){
				if (!rule.style) return;
				var selectorText = (rule.selectorText) ? rule.selectorText.replace(/^\w+/, function(m){
					return m.toLowerCase();
				}) : null;
				if (!selectorText || !selectorText.test('^' + selector + '$')) return;
				Element.Styles.each(function(value, style){
					if (!rule.style[style] || Element.ShortStyles[style]) return;
					value = String(rule.style[style]);
					to[style] = (value.test(/^rgb/)) ? value.rgbToHex() : value;
				});
			});
		});
		return Fx.CSS.Cache[selector] = to;
	}

});

Fx.CSS.Cache = {};

Fx.CSS.Parsers = new Hash({

	Color: {
		parse: function(value){
			if (value.match(/^#[0-9a-f]{3,6}$/i)) return value.hexToRgb(true);
			return ((value = value.match(/(\d+),\s*(\d+),\s*(\d+)/))) ? [value[1], value[2], value[3]] : false;
		},
		compute: function(from, to, delta){
			return from.map(function(value, i){
				return Math.round(Fx.compute(from[i], to[i], delta));
			});
		},
		serve: function(value){
			return value.map(Number);
		}
	},

	Number: {
		parse: parseFloat,
		compute: Fx.compute,
		serve: function(value, unit){
			return (unit) ? value + unit : value;
		}
	},

	String: {
		parse: $lambda(false),
		compute: $arguments(1),
		serve: $arguments(0)
	}

});


/*
---

name: Fx.Morph

description: Formerly Fx.Styles, effect to transition any number of CSS properties for an element using an object of rules, or CSS based selector rules.

license: MIT-style license.

requires: Fx.CSS

provides: Fx.Morph

...
*/

Fx.Morph = new Class({

	Extends: Fx.CSS,

	initialize: function(element, options){
		this.element = this.subject = document.id(element);
		this.parent(options);
	},

	set: function(now){
		if (typeof now == 'string') now = this.search(now);
		for (var p in now) this.render(this.element, p, now[p], this.options.unit);
		return this;
	},

	compute: function(from, to, delta){
		var now = {};
		for (var p in from) now[p] = this.parent(from[p], to[p], delta);
		return now;
	},

	start: function(properties){
		if (!this.check(properties)) return this;
		if (typeof properties == 'string') properties = this.search(properties);
		var from = {}, to = {};
		for (var p in properties){
			var parsed = this.prepare(this.element, p, properties[p]);
			from[p] = parsed.from;
			to[p] = parsed.to;
		}
		return this.parent(from, to);
	}

});

Element.Properties.morph = {

	set: function(options){
		var morph = this.retrieve('morph');
		if (morph) morph.cancel();
		return this.eliminate('morph').store('morph:options', $extend({link: 'cancel'}, options));
	},

	get: function(options){
		if (options || !this.retrieve('morph')){
			if (options || !this.retrieve('morph:options')) this.set('morph', options);
			this.store('morph', new Fx.Morph(this, this.retrieve('morph:options')));
		}
		return this.retrieve('morph');
	}

};

Element.implement({

	morph: function(props){
		this.get('morph').start(props);
		return this;
	}

});


/*
---

name: Fx.Tween

description: Formerly Fx.Style, effect to transition any CSS property for an element.

license: MIT-style license.

requires: Fx.CSS

provides: [Fx.Tween, Element.fade, Element.highlight]

...
*/

Fx.Tween = new Class({

	Extends: Fx.CSS,

	initialize: function(element, options){
		this.element = this.subject = document.id(element);
		this.parent(options);
	},

	set: function(property, now){
		if (arguments.length == 1){
			now = property;
			property = this.property || this.options.property;
		}
		this.render(this.element, property, now, this.options.unit);
		return this;
	},

	start: function(property, from, to){
		if (!this.check(property, from, to)) return this;
		var args = Array.flatten(arguments);
		this.property = this.options.property || args.shift();
		var parsed = this.prepare(this.element, this.property, args);
		return this.parent(parsed.from, parsed.to);
	}

});

Element.Properties.tween = {

	set: function(options){
		var tween = this.retrieve('tween');
		if (tween) tween.cancel();
		return this.eliminate('tween').store('tween:options', $extend({link: 'cancel'}, options));
	},

	get: function(options){
		if (options || !this.retrieve('tween')){
			if (options || !this.retrieve('tween:options')) this.set('tween', options);
			this.store('tween', new Fx.Tween(this, this.retrieve('tween:options')));
		}
		return this.retrieve('tween');
	}

};

Element.implement({

	tween: function(property, from, to){
		this.get('tween').start(arguments);
		return this;
	},

	fade: function(how){
		var fade = this.get('tween'), o = 'opacity', toggle;
		how = $pick(how, 'toggle');
		switch (how){
			case 'in': fade.start(o, 1); break;
			case 'out': fade.start(o, 0); break;
			case 'show': fade.set(o, 1); break;
			case 'hide': fade.set(o, 0); break;
			case 'toggle':
				var flag = this.retrieve('fade:flag', this.get('opacity') == 1);
				fade.start(o, (flag) ? 0 : 1);
				this.store('fade:flag', !flag);
				toggle = true;
			break;
			default: fade.start(o, arguments);
		}
		if (!toggle) this.eliminate('fade:flag');
		return this;
	},

	highlight: function(start, end){
		if (!end){
			end = this.retrieve('highlight:original', this.getStyle('background-color'));
			end = (end == 'transparent') ? '#fff' : end;
		}
		var tween = this.get('tween');
		tween.start('background-color', start || '#ffff88', end).chain(function(){
			this.setStyle('background-color', this.retrieve('highlight:original'));
			tween.callChain();
		}.bind(this));
		return this;
	}

});


/*
---

name: Fx.Transitions

description: Contains a set of advanced transitions to be used with any of the Fx Classes.

license: MIT-style license.

credits: Easing Equations by Robert Penner, <http://www.robertpenner.com/easing/>, modified and optimized to be used with MooTools.

requires: Fx

provides: Fx.Transitions

...
*/

Fx.implement({

	getTransition: function(){
		var trans = this.options.transition || Fx.Transitions.Sine.easeInOut;
		if (typeof trans == 'string'){
			var data = trans.split(':');
			trans = Fx.Transitions;
			trans = trans[data[0]] || trans[data[0].capitalize()];
			if (data[1]) trans = trans['ease' + data[1].capitalize() + (data[2] ? data[2].capitalize() : '')];
		}
		return trans;
	}

});

Fx.Transition = function(transition, params){
	params = $splat(params);
	return $extend(transition, {
		easeIn: function(pos){
			return transition(pos, params);
		},
		easeOut: function(pos){
			return 1 - transition(1 - pos, params);
		},
		easeInOut: function(pos){
			return (pos <= 0.5) ? transition(2 * pos, params) / 2 : (2 - transition(2 * (1 - pos), params)) / 2;
		}
	});
};

Fx.Transitions = new Hash({

	linear: $arguments(0)

});

Fx.Transitions.extend = function(transitions){
	for (var transition in transitions) Fx.Transitions[transition] = new Fx.Transition(transitions[transition]);
};

Fx.Transitions.extend({

	Pow: function(p, x){
		return Math.pow(p, x[0] || 6);
	},

	Expo: function(p){
		return Math.pow(2, 8 * (p - 1));
	},

	Circ: function(p){
		return 1 - Math.sin(Math.acos(p));
	},

	Sine: function(p){
		return 1 - Math.sin((1 - p) * Math.PI / 2);
	},

	Back: function(p, x){
		x = x[0] || 1.618;
		return Math.pow(p, 2) * ((x + 1) * p - x);
	},

	Bounce: function(p){
		var value;
		for (var a = 0, b = 1; 1; a += b, b /= 2){
			if (p >= (7 - 4 * a) / 11){
				value = b * b - Math.pow((11 - 6 * a - 11 * p) / 4, 2);
				break;
			}
		}
		return value;
	},

	Elastic: function(p, x){
		return Math.pow(2, 10 * --p) * Math.cos(20 * p * Math.PI * (x[0] || 1) / 3);
	}

});

['Quad', 'Cubic', 'Quart', 'Quint'].each(function(transition, i){
	Fx.Transitions[transition] = new Fx.Transition(function(p){
		return Math.pow(p, [i + 2]);
	});
});


/*
---

name: Request

description: Powerful all purpose Request Class. Uses XMLHTTPRequest.

license: MIT-style license.

requires: [Element, Chain, Events, Options, Browser]

provides: Request

...
*/

var Request = new Class({

	Implements: [Chain, Events, Options],

	options: {/*
		onRequest: $empty,
		onComplete: $empty,
		onCancel: $empty,
		onSuccess: $empty,
		onFailure: $empty,
		onException: $empty,*/
		url: '',
		data: '',
		headers: {
			'X-Requested-With': 'XMLHttpRequest',
			'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
		},
		async: true,
		format: false,
		method: 'post',
		link: 'ignore',
		isSuccess: null,
		emulation: true,
		urlEncoded: true,
		encoding: 'utf-8',
		evalScripts: false,
		evalResponse: false,
		noCache: false
	},

	initialize: function(options){
		this.xhr = new Browser.Request();
		this.setOptions(options);
		this.options.isSuccess = this.options.isSuccess || this.isSuccess;
		this.headers = new Hash(this.options.headers);
	},

	onStateChange: function(){
		if (this.xhr.readyState != 4 || !this.running) return;
		this.running = false;
		this.status = 0;
		$try(function(){
			this.status = this.xhr.status;
		}.bind(this));
		this.xhr.onreadystatechange = $empty;
		if (this.options.isSuccess.call(this, this.status)){
			this.response = {text: this.xhr.responseText, xml: this.xhr.responseXML};
			this.success(this.response.text, this.response.xml);
		} else {
			this.response = {text: null, xml: null};
			this.failure();
		}
	},

	isSuccess: function(){
		return ((this.status >= 200) && (this.status < 300));
	},

	processScripts: function(text){
		if (this.options.evalResponse || (/(ecma|java)script/).test(this.getHeader('Content-type'))) return $exec(text);
		return text.stripScripts(this.options.evalScripts);
	},

	success: function(text, xml){
		this.onSuccess(this.processScripts(text), xml);
	},

	onSuccess: function(){
		this.fireEvent('complete', arguments).fireEvent('success', arguments).callChain();
	},

	failure: function(){
		this.onFailure();
	},

	onFailure: function(){
		this.fireEvent('complete').fireEvent('failure', this.xhr);
	},

	setHeader: function(name, value){
		this.headers.set(name, value);
		return this;
	},

	getHeader: function(name){
		return $try(function(){
			return this.xhr.getResponseHeader(name);
		}.bind(this));
	},

	check: function(){
		if (!this.running) return true;
		switch (this.options.link){
			case 'cancel': this.cancel(); return true;
			case 'chain': this.chain(this.caller.bind(this, arguments)); return false;
		}
		return false;
	},

	send: function(options){
		if (!this.check(options)) return this;
		this.running = true;

		var type = $type(options);
		if (type == 'string' || type == 'element') options = {data: options};

		var old = this.options;
		options = $extend({data: old.data, url: old.url, method: old.method}, options);
		var data = options.data, url = String(options.url), method = options.method.toLowerCase();

		switch ($type(data)){
			case 'element': data = document.id(data).toQueryString(); break;
			case 'object': case 'hash': data = Hash.toQueryString(data);
		}

		if (this.options.format){
			var format = 'format=' + this.options.format;
			data = (data) ? format + '&' + data : format;
		}

		if (this.options.emulation && !['get', 'post'].contains(method)){
			var _method = '_method=' + method;
			data = (data) ? _method + '&' + data : _method;
			method = 'post';
		}

		if (this.options.urlEncoded && method == 'post'){
			var encoding = (this.options.encoding) ? '; charset=' + this.options.encoding : '';
			this.headers.set('Content-type', 'application/x-www-form-urlencoded' + encoding);
		}

		if (this.options.noCache){
			var noCache = 'noCache=' + new Date().getTime();
			data = (data) ? noCache + '&' + data : noCache;
		}

		var trimPosition = url.lastIndexOf('/');
		if (trimPosition > -1 && (trimPosition = url.indexOf('#')) > -1) url = url.substr(0, trimPosition);

		if (data && method == 'get'){
			url = url + (url.contains('?') ? '&' : '?') + data;
			data = null;
		}

		this.xhr.open(method.toUpperCase(), url, this.options.async);

		this.xhr.onreadystatechange = this.onStateChange.bind(this);

		this.headers.each(function(value, key){
			try {
				this.xhr.setRequestHeader(key, value);
			} catch (e){
				this.fireEvent('exception', [key, value]);
			}
		}, this);

		this.fireEvent('request');
		this.xhr.send(data);
		if (!this.options.async) this.onStateChange();
		return this;
	},

	cancel: function(){
		if (!this.running) return this;
		this.running = false;
		this.xhr.abort();
		this.xhr.onreadystatechange = $empty;
		this.xhr = new Browser.Request();
		this.fireEvent('cancel');
		return this;
	}

});

(function(){

var methods = {};
['get', 'post', 'put', 'delete', 'GET', 'POST', 'PUT', 'DELETE'].each(function(method){
	methods[method] = function(){
		var params = Array.link(arguments, {url: String.type, data: $defined});
		return this.send($extend(params, {method: method}));
	};
});

Request.implement(methods);

})();

Element.Properties.send = {

	set: function(options){
		var send = this.retrieve('send');
		if (send) send.cancel();
		return this.eliminate('send').store('send:options', $extend({
			data: this, link: 'cancel', method: this.get('method') || 'post', url: this.get('action')
		}, options));
	},

	get: function(options){
		if (options || !this.retrieve('send')){
			if (options || !this.retrieve('send:options')) this.set('send', options);
			this.store('send', new Request(this.retrieve('send:options')));
		}
		return this.retrieve('send');
	}

};

Element.implement({

	send: function(url){
		var sender = this.get('send');
		sender.send({data: this, url: url || sender.options.url});
		return this;
	}

});


/*
---

name: Request.HTML

description: Extends the basic Request Class with additional methods for interacting with HTML responses.

license: MIT-style license.

requires: [Request, Element]

provides: Request.HTML

...
*/

Request.HTML = new Class({

	Extends: Request,

	options: {
		update: false,
		append: false,
		evalScripts: true,
		filter: false
	},

	processHTML: function(text){
		var match = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
		text = (match) ? match[1] : text;

		var container = new Element('div');

		return $try(function(){
			var root = '<root>' + text + '</root>', doc;
			if (Browser.Engine.trident){
				doc = new ActiveXObject('Microsoft.XMLDOM');
				doc.async = false;
				doc.loadXML(root);
			} else {
				doc = new DOMParser().parseFromString(root, 'text/xml');
			}
			root = doc.getElementsByTagName('root')[0];
			if (!root) return null;
			for (var i = 0, k = root.childNodes.length; i < k; i++){
				var child = Element.clone(root.childNodes[i], true, true);
				if (child) container.grab(child);
			}
			return container;
		}) || container.set('html', text);
	},

	success: function(text){
		var options = this.options, response = this.response;

		response.html = text.stripScripts(function(script){
			response.javascript = script;
		});

		var temp = this.processHTML(response.html);

		response.tree = temp.childNodes;
		response.elements = temp.getElements('*');

		if (options.filter) response.tree = response.elements.filter(options.filter);
		if (options.update) document.id(options.update).empty().set('html', response.html);
		else if (options.append) document.id(options.append).adopt(temp.getChildren());
		if (options.evalScripts) $exec(response.javascript);

		this.onSuccess(response.tree, response.elements, response.html, response.javascript);
	}

});

Element.Properties.load = {

	set: function(options){
		var load = this.retrieve('load');
		if (load) load.cancel();
		return this.eliminate('load').store('load:options', $extend({data: this, link: 'cancel', update: this, method: 'get'}, options));
	},

	get: function(options){
		if (options || ! this.retrieve('load')){
			if (options || !this.retrieve('load:options')) this.set('load', options);
			this.store('load', new Request.HTML(this.retrieve('load:options')));
		}
		return this.retrieve('load');
	}

};

Element.implement({

	load: function(){
		this.get('load').send(Array.link(arguments, {data: Object.type, url: String.type}));
		return this;
	}

});


/*
---

name: JSON

description: JSON encoder and decoder.

license: MIT-style license.

see: <http://www.json.org/>

requires: [Array, String, Number, Function, Hash]

provides: JSON

...
*/

var JSON = new Hash(this.JSON && {
	stringify: JSON.stringify,
	parse: JSON.parse
}).extend({
	
	$specialChars: {'\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f', '\r': '\\r', '"' : '\\"', '\\': '\\\\'},

	$replaceChars: function(chr){
		return JSON.$specialChars[chr] || '\\u00' + Math.floor(chr.charCodeAt() / 16).toString(16) + (chr.charCodeAt() % 16).toString(16);
	},

	encode: function(obj){
		switch ($type(obj)){
			case 'string':
				return '"' + obj.replace(/[\x00-\x1f\\"]/g, JSON.$replaceChars) + '"';
			case 'array':
				return '[' + String(obj.map(JSON.encode).clean()) + ']';
			case 'object': case 'hash':
				var string = [];
				Hash.each(obj, function(value, key){
					var json = JSON.encode(value);
					if (json) string.push(JSON.encode(key) + ':' + json);
				});
				return '{' + string + '}';
			case 'number': case 'boolean': return String(obj);
			case false: return 'null';
		}
		return null;
	},

	decode: function(string, secure){
		if ($type(string) != 'string' || !string.length) return null;
		if (secure && !(/^[,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]*$/).test(string.replace(/\\./g, '@').replace(/"[^"\\\n\r]*"/g, ''))) return null;
		return eval('(' + string + ')');
	}

});

Native.implement([Hash, Array, String, Number], {

	toJSON: function(){
		return JSON.encode(this);
	}

});


/*
---

name: Request.JSON

description: Extends the basic Request Class with additional methods for sending and receiving JSON data.

license: MIT-style license.

requires: [Request, JSON]

provides: Request.HTML

...
*/

Request.JSON = new Class({

	Extends: Request,

	options: {
		secure: true
	},

	initialize: function(options){
		this.parent(options);
		this.headers.extend({'Accept': 'application/json', 'X-Request': 'JSON'});
	},

	success: function(text){
		this.response.json = JSON.decode(text, this.options.secure);
		this.onSuccess(this.response.json, text);
	}

});


/*
---

name: Cookie

description: Class for creating, reading, and deleting browser Cookies.

license: MIT-style license.

credits: Based on the functions by Peter-Paul Koch (http://quirksmode.org).

requires: Options

provides: Cookie

...
*/

var Cookie = new Class({

	Implements: Options,

	options: {
		path: false,
		domain: false,
		duration: false,
		secure: false,
		document: document
	},

	initialize: function(key, options){
		this.key = key;
		this.setOptions(options);
	},

	write: function(value){
		value = encodeURIComponent(value);
		if (this.options.domain) value += '; domain=' + this.options.domain;
		if (this.options.path) value += '; path=' + this.options.path;
		if (this.options.duration){
			var date = new Date();
			date.setTime(date.getTime() + this.options.duration * 24 * 60 * 60 * 1000);
			value += '; expires=' + date.toGMTString();
		}
		if (this.options.secure) value += '; secure';
		this.options.document.cookie = this.key + '=' + value;
		return this;
	},

	read: function(){
		var value = this.options.document.cookie.match('(?:^|;)\\s*' + this.key.escapeRegExp() + '=([^;]*)');
		return (value) ? decodeURIComponent(value[1]) : null;
	},

	dispose: function(){
		new Cookie(this.key, $merge(this.options, {duration: -1})).write('');
		return this;
	}

});

Cookie.write = function(key, value, options){
	return new Cookie(key, options).write(value);
};

Cookie.read = function(key){
	return new Cookie(key).read();
};

Cookie.dispose = function(key, options){
	return new Cookie(key, options).dispose();
};


/*
---

name: DomReady

description: Contains the custom event domready.

license: MIT-style license.

requires: Element.Event

provides: DomReady

...
*/

Element.Events.domready = {

	onAdd: function(fn){
		if (Browser.loaded) fn.call(this);
	}

};

(function(){

	var domready = function(){
		if (Browser.loaded) return;
		Browser.loaded = true;
		window.fireEvent('domready');
		document.fireEvent('domready');
	};
	
	window.addEvent('load', domready);

	if (Browser.Engine.trident){
		var temp = document.createElement('div');
		(function(){
			($try(function(){
				temp.doScroll(); // Technique by Diego Perini
				return document.id(temp).inject(document.body).set('html', 'temp').dispose();
			})) ? domready() : arguments.callee.delay(50);
		})();
	} else if (Browser.Engine.webkit && Browser.Engine.version < 525){
		(function(){
			(['loaded', 'complete'].contains(document.readyState)) ? domready() : arguments.callee.delay(50);
		})();
	} else {
		document.addEvent('DOMContentLoaded', domready);
	}

})();


/*
---

name: Swiff

description: Wrapper for embedding SWF movies. Supports External Interface Communication.

license: MIT-style license.

credits: Flash detection & Internet Explorer + Flash Player 9 fix inspired by SWFObject.

requires: [Options, $util]

provides: Swiff

...
*/

var Swiff = new Class({

	Implements: [Options],

	options: {
		id: null,
		height: 1,
		width: 1,
		container: null,
		properties: {},
		params: {
			quality: 'high',
			allowScriptAccess: 'always',
			wMode: 'transparent',
			swLiveConnect: true
		},
		callBacks: {},
		vars: {}
	},

	toElement: function(){
		return this.object;
	},

	initialize: function(path, options){
		this.instance = 'Swiff_' + $time();

		this.setOptions(options);
		options = this.options;
		var id = this.id = options.id || this.instance;
		var container = document.id(options.container);

		Swiff.CallBacks[this.instance] = {};

		var params = options.params, vars = options.vars, callBacks = options.callBacks;
		var properties = $extend({height: options.height, width: options.width}, options.properties);

		var self = this;

		for (var callBack in callBacks){
			Swiff.CallBacks[this.instance][callBack] = (function(option){
				return function(){
					return option.apply(self.object, arguments);
				};
			})(callBacks[callBack]);
			vars[callBack] = 'Swiff.CallBacks.' + this.instance + '.' + callBack;
		}

		params.flashVars = Hash.toQueryString(vars);
		if (Browser.Engine.trident){
			properties.classid = 'clsid:D27CDB6E-AE6D-11cf-96B8-444553540000';
			params.movie = path;
		} else {
			properties.type = 'application/x-shockwave-flash';
			properties.data = path;
		}
		var build = '<object id="' + id + '"';
		for (var property in properties) build += ' ' + property + '="' + properties[property] + '"';
		build += '>';
		for (var param in params){
			if (params[param]) build += '<param name="' + param + '" value="' + params[param] + '" />';
		}
		build += '</object>';
		this.object = ((container) ? container.empty() : new Element('div')).set('html', build).firstChild;
	},

	replaces: function(element){
		element = document.id(element, true);
		element.parentNode.replaceChild(this.toElement(), element);
		return this;
	},

	inject: function(element){
		document.id(element, true).appendChild(this.toElement());
		return this;
	},

	remote: function(){
		return Swiff.remote.apply(Swiff, [this.toElement()].extend(arguments));
	}

});

Swiff.CallBacks = {};

Swiff.remote = function(obj, fn){
	var rs = obj.CallFunction('<invoke name="' + fn + '" returntype="javascript">' + __flash__argumentsToXML(arguments, 2) + '</invoke>');
	return eval(rs);
};


/*
---

name: Selectors

description: Adds advanced CSS-style querying capabilities for targeting HTML Elements. Includes pseudo selectors.

license: MIT-style license.

requires: Element

provides: Selectors

...
*/

Native.implement([Document, Element], {

	getElements: function(expression, nocash){
		expression = expression.split(',');
		var items, local = {};
		for (var i = 0, l = expression.length; i < l; i++){
			var selector = expression[i], elements = Selectors.Utils.search(this, selector, local);
			if (i != 0 && elements.item) elements = $A(elements);
			items = (i == 0) ? elements : (items.item) ? $A(items).concat(elements) : items.concat(elements);
		}
		return new Elements(items, {ddup: (expression.length > 1), cash: !nocash});
	}

});

Element.implement({

	match: function(selector){
		if (!selector || (selector == this)) return true;
		var tagid = Selectors.Utils.parseTagAndID(selector);
		var tag = tagid[0], id = tagid[1];
		if (!Selectors.Filters.byID(this, id) || !Selectors.Filters.byTag(this, tag)) return false;
		var parsed = Selectors.Utils.parseSelector(selector);
		return (parsed) ? Selectors.Utils.filter(this, parsed, {}) : true;
	}

});

var Selectors = {Cache: {nth: {}, parsed: {}}};

Selectors.RegExps = {
	id: (/#([\w-]+)/),
	tag: (/^(\w+|\*)/),
	quick: (/^(\w+|\*)$/),
	splitter: (/\s*([+>~\s])\s*([a-zA-Z#.*:\[])/g),
	combined: (/\.([\w-]+)|\[(\w+)(?:([!*^$~|]?=)(["']?)([^\4]*?)\4)?\]|:([\w-]+)(?:\(["']?(.*?)?["']?\)|$)/g)
};

Selectors.Utils = {

	chk: function(item, uniques){
		if (!uniques) return true;
		var uid = $uid(item);
		if (!uniques[uid]) return uniques[uid] = true;
		return false;
	},

	parseNthArgument: function(argument){
		if (Selectors.Cache.nth[argument]) return Selectors.Cache.nth[argument];
		var parsed = argument.match(/^([+-]?\d*)?([a-z]+)?([+-]?\d*)?$/);
		if (!parsed) return false;
		var inta = parseInt(parsed[1], 10);
		var a = (inta || inta === 0) ? inta : 1;
		var special = parsed[2] || false;
		var b = parseInt(parsed[3], 10) || 0;
		if (a != 0){
			b--;
			while (b < 1) b += a;
			while (b >= a) b -= a;
		} else {
			a = b;
			special = 'index';
		}
		switch (special){
			case 'n': parsed = {a: a, b: b, special: 'n'}; break;
			case 'odd': parsed = {a: 2, b: 0, special: 'n'}; break;
			case 'even': parsed = {a: 2, b: 1, special: 'n'}; break;
			case 'first': parsed = {a: 0, special: 'index'}; break;
			case 'last': parsed = {special: 'last-child'}; break;
			case 'only': parsed = {special: 'only-child'}; break;
			default: parsed = {a: (a - 1), special: 'index'};
		}

		return Selectors.Cache.nth[argument] = parsed;
	},

	parseSelector: function(selector){
		if (Selectors.Cache.parsed[selector]) return Selectors.Cache.parsed[selector];
		var m, parsed = {classes: [], pseudos: [], attributes: []};
		while ((m = Selectors.RegExps.combined.exec(selector))){
			var cn = m[1], an = m[2], ao = m[3], av = m[5], pn = m[6], pa = m[7];
			if (cn){
				parsed.classes.push(cn);
			} else if (pn){
				var parser = Selectors.Pseudo.get(pn);
				if (parser) parsed.pseudos.push({parser: parser, argument: pa});
				else parsed.attributes.push({name: pn, operator: '=', value: pa});
			} else if (an){
				parsed.attributes.push({name: an, operator: ao, value: av});
			}
		}
		if (!parsed.classes.length) delete parsed.classes;
		if (!parsed.attributes.length) delete parsed.attributes;
		if (!parsed.pseudos.length) delete parsed.pseudos;
		if (!parsed.classes && !parsed.attributes && !parsed.pseudos) parsed = null;
		return Selectors.Cache.parsed[selector] = parsed;
	},

	parseTagAndID: function(selector){
		var tag = selector.match(Selectors.RegExps.tag);
		var id = selector.match(Selectors.RegExps.id);
		return [(tag) ? tag[1] : '*', (id) ? id[1] : false];
	},

	filter: function(item, parsed, local){
		var i;
		if (parsed.classes){
			for (i = parsed.classes.length; i--; i){
				var cn = parsed.classes[i];
				if (!Selectors.Filters.byClass(item, cn)) return false;
			}
		}
		if (parsed.attributes){
			for (i = parsed.attributes.length; i--; i){
				var att = parsed.attributes[i];
				if (!Selectors.Filters.byAttribute(item, att.name, att.operator, att.value)) return false;
			}
		}
		if (parsed.pseudos){
			for (i = parsed.pseudos.length; i--; i){
				var psd = parsed.pseudos[i];
				if (!Selectors.Filters.byPseudo(item, psd.parser, psd.argument, local)) return false;
			}
		}
		return true;
	},

	getByTagAndID: function(ctx, tag, id){
		if (id){
			var item = (ctx.getElementById) ? ctx.getElementById(id, true) : Element.getElementById(ctx, id, true);
			return (item && Selectors.Filters.byTag(item, tag)) ? [item] : [];
		} else {
			return ctx.getElementsByTagName(tag);
		}
	},

	search: function(self, expression, local){
		var splitters = [];

		var selectors = expression.trim().replace(Selectors.RegExps.splitter, function(m0, m1, m2){
			splitters.push(m1);
			return ':)' + m2;
		}).split(':)');

		var items, filtered, item;

		for (var i = 0, l = selectors.length; i < l; i++){

			var selector = selectors[i];

			if (i == 0 && Selectors.RegExps.quick.test(selector)){
				items = self.getElementsByTagName(selector);
				continue;
			}

			var splitter = splitters[i - 1];

			var tagid = Selectors.Utils.parseTagAndID(selector);
			var tag = tagid[0], id = tagid[1];

			if (i == 0){
				items = Selectors.Utils.getByTagAndID(self, tag, id);
			} else {
				var uniques = {}, found = [];
				for (var j = 0, k = items.length; j < k; j++) found = Selectors.Getters[splitter](found, items[j], tag, id, uniques);
				items = found;
			}

			var parsed = Selectors.Utils.parseSelector(selector);

			if (parsed){
				filtered = [];
				for (var m = 0, n = items.length; m < n; m++){
					item = items[m];
					if (Selectors.Utils.filter(item, parsed, local)) filtered.push(item);
				}
				items = filtered;
			}

		}

		return items;

	}

};

Selectors.Getters = {

	' ': function(found, self, tag, id, uniques){
		var items = Selectors.Utils.getByTagAndID(self, tag, id);
		for (var i = 0, l = items.length; i < l; i++){
			var item = items[i];
			if (Selectors.Utils.chk(item, uniques)) found.push(item);
		}
		return found;
	},

	'>': function(found, self, tag, id, uniques){
		var children = Selectors.Utils.getByTagAndID(self, tag, id);
		for (var i = 0, l = children.length; i < l; i++){
			var child = children[i];
			if (child.parentNode == self && Selectors.Utils.chk(child, uniques)) found.push(child);
		}
		return found;
	},

	'+': function(found, self, tag, id, uniques){
		while ((self = self.nextSibling)){
			if (self.nodeType == 1){
				if (Selectors.Utils.chk(self, uniques) && Selectors.Filters.byTag(self, tag) && Selectors.Filters.byID(self, id)) found.push(self);
				break;
			}
		}
		return found;
	},

	'~': function(found, self, tag, id, uniques){
		while ((self = self.nextSibling)){
			if (self.nodeType == 1){
				if (!Selectors.Utils.chk(self, uniques)) break;
				if (Selectors.Filters.byTag(self, tag) && Selectors.Filters.byID(self, id)) found.push(self);
			}
		}
		return found;
	}

};

Selectors.Filters = {

	byTag: function(self, tag){
		return (tag == '*' || (self.tagName && self.tagName.toLowerCase() == tag));
	},

	byID: function(self, id){
		return (!id || (self.id && self.id == id));
	},

	byClass: function(self, klass){
		return (self.className && self.className.contains && self.className.contains(klass, ' '));
	},

	byPseudo: function(self, parser, argument, local){
		return parser.call(self, argument, local);
	},

	byAttribute: function(self, name, operator, value){
		var result = Element.prototype.getProperty.call(self, name);
		if (!result) return (operator == '!=');
		if (!operator || value == undefined) return true;
		switch (operator){
			case '=': return (result == value);
			case '*=': return (result.contains(value));
			case '^=': return (result.substr(0, value.length) == value);
			case '$=': return (result.substr(result.length - value.length) == value);
			case '!=': return (result != value);
			case '~=': return result.contains(value, ' ');
			case '|=': return result.contains(value, '-');
		}
		return false;
	}

};

Selectors.Pseudo = new Hash({

	// w3c pseudo selectors

	checked: function(){
		return this.checked;
	},
	
	empty: function(){
		return !(this.innerText || this.textContent || '').length;
	},

	not: function(selector){
		return !Element.match(this, selector);
	},

	contains: function(text){
		return (this.innerText || this.textContent || '').contains(text);
	},

	'first-child': function(){
		return Selectors.Pseudo.index.call(this, 0);
	},

	'last-child': function(){
		var element = this;
		while ((element = element.nextSibling)){
			if (element.nodeType == 1) return false;
		}
		return true;
	},

	'only-child': function(){
		var prev = this;
		while ((prev = prev.previousSibling)){
			if (prev.nodeType == 1) return false;
		}
		var next = this;
		while ((next = next.nextSibling)){
			if (next.nodeType == 1) return false;
		}
		return true;
	},

	'nth-child': function(argument, local){
		argument = (argument == undefined) ? 'n' : argument;
		var parsed = Selectors.Utils.parseNthArgument(argument);
		if (parsed.special != 'n') return Selectors.Pseudo[parsed.special].call(this, parsed.a, local);
		var count = 0;
		local.positions = local.positions || {};
		var uid = $uid(this);
		if (!local.positions[uid]){
			var self = this;
			while ((self = self.previousSibling)){
				if (self.nodeType != 1) continue;
				count ++;
				var position = local.positions[$uid(self)];
				if (position != undefined){
					count = position + count;
					break;
				}
			}
			local.positions[uid] = count;
		}
		return (local.positions[uid] % parsed.a == parsed.b);
	},

	// custom pseudo selectors

	index: function(index){
		var element = this, count = 0;
		while ((element = element.previousSibling)){
			if (element.nodeType == 1 && ++count > index) return false;
		}
		return (count == index);
	},

	even: function(argument, local){
		return Selectors.Pseudo['nth-child'].call(this, '2n+1', local);
	},

	odd: function(argument, local){
		return Selectors.Pseudo['nth-child'].call(this, '2n', local);
	},
	
	selected: function(){
		return this.selected;
	},
	
	enabled: function(){
		return (this.disabled === false);
	}

});


/*
---
name: Color
description: Class to create and manipulate colors. Includes HSB «-» RGB «-» HEX conversions. Supports alpha for each type.
requires: [Core/Type, Core/Array]
provides: Color
...
*/

(function(){

var colors = {
	maroon: '#800000', red: '#ff0000', orange: '#ffA500', yellow: '#ffff00', olive: '#808000',
	purple: '#800080', fuchsia: "#ff00ff", white: '#ffffff', lime: '#00ff00', green: '#008000',
	navy: '#000080', blue: '#0000ff', aqua: '#00ffff', teal: '#008080',
	black: '#000000', silver: '#c0c0c0', gray: '#808080'
};

var Color = this.Color = function(color, type){
	
	if (color.isColor){
		
		this.red = color.red;
		this.green = color.green;
		this.blue = color.blue;
		this.alpha = color.alpha;

	} else {
		
		var namedColor = colors[color];
		if (namedColor){
			color = namedColor;
			type = 'hex';
		}

		switch (typeof color){
			case 'string': if (!type) type = (type = color.match(/^rgb|^hsb/)) ? type[0] : 'hex'; break;
			case 'object': type = type || 'rgb'; color = color.toString(); break;
			case 'number': type = 'hex'; color = color.toString(16); break;
		}

		color = Color['parse' + type.toUpperCase()](color);
		this.red = color[0];
		this.green = color[1];
		this.blue = color[2];
		this.alpha = color[3];
	}
	
	this.isColor = true;

};

var limit = function(number, min, max){
	return Math.min(max, Math.max(min, number));
};

var listMatch = /([-.\d]+)\s*,\s*([-.\d]+)\s*,\s*([-.\d]+)\s*,?\s*([-.\d]*)/;
var hexMatch = /^#?([a-f0-9]{1,2})([a-f0-9]{1,2})([a-f0-9]{1,2})([a-f0-9]{0,2})$/i;

Color.parseRGB = function(color){
	return color.match(listMatch).slice(1).map(function(bit, i){
		return (i < 3) ? Math.round(((bit %= 256) < 0) ? bit + 256 : bit) : limit(((bit === '') ? 1 : Number(bit)), 0, 1);
	});
};
	
Color.parseHEX = function(color){
	if (color.length == 1) color = color + color + color;
	return color.match(hexMatch).slice(1).map(function(bit, i){
		if (i == 3) return (bit) ? parseInt(bit, 16) / 255 : 1;
		return parseInt((bit.length == 1) ? bit + bit : bit, 16);
	});
};
	
Color.parseHSB = function(color){
	var hsb = color.match(listMatch).slice(1).map(function(bit, i){
		if (i === 0) return Math.round(((bit %= 360) < 0) ? (bit + 360) : bit);
		else if (i < 3) return limit(Math.round(bit), 0, 100);
		else return limit(((bit === '') ? 1 : Number(bit)), 0, 1);
	});
	
	var a = hsb[3];
	var br = Math.round(hsb[2] / 100 * 255);
	if (hsb[1] == 0) return [br, br, br, a];
		
	var hue = hsb[0];
	var f = hue % 60;
	var p = Math.round((hsb[2] * (100 - hsb[1])) / 10000 * 255);
	var q = Math.round((hsb[2] * (6000 - hsb[1] * f)) / 600000 * 255);
	var t = Math.round((hsb[2] * (6000 - hsb[1] * (60 - f))) / 600000 * 255);

	switch (Math.floor(hue / 60)){
		case 0: return [br, t, p, a];
		case 1: return [q, br, p, a];
		case 2: return [p, br, t, a];
		case 3: return [p, q, br, a];
		case 4: return [t, p, br, a];
		default: return [br, p, q, a];
	}
};

var toString = function(type, array){
	if (array[3] != 1) type += 'a';
	else array.pop();
	return type + '(' + array.join(', ') + ')';
};

Color.prototype = {

	toHSB: function(array){
		var red = this.red, green = this.green, blue = this.blue, alpha = this.alpha;

		var max = Math.max(red, green, blue), min = Math.min(red, green, blue), delta = max - min;
		var hue = 0, saturation = (max != 0) ? delta / max : 0, brightness = max / 255;
		if (saturation){
			var rr = (max - red) / delta, gr = (max - green) / delta, br = (max - blue) / delta;
			hue = (red == max) ? br - gr : (green == max) ? 2 + rr - br : 4 + gr - rr;
			if ((hue /= 6) < 0) hue++;
		}

		var hsb = [Math.round(hue * 360), Math.round(saturation * 100), Math.round(brightness * 100), alpha];

		return (array) ? hsb : toString('hsb', hsb);
	},

	toHEX: function(array){

		var a = this.alpha;
		var alpha = ((a = Math.round((a * 255)).toString(16)).length == 1) ? a + a : a;
		
		var hex = [this.red, this.green, this.blue].map(function(bit){
			bit = bit.toString(16);
			return (bit.length == 1) ? '0' + bit : bit;
		});
		
		return (array) ? hex.concat(alpha) : '#' + hex.join('') + ((alpha == 'ff') ? '' : alpha);
	},
	
	toRGB: function(array){
		var rgb = [this.red, this.green, this.blue, this.alpha];
		return (array) ? rgb : toString('rgb', rgb);
	}

};

Color.prototype.toString = Color.prototype.toRGB;

Color.hex = function(hex){
	return new Color(hex, 'hex');
};

if (this.hex == null) this.hex = Color.hex;

Color.hsb = function(h, s, b, a){
	return new Color([h || 0, s || 0, b || 0, (a == null) ? 1 : a], 'hsb');
};

if (this.hsb == null) this.hsb = Color.hsb;

Color.rgb = function(r, g, b, a){
	return new Color([r || 0, g || 0, b || 0, (a == null) ? 1 : a], 'rgb');
};

if (this.rgb == null) this.rgb = Color.rgb;

if (this.Type) new Type('Color', Color);

})();


/*
---
name: Table
description: LUA-Style table implementation.
requires: [Core/Type, Core/Array]
provides: Table
...
*/

(function(){

var Table = this.Table = function(){

	this.length = 0;
	var keys = [], values = [];
	
	this.set = function(key, value){
		var index = keys.indexOf(key);
		if (index == -1){
			var length = keys.length;
			keys[length] = key;
			values[length] = value;
			this.length++;
		} else {
			values[index] = value;
		}
		return this;
	};

	this.get = function(key){
		var index = keys.indexOf(key);
		return (index == -1) ? null : values[index];
	};

	this.erase = function(key){
		var index = keys.indexOf(key);
		if (index != -1){
			this.length--;
			keys.splice(index, 1);
			return values.splice(index, 1)[0];
		}
		return null;
	};

	this.each = this.forEach = function(fn, bind){
		for (var i = 0, l = this.length; i < l; i++) fn.call(bind, keys[i], values[i], this);
	};
	
};

if (this.Type) new Type('Table', Table);

})();



/*
---
name: ART
description: The heart of ART.
requires: [Core/Class, Color/Color, Table/Table]
provides: [ART, ART.Element, ART.Container]
...
*/

(function(){

this.ART = new Class;

ART.Element = new Class({
	
	/* dom */

	inject: function(element){
		if (element.element) element = element.element;
		element.appendChild(this.element);
		return this;
	},
	
	eject: function(){
		var element = this.element, parent = element.parentNode;
		if (parent) parent.removeChild(element);
		return this;
	},
	
	/* events */
	
	listen: function(type, fn){
		if (!this._events) this._events = {};
		
		if (typeof type != 'string'){ // listen type / fn with object
			for (var t in type) this.listen(t, type[t]);
		} else { // listen to one
			if (!this._events[type]) this._events[type] = new Table;
			var events = this._events[type];
			if (events.get(fn)) return this;
			var bound = fn.bind(this);
			events.set(fn, bound);
			var element = this.element;
			if (element.addEventListener) element.addEventListener(type, bound, false);
			else element.attachEvent('on' + type, bound);
		}

		return this;
	},
	
	ignore: function(type, fn){
		if (!this._events) return this;
		
		if (typeof type != 'string'){ // ignore type / fn with object
			for (var t in type) this.ignore(t, type[t]);
			return this;
		}
		
		var events = this._events[type];
		if (!events) return this;
		
		if (fn == null){ // ignore every of type
			events.each(function(fn, bound){
				this.ignore(type, fn);
			}, this);
		} else { // ignore one
			var bound = events.get(fn);
			if (!bound) return this;
			var element = this.element;
			if (element.removeEventListener) element.removeEventListener(type, bound, false);
			else element.detachEvent('on' + type, bound);
		}

		return this;
	}

});

ART.Container = new Class({

	grab: function(){
		for (var i = 0; i < arguments.length; i++) arguments[i].inject(this);
		return this;
	}

});

var UID = 0;

ART.uniqueID = function(){
	return (new Date().getTime() + (UID++)).toString(36);
};

Color.detach = function(color){
	color = new Color(color);
	return [Color.rgb(color.red, color.green, color.blue).toString(), color.alpha];
};

})();



/*
---
name: ART.Path
description: Class to generate a valid SVG path using method calls.
authors: ["[Valerio Proietti](http://mad4milk.net)", "[Sebastian Markbåge](http://calyptus.eu/)"]
provides: ART.Path
requires: ART
...
*/

(function(){

/* private functions */

var parse = function(path){

	var parts = [], index = -1,
	    bits = path.match(/[a-df-z]|[\-+]?(?:[\d\.]e[\-+]?|[^\s\-+,a-z])+/ig);

	for (var i = 0, l = bits.length; i < l; i++){
		var bit = bits[i];
		if (bit.match(/^[a-z]/i)) parts[++index] = [bit];
		else parts[index].push(Number(bit));
	}
	
	return parts;

};

var circle = Math.PI * 2, north = circle / 2, west = north / 2, east = -west, south = 0;

var calculateArc = function(rx, ry, rotation, large, clockwise, x, y, tX, tY){
	var cx = x / 2, cy = y / 2,
		rxry = rx * rx * ry * ry, rycx = ry * ry * cx * cx, rxcy = rx * rx * cy * cy,
		a = rxry - rxcy - rycx;

	if (a < 0){
		a = Math.sqrt(1 - a / rxry);
		rx *= a; ry *= a;
	} else {
		a = Math.sqrt(a / (rxcy + rycx));
		if (large == clockwise) a = -a;
		cx += -a * y / 2 * rx / ry;
		cy +=  a * x / 2 * ry / rx;
	}

	var sa = Math.atan2(cx, -cy), ea = Math.atan2(-x + cx, y - cy);
	if (!+clockwise){ var t = sa; sa = ea; ea = t; }
	if (ea < sa) ea += circle;

	cx += tX; cy += tY;

	return {
		circle: [cx - rx, cy - ry, cx + rx, cy + ry],
		boundsX: [
			ea > circle + west || (sa < west && ea > west) ? cx - rx : tX,
			ea > circle + east || (sa < east && ea > east) ? cx + rx : tX
		],
		boundsY: [
			ea > north ? cy - ry : tY,
			ea > circle + south || (sa < south && ea > south) ? cy + ry : tY
		]
	};
};

var measureAndTransform = function(parts, precision){
	
	var boundsX = [], boundsY = [];
	
	var ux = function(x){
		boundsX.push(x);
		return (precision) ? Math.round(x * precision) : x;
	}, uy = function(y){
		boundsY.push(y);
		return (precision) ? Math.round(y * precision) : y;
	}, np = function(v){
		return (precision) ? Math.round(v * precision) : v;
	};

	var reflect = function(sx, sy, ex, ey){
		return [ex * 2 - sx, ey * 2 - sy];
	};
	
	var X = 0, Y = 0, px = 0, py = 0, r;
	
	var path = '', inX, inY;
	
	for (i = 0; i < parts.length; i++){
		var v = Array.slice(parts[i]), f = v.shift(), l = f.toLowerCase();
		var refX = l == f ? X : 0, refY = l == f ? Y : 0;
		
		if (l != 'm' && inX == null){
			inX = X; inY = Y;
		}

		switch (l){
			
			case 'm':
				path += 'm' + ux(X = refX + v[0]) + ',' + uy(Y = refY + v[1]);
			break;
			
			case 'l':
				path += 'l' + ux(X = refX + v[0]) + ',' + uy(Y = refY + v[1]);
			break;
			
			case 'c':
				px = refX + v[2]; py = refY + v[3];
				path += 'c' + ux(refX + v[0]) + ',' + uy(refY + v[1]) + ',' + ux(px) + ',' + uy(py) + ',' + ux(X = refX + v[4]) + ',' + uy(Y = refY + v[5]);
			break;

			case 's':
				r = reflect(px, py, X, Y);
				px = refX + v[0]; py = refY + v[1];
				path += 'c' + ux(r[0]) + ',' + uy(r[1]) + ',' + ux(px) + ',' + uy(py) + ',' + ux(X = refX + v[2]) + ',' + uy(Y = refY + v[3]);
			break;
			
			case 'q':
				px = refX + v[0]; py = refY + v[1];
				path += 'c' + ux(refX + v[0]) + ',' + uy(refY + v[1]) + ',' + ux(px) + ',' + uy(py) + ',' + ux(X = refX + v[2]) + ',' + uy(Y = refY + v[3]);
			break;
			
			case 't':
				r = reflect(px, py, X, Y);
				px = refX + r[0]; py = refY + r[1];
				path += 'c' + ux(px) + ',' + uy(py) + ',' + ux(px) + ',' + uy(py) + ',' + ux(X = refX + v[0]) + ',' + uy(Y = refY + v[1]);
			break;

			case 'a':
				px = refX + v[5]; py = refY + v[6];

				if (!+v[0] || !+v[1] || (px == X && py == Y)){
					path += 'l' + ux(X = px) + ',' + uy(Y = py);
					break;
				}
				
				v[7] = X; v[8] = Y;
				r = calculateArc.apply(null, v);

				boundsX.push.apply(boundsX, r.boundsX);
				boundsY.push.apply(boundsY, r.boundsY);

				path += (v[4] == 1 ? 'wa' : 'at') + r.circle.map(np) + ',' + ux(X) + ',' + uy(Y) + ',' + ux(X = px) + ',' + uy(Y = py);
			break;

			case 'h':
				path += 'l' + ux(X = refX + v[0]) + ',' + uy(Y);
			break;
			
			case 'v':
				path += 'l' + ux(X) + ',' + uy(Y = refY + v[0]);
			break;
			
			case 'z':
				path += 'x';
				if (inX != null){
					path += 'm' + ux(X = inX) + ',' + uy(Y = inY);
					inX = null;
				}
			break;
			
		}
	}
	
	var right = Math.max.apply(Math, boundsX),
		bottom = Math.max.apply(Math, boundsY),
		left = Math.min.apply(Math, boundsX),
		top = Math.min.apply(Math, boundsY),
		height = bottom - top,
		width = right - left;
	
	return [path, {left: left, top: top, right: right, bottom: bottom, width: width, height: height}];

};

/* Path Class */

ART.Path = new Class({
	
	initialize: function(path){
		this.boundingBox = null;
		if (path == null) this.path = [];  //no path
		else if (path.path) this.path = Array.slice(path.path); //already a path
		else this.path = parse(path); //string path
	},
	
	push: function(){
		this.boundingBox = null;
		this.path.push(Array.slice(arguments));
		return this;
	},
	
	/*utility*/
	
	move: function(x, y){
		return this.push('m', x, y);
	},
	
	line: function(x, y){
		return this.push('l', x, y);
	},
	
	close: function(){
		return this.push('z');
	},
	
	bezier: function(c1x, c1y, c2x, c2y, ex, ey){
		return this.push('c', c1x, c1y, c2x, c2y, ex, ey);
	},
	
	arc: function(x, y, rx, ry, large){
		return this.push('a', Math.abs(rx || x), Math.abs(ry || rx || y), 0, large ? 1 : 0, 1, x, y);
	},
	
	counterArc: function(x, y, rx, ry, large){
		return this.push('a', Math.abs(rx || x), Math.abs(ry || rx || y), 0, large ? 1 : 0, 0, x, y);
	},
	
	/* transformation, measurement */
	
	toSVG: function(){
		var path = '';
		for (var i = 0, l = this.path.length; i < l; i++) path += this.path[i].join(' ');
		return path;
	},
	
	toVML: function(precision){
		var data = measureAndTransform(this.path, precision);
		this.boundingBox = data[1];
		return data[0];
	},
	
	measure: function(){
		if (this.boundingBox) return this.boundingBox;
		if (this.path.length) return this.boundingBox = measureAndTransform(this.path)[1];
		else return {left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0};
	}
	
});

ART.Path.prototype.toString = ART.Path.prototype.toSVG;

ART.Path.measure = function(paths){
	
	var lefts = [], rights = [], tops = [], bottoms = [];

	paths.each(function(path){
		var box = path.measure();
		lefts.push(box.left);
		rights.push(box.right);
		tops.push(box.top);
		bottoms.push(box.bottom);
	});
	
	var right = Math.max.apply(Math, rights),
		bottom = Math.max.apply(Math, bottoms),
		left = Math.min.apply(Math, lefts),
		top = Math.min.apply(Math, tops),
		height = bottom - top,
		width = right - left;
		
	return {left: left, top: top, right: right, bottom: bottom, width: width, height: height};
	
};

})();


/*
---
name: ART.SVG
description: SVG implementation for ART
provides: [ART.SVG, ART.SVG.Group, ART.SVG.Shape, ART.SVG.Image]
requires: [ART, ART.Element, ART.Container, ART.Path]
...
*/

(function(){
	
var NS = 'http://www.w3.org/2000/svg', XLINK = 'http://www.w3.org/1999/xlink', UID = 0, createElement = function(tag){
	return document.createElementNS(NS, tag);
};

// SVG Base Class

ART.SVG = new Class({

	Extends: ART.Element,
	Implements: ART.Container,

	initialize: function(width, height){
		var element = this.element = createElement('svg');
		element.setAttribute('xmlns', NS);
		element.setAttribute('version', 1.1);
		var defs = this.defs = createElement('defs');
		element.appendChild(defs);
		if (width != null && height != null) this.resize(width, height);
	},

	resize: function(width, height){
		var element = this.element;
		element.setAttribute('width', width);
		element.setAttribute('height', height);
		return this;
	},
	
	toElement: function(){
		return this.element;
	}

});

// SVG Element Class

ART.SVG.Element = new Class({
	
	Extends: ART.Element,

	initialize: function(tag){
		this.uid = ART.uniqueID();
		var element = this.element = createElement(tag);
		element.setAttribute('id', 'e' + this.uid);
		this.transform = {translate: [0, 0], rotate: [0, 0, 0], scale: [1, 1]};
	},
	
	/* transforms */
	
	_writeTransform: function(){
		var transforms = [];
		for (var transform in this.transform) transforms.push(transform + '(' + this.transform[transform].join(',') + ')');
		this.element.setAttribute('transform', transforms.join(' '));
	},
	
	rotate: function(deg, x, y){
		if (x == null || y == null){
			var box = this.measure();
			x = box.left + box.width / 2; y = box.top + box.height / 2;
		}
		this.transform.rotate = [deg, x, y];
		this._writeTransform();
		return this;
	},

	scale: function(x, y){
		if (y == null) y = x;
		this.transform.scale = [x, y];
		this._writeTransform();
		return this;
	},

	translate: function(x, y){
		this.transform.translate = [x, y];
		this._writeTransform();
		return this;
	},
	
	setOpacity: function(opacity){
		this.element.setAttribute('opacity', opacity);
		return this;
	},
	
	// visibility
	
	hide: function(){
		this.element.setAttribute('display', 'none');
		return this;
	},
	
	show: function(){
		this.element.setAttribute('display', '');
		return this;
	}
	
});

// SVG Group Class

ART.SVG.Group = new Class({
	
	Extends: ART.SVG.Element,
	Implements: ART.Container,
	
	initialize: function(){
		this.parent('g');
		this.defs = createElement('defs');
		this.element.appendChild(this.defs);
		this.children = [];
	},
	
	measure: function(){
		return ART.Path.measure(this.children.map(function(child){
			return child.currentPath;
		}));
	}
	
});

// SVG Base Shape Class

ART.SVG.Base = new Class({
	
	Extends: ART.SVG.Element,

	initialize: function(tag){
		this.parent(tag);
		this.element.setAttribute('fill-rule', 'evenodd');
		this.fill();
		this.stroke();
	},
	
	/* insertions */
	
	inject: function(container){
		this.eject();
		if (container instanceof ART.SVG.Group) container.children.push(this);
		this.container = container;
		this._injectGradient('fill');
		this._injectGradient('stroke');
		this.parent(container);
		return this;
	},
	
	eject: function(){
		if (this.container){
			if (this.container instanceof ART.SVG.Group) this.container.children.erase(this);
			this.parent();
			this._ejectGradient('fill');
			this._ejectGradient('stroke');
			this.container = null;
		}
		return this;
	},
	
	_injectGradient: function(type){
		if (!this.container) return;
		var gradient = this[type + 'Gradient'];
		if (gradient) this.container.defs.appendChild(gradient);
	},
	
	_ejectGradient: function(type){
		if (!this.container) return;
		var gradient = this[type + 'Gradient'];
		if (gradient) this.container.defs.removeChild(gradient);
	},
	
	/* styles */
	
	_createGradient: function(type, style, stops){
		this._ejectGradient(type);

		var gradient = createElement(style + 'Gradient');

		this[type + 'Gradient'] = gradient;

		var addColor = function(offset, color){
			color = Color.detach(color);
			var stop = createElement('stop');
			stop.setAttribute('offset', offset);
			stop.setAttribute('stop-color', color[0]);
			stop.setAttribute('stop-opacity', color[1]);
			gradient.appendChild(stop);
		};

		// Enumerate stops, assumes offsets are enumerated in order
		// TODO: Sort. Chrome doesn't always enumerate in expected order but requires stops to be specified in order.
		if ('length' in stops) for (var i = 0, l = stops.length - 1; i <= l; i++) addColor(i / l, stops[i]);
		else for (var offset in stops) addColor(offset, stops[offset]);

		var id = 'g' + ART.uniqueID();
		gradient.setAttribute('id', id);

		this._injectGradient(type);

		this.element.removeAttribute('fill-opacity');
		this.element.setAttribute(type, 'url(#' + id + ')');
		
		return gradient;
	},
	
	_setColor: function(type, color){
		this._ejectGradient(type);
		this[type + 'Gradient'] = null;
		var element = this.element;
		if (color == null){
			element.setAttribute(type, 'none');
			element.removeAttribute(type + '-opacity');
		} else {
			color = Color.detach(color);
			element.setAttribute(type, color[0]);
			element.setAttribute(type + '-opacity', color[1]);
		}
	},

	fill: function(color){
		if (arguments.length > 1) this.fillLinear(arguments);
		else this._setColor('fill', color);
		return this;
	},

	fillRadial: function(stops, focusX, focusY, radius, centerX, centerY){
		var gradient = this._createGradient('fill', 'radial', stops);

		if (focusX != null) gradient.setAttribute('fx', focusX);
		if (focusY != null) gradient.setAttribute('fy', focusY);

		if (radius) gradient.setAttribute('r', radius);

		if (centerX == null) centerX = focusX;
		if (centerY == null) centerY = focusY;

		if (centerX != null) gradient.setAttribute('cx', centerX);
		if (centerY != null) gradient.setAttribute('cy', centerY);

		gradient.setAttribute('spreadMethod', 'reflect'); // Closer to the VML gradient
		
		return this;
	},

	fillLinear: function(stops, angle){
		var gradient = this._createGradient('fill', 'linear', stops);

		angle = ((angle == null) ? 270 : angle) * Math.PI / 180;

		var x = Math.cos(angle), y = -Math.sin(angle),
			l = (Math.abs(x) + Math.abs(y)) / 2;

		x *= l; y *= l;

		gradient.setAttribute('x1', 0.5 - x);
		gradient.setAttribute('x2', 0.5 + x);
		gradient.setAttribute('y1', 0.5 - y);
		gradient.setAttribute('y2', 0.5 + y);

		return this;
	},

	stroke: function(color, width, cap, join){
		var element = this.element;
		element.setAttribute('stroke-width', (width != null) ? width : 1);
		element.setAttribute('stroke-linecap', (cap != null) ? cap : 'round');
		element.setAttribute('stroke-linejoin', (join != null) ? join : 'round');

		this._setColor('stroke', color);
		return this;
	}
	
});

// SVG Shape Class

ART.SVG.Shape = new Class({
	
	Extends: ART.SVG.Base,
	
	initialize: function(path){
		this.parent('path');
		if (path != null) this.draw(path);
	},
	
	draw: function(path){
		this.currentPath = path.toString();
		this.element.setAttribute('d', this.currentPath);
		return this;
	},
	
	measure: function(){
		return new ART.Path(this.currentPath).measure();
	}

});

ART.SVG.Image = new Class({
	
	Extends: ART.SVG.Base,
	
	initialize: function(src, width, height){
		this.parent('image');
		if (arguments.length == 3) this.draw.apply(this, arguments);
	},
	
	draw: function(src, width, height){
		var element = this.element;
		element.setAttributeNS(XLINK, 'href', src);
		element.setAttribute('width', width);
		element.setAttribute('height', height);
		return this;
	}
	
});

})();


/*
---
name: ART.VML
description: VML implementation for ART
authors: ["[Simo Kinnunen](http://twitter.com/sorccu)", "[Valerio Proietti](http://mad4milk.net)", "[Sebastian Markbåge](http://calyptus.eu/)"]
provides: [ART.VML, ART.VML.Group, ART.VML.Shape]
requires: [ART, ART.Element, ART.Container, ART.Path]
...
*/

(function(){

var precision = 100, UID = 0;

// VML Base Class

ART.VML = new Class({

	Extends: ART.Element,
	Implements: ART.Container,
	
	initialize: function(width, height){
		this.vml = document.createElement('vml');
		this.element = document.createElement('av:group');
		this.vml.appendChild(this.element);
		this.children = [];
		if (width != null && height != null) this.resize(width, height);
	},
	
	inject: function(element){
		if (element.element) element = element.element;
		element.appendChild(this.vml);
	},
	
	resize: function(width, height){
		this.width = width;
		this.height = height;
		var style = this.vml.style;
		style.pixelWidth = width;
		style.pixelHeight = height;
		
		style = this.element.style;
		style.width = width;
		style.height = height;
		
		var halfPixel = (0.5 * precision);
		
		this.element.coordorigin = halfPixel + ',' + halfPixel;
		this.element.coordsize = (width * precision) + ',' + (height * precision);

		this.children.each(function(child){
			child._transform();
		});
		
		return this;
	},
	
	toElement: function(){
		return this.vml;
	}
	
});

// VML Initialization

var VMLCSS = 'behavior:url(#default#VML);display:inline-block;position:absolute;left:0px;top:0px;';

var styleSheet, styledTags = {}, styleTag = function(tag){
	if (styleSheet) styledTags[tag] = styleSheet.addRule('av\\:' + tag, VMLCSS);
};

ART.VML.init = function(document){

	var namespaces = document.namespaces;
	if (!namespaces) return false;

	namespaces.add('av', 'urn:schemas-microsoft-com:vml');
	namespaces.add('ao', 'urn:schemas-microsoft-com:office:office');

	styleSheet = document.createStyleSheet();
	styleSheet.addRule('vml', 'display:inline-block;position:relative;overflow:hidden;');
	styleTag('fill');
	styleTag('stroke');
	styleTag('path');
	styleTag('group');

	return true;

};

// VML Element Class

ART.VML.Element = new Class({
	
	Extends: ART.Element,
	
	initialize: function(tag){
		this.uid = ART.uniqueID();
		if (!(tag in styledTags)) styleTag(tag);

		var element = this.element = document.createElement('av:' + tag);
		element.setAttribute('id', 'e' + this.uid);
		
		this.transform = {translate: [0, 0], scale: [1, 1], rotate: [0, 0, 0]};
	},
	
	/* dom */
	
	inject: function(container){
		this.eject();
		this.container = container;
		container.children.include(this);
		this._transform();
		this.parent(container);
		
		return this;
	},

	eject: function(){
		if (this.container){
			this.container.children.erase(this);
			this.container = null;
			this.parent();
		}
		return this;
	},

	/* transform */

	_transform: function(){
		var l = this.left || 0, t = this.top || 0,
		    w = this.width, h = this.height;
		
		if (w == null || h == null) return;
		
		var tn = this.transform,
			tt = tn.translate,
			ts = tn.scale,
			tr = tn.rotate;

		var cw = w, ch = h,
		    cl = l, ct = t,
		    pl = tt[0], pt = tt[1],
		    rotation = tr[0],
		    rx = tr[1], ry = tr[2];
		
		// rotation offset
		var theta = rotation / 180 * Math.PI,
		    sin = Math.sin(theta), cos = Math.cos(theta);
		
		var dx = w / 2 - rx,
		    dy = h / 2 - ry;
				
		pl -= cos * -(dx + l) + sin * (dy + t) + dx;
		pt -= cos * -(dy + t) - sin * (dx + l) + dy;
 
		// scale
		cw /= ts[0];
		ch /= ts[1];
		cl /= ts[0];
		ct /= ts[1];
 
		// transform into multiplied precision space		
		cw *= precision;
		ch *= precision;
		cl *= precision;
		ct *= precision;

		pl *= precision;
		pt *= precision;
		w *= precision;
		h *= precision;
		
		var element = this.element;
		element.coordorigin = cl + ',' + ct;
		element.coordsize = cw + ',' + ch;
		element.style.left = pl;
		element.style.top = pt;
		element.style.width = w;
		element.style.height = h;
		element.style.rotation = rotation;
	},
	
	// transformations
	
	translate: function(x, y){
		this.transform.translate = [x, y];
		this._transform();
		return this;
	},
	
	scale: function(x, y){
		if (y == null) y = x;
		this.transform.scale = [x, y];
		this._transform();
		return this;
	},
	
	rotate: function(deg, x, y){
		if (x == null || y == null){
			var box = this.measure();
			x = box.left + box.width / 2; y = box.top + box.height / 2;
		}
		this.transform.rotate = [deg, x, y];
		this._transform();
		return this;
	},
	
	// visibility
	
	hide: function(){
		this.element.style.display = 'none';
		return this;
	},
	
	show: function(){
		this.element.style.display = '';
		return this;
	}
	
});

// VML Group Class

ART.VML.Group = new Class({
	
	Extends: ART.VML.Element,
	Implements: ART.Container,
	
	initialize: function(){
		this.parent('group');
		this.children = [];
	},
	
	/* dom */
	
	inject: function(container){
		this.parent(container);
		this.width = container.width;
		this.height = container.height;
		this._transform();
		return this;
	},
	
	eject: function(){
		this.parent();
		this.width = this.height = null;
		return this;
	}

});

// VML Base Shape Class

ART.VML.Base = new Class({

	Extends: ART.VML.Element,
	
	initialize: function(tag){
		this.parent(tag);
		var element = this.element;

		var fill = this.fillElement = document.createElement('av:fill');
		fill.on = false;
		element.appendChild(fill);
		
		var stroke = this.strokeElement = document.createElement('av:stroke');
		stroke.on = false;
		element.appendChild(stroke);
	},
	
	/* styles */

	_createGradient: function(style, stops){
		var fill = this.fillElement;

		// Temporarily eject the fill from the DOM
		this.element.removeChild(fill);

		fill.type = style;
		fill.method = 'none';
		fill.rotate = true;

		var colors = [], color1, color2;

		var addColor = function(offset, color){
			color = Color.detach(color);
			if (color1 == null) color1 = color;
			else color2 = color;
			colors.push(offset + ' ' + color[0]);
		};

		// Enumerate stops, assumes offsets are enumerated in order
		if ('length' in stops) for (var i = 0, l = stops.length - 1; i <= l; i++) addColor(i / l, stops[i]);
		else for (var offset in stops) addColor(offset, stops[offset]);
		
		fill.color = color1[0];
		fill.color2 = color2[0];
		
		//if (fill.colors) fill.colors.value = colors; else
		fill.colors = colors;

		// Opacity order gets flipped when color stops are specified
		fill.opacity = color2[1];
		fill['ao:opacity2'] = color1[1];

		fill.on = true;
		this.element.appendChild(fill);
		return fill;
	},
	
	_setColor: function(type, color){
		var element = this[type + 'Element'];
		if (color == null){
			element.on = false;
		} else {
			color = Color.detach(color);
			element.color = color[0];
			element.opacity = color[1];
			element.on = true;
		}
	},
	
	fill: function(color){
		if (arguments.length > 1){
			this.fillLinear(arguments);
		} else {
			var fill = this.fillElement;
			fill.type = 'solid';
			fill.color2 = '';
			fill['ao:opacity2'] = '';
			if (fill.colors) fill.colors.value = '';
			this._setColor('fill', color);
		}
		return this;
	},

	fillRadial: function(stops, focusX, focusY, radius){
		var fill = this._createGradient('gradientradial', stops);
		fill.focus = 50;
		fill.focussize = '0 0';
		fill.focusposition = (focusX == null ? 0.5 : focusX) + ',' + (focusY == null ? 0.5 : focusY);
		fill.focus = (radius == null || radius > 0.5) ? '100%' : (Math.round(radius * 200) + '%');
		return this;
	},

	fillLinear: function(stops, angle){
		var fill = this._createGradient('gradient', stops);
		fill.focus = '100%';
		fill.angle = (angle == null) ? 0 : (90 + angle) % 360;
		return this;
	},

	/* stroke */
	
	stroke: function(color, width, cap, join){
		var stroke = this.strokeElement;
		stroke.weight = (width != null) ? (width / 2) + 'pt' : 1;
		stroke.endcap = (cap != null) ? ((cap == 'butt') ? 'flat' : cap) : 'round';
		stroke.joinstyle = (join != null) ? join : 'round';

		this._setColor('stroke', color);
		return this;
	}

});

// VML Shape Class

ART.VML.Shape = new Class({

	Extends: ART.VML.Base,
	
	initialize: function(path){
		this.parent('shape');

		var p = this.pathElement = document.createElement('av:path');
		p.gradientshapeok = true;
		this.element.appendChild(p);
		
		if (path != null) this.draw(path);
	},
	
	// SVG to VML
	
	draw: function(path){
		
		path = this.currentPath = new ART.Path(path);
		this.currentVML = path.toVML(precision);
		var size = path.measure();
		
		this.right = size.right;
		this.bottom = size.bottom;
		this.top = size.top;
		this.left = size.left;
		this.height = size.height;
		this.width = size.width;
		
		this._transform();
		this._redraw(this._radial);
		
		return this;
	},
	
	measure: function(){
		return new ART.Path(this.currentPath).measure();
	},
	
	// radial gradient workaround

	_redraw: function(radial){
		var vml = this.currentVML || '';

		this._radial = radial;
		if (radial){
			var cx = Math.round((this.left + this.width * radial.x) * precision),
				cy = Math.round((this.top + this.height * radial.y) * precision),

				rx = Math.round(this.width * radial.r * precision),
				ry = Math.round(this.height * radial.r * precision),

				arc = ['wa', cx - rx, cy - ry, cx + rx, cy + ry].join(' ');

			vml = [
				// Resolve rendering bug
				'm', cx, cy - ry, 'l', cx, cy - ry,

				// Merge existing path
				vml,

				// Draw an ellipse around the path to force an elliptical gradient on any shape
				'm', cx, cy - ry,
				arc, cx, cy - ry, cx, cy + ry, arc, cx, cy + ry, cx, cy - ry,
				arc, cx, cy - ry, cx, cy + ry, arc, cx, cy + ry, cx, cy - ry,

				// Don't stroke the path with the extra ellipse, redraw the stroked path separately
				'ns e', vml, 'nf'
			
			].join(' ');
		}

		this.element.path = vml + 'e';
	},

	fill: function(){
		this._redraw();
		return this.parent.apply(this, arguments);
	},

	fillLinear: function(){
		this._redraw();
		return this.parent.apply(this, arguments);
	},

	fillRadial: function(stops, focusX, focusY, radius, centerX, centerY){
		this.parent.apply(this, arguments);

		if (focusX == null) focusX = 0.5;
		if (focusY == null) focusY = 0.5;
		if (radius == null) radius = 0.5;
		if (centerX == null) centerX = focusX;
		if (centerY == null) centerY = focusY;
		
		centerX += centerX - focusX;
		centerY += centerY - focusY;
		
		// Compensation not needed when focusposition is applied out of document
		//focusX = (focusX - centerX) / (radius * 4) + 0.5;
		//focusY = (focusY - centerY) / (radius * 4) + 0.5;

		this.fillElement.focus = '50%';
		//this.fillElement.focusposition = focusX + ',' + focusY;

		this._redraw({x: centerX, y: centerY, r: radius * 2});

		return this;
	}

});
	
})();


/*
---
name: ART.Base
description: implements ART, ART.Shape and ART.Group based on the current browser.
provides: [ART.Base, ART.Group, ART.Shape]
requires: [ART.VML, ART.SVG]
...
*/

(function(){
	
var SVG = function(){

	var implementation = document.implementation;
	return (implementation && implementation.hasFeature && implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1"));

};

var VML = function(){

	return ART.VML.init(document);

};

var MODE = SVG() ? 'SVG' : VML() ? 'VML' : null;
if (!MODE) return;

ART.Shape = new Class({Extends: ART[MODE].Shape});
ART.Group = new Class({Extends: ART[MODE].Group});
ART.implement({Extends: ART[MODE]});

})();


/*
---
name: ART.Shapes
description: Shapes for ART
authors: ["[Valerio Proietti](http://mad4milk.net)", "[Sebastian Markbåge](http://calyptus.eu/)"]
provides: [ART.Shapes, ART.Rectangle, ART.Pill, ART.Ellipse, ART.Wedge]
requires: [ART.Path, ART.Shape]
...
*/

ART.Rectangle = new Class({

	Extends: ART.Shape,
	
	initialize: function(width, height, radius){
		this.parent();
		if (width != null && height != null) this.draw(width, height, radius);
	},
	
	draw: function(width, height, radius){

		var path = new ART.Path;

		if (!radius){

			path.move(0, 0).line(width, 0).line(0, height).line(-width, 0).line(0, -height);

		} else {

			if (typeof radius == 'number') radius = [radius, radius, radius, radius];

			var tl = radius[0], tr = radius[1], br = radius[2], bl = radius[3];

			if (tl < 0) tl = 0;
			if (tr < 0) tr = 0;
			if (bl < 0) bl = 0;
			if (br < 0) br = 0;

			path.move(0, tl);

			if (width < 0) path.move(width, 0);
			if (height < 0) path.move(0, height);

			if (tl > 0) path.arc(tl, -tl);
			path.line(Math.abs(width) - (tr + tl), 0);

			if (tr > 0) path.arc(tr, tr);
			path.line(0, Math.abs(height) - (tr + br));

			if (br > 0) path.arc(-br, br);
			path.line(- Math.abs(width) + (br + bl), 0);

			if (bl > 0) path.arc(-bl, -bl);
			path.line(0, - Math.abs(height) + (bl + tl));
		}

		return this.parent(path);
	}

});

ART.Pill = new Class({
	
	Extends: ART.Rectangle,
	
	draw: function(width, height){
		return this.parent(width, height, ((width < height) ? width : height) / 2);
	}
	
});

ART.Ellipse = new Class({
	
	Extends: ART.Shape,
	
	initialize: function(width, height){
		this.parent();
		if (width != null && height != null) this.draw(width, height);
	},
	
	draw: function(width, height){
		var path = new ART.Path;
		var rx = width / 2, ry = height / 2;
		path.move(0, ry).arc(width, 0, rx, ry).arc(-width, 0, rx, ry);
		return this.parent(path);
	}

});

ART.Wedge = new Class({

	Extends: ART.Shape,

	initialize: function(innerRadius, outerRadius, startAngle, endAngle){
		this.parent();
		if (innerRadius != null || outerRadius != null) this.draw(innerRadius, outerRadius, startAngle, endAngle);
	},

	draw: function(innerRadius, outerRadius, startAngle, endAngle){
		var path = new ART.Path;

		var circle = Math.PI * 2,
			radiansPerDegree = Math.PI / 180,
			sa = startAngle * radiansPerDegree % circle || 0,
			ea = endAngle * radiansPerDegree % circle || 0,
			ir = Math.min(innerRadius || 0, outerRadius || 0),
			or = Math.max(innerRadius || 0, outerRadius || 0),
			a = sa > ea ? circle - sa + ea : ea - sa;

		if (a >= circle){

			path.move(0, or).arc(or * 2, 0, or).arc(-or * 2, 0, or);
			if (ir) path.move(or - ir, 0).counterArc(ir * 2, 0, ir).counterArc(-ir * 2, 0, ir);

		} else {

			var ss = Math.sin(sa), es = Math.sin(ea),
				sc = Math.cos(sa), ec = Math.cos(ea),
				ds = es - ss, dc = ec - sc, dr = ir - or,
				large = a > Math.PI;

			path.move(or + or * ss, or - or * sc).arc(or * ds, or * -dc, or, or, large).line(dr * es, dr * -ec);
			if (ir) path.counterArc(ir * -ds, ir * dc, ir, ir, large);

		}

		path.close();
		return this.parent(path);
	}

});


/*
---
name: ART.Font
description: Fonts for ART, implements code from [Cufón](http://cufon.shoqolate.com/)
authors: ["[Simo Kinnunen](http://twitter.com/sorccu)", "[Valerio Proietti](http://mad4milk.net/)"]
provides: ART.Font
requires: ART.Shape
...
*/

(function(){

var fonts = {};

ART.registerFont = function(font){
	var face = font.face, name = face['font-family'];
	if (!fonts[name]) fonts[name] = {};
	var currentFont = fonts[name];
	var isBold = (face['font-weight'] > 400), isItalic = (face['font-stretch'] == 'oblique');
	if (isBold && isItalic) currentFont.boldItalic = font;
	else if (isBold) currentFont.bold = font;
	else if (isItalic) currentFont.italic = font;
	else currentFont.normal = font;
	return this;
};

var VMLToSVG = function(path, s, x, y){
	var end = '';
	var regexp = /([mrvxe])([^a-z]*)/g, match;
	while ((match = regexp.exec(path))){
		var c = match[2].split(',');
		switch (match[1]){
			case 'v': end += 'c ' + (s * c[0]) + ',' + (s * c[1]) + ',' + (s * c[2]) + ',' + (s * c[3]) + ',' + (s * c[4]) + ',' + (s * c[5]); break;
			case 'r': end += 'l ' + (s * c[0]) + ',' + (s * c[1]); break;
			case 'm': end += 'M ' + (x + (s * c[0])) + ',' + (y + (s * c[1])); break;
			case 'x': end += 'z'; break;
		}
	}
	
	return end;
};

ART.Font = new Class({
	
	Extends: ART.Shape,
	
	initialize: function(font, variant, text, size){
		this.parent();
		if (font != null && text != null && size != null) this.draw(font, variant, text, size);
	},
	
	draw: function(font, variant, text, size){
		if (typeof font == 'string') font = fonts[font][(variant || 'normal').camelCase()];
		if (!font) throw new Error('The specified font has not been found.');
		size = size / font.face['units-per-em'];
		
		var width = 0, height = size * font.face.ascent, path = '';

		for (var i = 0, l = text.length; i < l; ++i){
			var glyph = font.glyphs[text.charAt(i)] || font.glyphs[' '];
			var w = size * (glyph.w || font.w);
			if (glyph.d) path += VMLToSVG('m' + glyph.d + 'x', size, width, height);
			width += w;
		}
		
		this.fontSize = {width: width, height: size * (font.face.ascent - font.face.descent)};
		
		return this.parent(path);
	},
	
	measure: function(){
		return this.fontSize || this.parent();
	}

});

})();


/*
---

name: Moderna

description: MgOpen Moderna built with [Cufón](http://wiki.github.com/sorccu/cufon/about)

provides: Moderna

requires: ART.Font

...
*/

/*!
 * The following copyright notice may not be removed under any circumstances.
 * 
 * Copyright:
 * Copyright (c) Magenta ltd, 2004.
 * 
 * Manufacturer:
 * Magenta ltd
 * 
 * Vendor URL:
 * http://www.magenta.gr
 * 
 * License information:
 * http://www.ellak.gr/fonts/MgOpen/license.html
 */

ART.registerFont({"w":205,"face":{"font-family":"Moderna","font-weight":400,"font-stretch":"normal","units-per-em":"360","panose-1":"2 11 5 3 0 2 0 6 0 4","ascent":"288","descent":"-72","x-height":"6","bbox":"-20 -279 328 86","underline-thickness":"18","underline-position":"-27","unicode-range":"U+0020-U+007E"},"glyphs":{" ":{"w":97},"!":{"d":"9,-63v0,-20,-9,-93,-9,-114r0,-85r36,0v2,71,-3,135,-9,199r-18,0xm36,0r-36,0r0,-39r36,0r0,39","w":61},"\"":{"d":"77,-157r-24,0r0,-99r24,0r0,99xm25,-157r-25,0r0,-99r25,0r0,99","w":102},"#":{"d":"250,-179r-10,26r-54,0r-16,47r57,0r-9,26r-58,0r-28,81r-30,0r29,-81r-46,0r-29,81r-29,0r28,-81r-55,0r9,-26r55,0r17,-47r-59,0r9,-26r59,0r29,-82r30,0r-29,82r46,0r29,-82r29,0r-28,82r54,0xm157,-153r-47,0r-16,47r47,0","w":275},"$":{"d":"3,-188v-1,-41,36,-67,77,-67r0,-24r19,0r0,24v41,0,75,27,73,69r-32,0v-4,-23,-17,-38,-41,-40r0,83v49,9,82,29,82,80v0,47,-32,70,-82,69r0,33r-19,0r0,-33v-50,1,-81,-32,-80,-83r32,0v0,32,17,54,48,56r0,-93v-47,-9,-75,-25,-77,-74xm80,-226v-37,-5,-56,41,-33,66v7,7,18,10,33,13r0,-79xm99,-20v46,-2,59,-45,35,-74v-8,-8,-19,-14,-35,-16r0,90"},"%":{"d":"282,-63v0,37,-27,63,-63,63v-36,0,-63,-27,-63,-63v0,-36,26,-64,63,-64v36,0,63,28,63,64xm184,-63v0,21,15,36,35,36v22,0,35,-16,35,-36v0,-21,-14,-38,-35,-37v-21,0,-35,16,-35,37xm230,-256r-156,263r-22,0r156,-263r22,0xm125,-185v0,36,-26,64,-62,64v-37,0,-65,-28,-64,-64v0,-36,26,-63,63,-63v37,0,63,26,63,63xm99,-185v0,-21,-15,-37,-36,-37v-23,-1,-37,17,-37,38v0,21,14,36,36,36v23,0,37,-16,37,-37","w":307},"&":{"d":"161,-85v6,-14,8,-20,11,-43r31,0v0,24,-7,48,-20,69r49,59r-44,0r-26,-32v-20,23,-46,43,-82,43v-49,0,-76,-38,-81,-83v5,-40,30,-58,65,-79v-15,-18,-28,-34,-28,-61v-1,-34,29,-59,64,-58v35,0,62,23,61,57v-2,34,-23,53,-49,69xm94,-163v21,-15,35,-23,37,-49v1,-19,-14,-31,-31,-31v-31,-2,-45,34,-25,58v4,6,10,13,19,22xm35,-73v0,59,76,70,109,19r-62,-76v-25,15,-47,27,-47,57","w":257},"'":{"d":"36,-262v2,43,0,79,-36,88r0,-16v14,-2,18,-19,19,-36r-19,0r0,-36r36,0","w":61},"(":{"d":"82,-265v-65,92,-63,248,0,340r-22,0v-33,-44,-60,-101,-60,-170v0,-70,26,-124,60,-170r22,0","w":107},")":{"d":"23,-265v33,46,59,99,59,170v0,70,-25,126,-59,170r-23,0v63,-91,65,-248,0,-340r23,0","w":107},"*":{"d":"175,-199r-52,14r35,44r-23,17r-32,-45r-32,44r-25,-16r36,-44r-52,-14r10,-28r49,16r0,-51r27,0r0,51r49,-16"},"+":{"d":"199,-96r-84,0r0,96r-25,0r0,-96r-84,0r0,-25r84,0r0,-97r25,0r0,97r84,0r0,25"},",":{"d":"37,-39v2,45,0,84,-37,93r0,-18v13,-4,18,-17,18,-36r-18,0r0,-39r37,0","w":61},"-":{"d":"91,-82r-88,0r0,-29r88,0r0,29","w":123},".":{"d":"37,0r-37,0r0,-39r37,0r0,39","w":61},"\/":{"d":"158,-270r-89,303r-21,0r87,-303r23,0"},"0":{"d":"102,-256v112,1,112,263,0,264v-111,-3,-112,-261,0,-264xm102,-226v-72,9,-72,196,0,203v72,-7,72,-196,0,-203"},"1":{"d":"56,-206v44,-1,57,-14,67,-50r26,0r0,256r-34,0r0,-181r-59,0r0,-25"},"2":{"d":"106,-256v44,0,84,32,84,76v0,84,-120,83,-138,148r138,0r0,32r-175,0v0,-33,11,-60,36,-81v32,-27,102,-51,104,-98v1,-27,-22,-45,-48,-46v-32,0,-54,27,-53,62r-33,0v-1,-53,32,-93,85,-93"},"3":{"d":"150,-136v77,29,37,142,-46,142v-55,0,-91,-31,-90,-86r34,0v-1,34,21,55,55,55v31,0,54,-18,53,-48v-2,-37,-28,-45,-72,-45r0,-29v41,0,60,-5,63,-39v1,-24,-20,-43,-44,-42v-33,1,-51,21,-50,57r-33,0v0,-52,29,-86,80,-86v43,0,82,27,82,69v0,26,-15,41,-32,52"},"4":{"d":"193,-63r-37,0r0,63r-33,0r0,-63r-110,0r0,-32r110,-153r33,0r0,156r37,0r0,29xm123,-92r0,-114r-81,114r81,0"},"5":{"d":"55,-150v52,-43,136,2,136,69v0,76,-94,111,-151,69v-18,-13,-26,-31,-26,-54r34,0v6,25,23,43,51,43v31,0,57,-26,57,-58v0,-58,-77,-72,-105,-33r-30,0r20,-134r136,0r0,30r-111,0"},"6":{"d":"50,-134v40,-54,142,-22,142,53v0,48,-40,90,-88,89v-60,-2,-90,-55,-90,-122v0,-99,76,-181,153,-123v16,12,23,31,23,52r-34,0v-2,-42,-62,-57,-87,-21v-12,18,-19,41,-19,72xm105,-22v29,-1,51,-23,51,-55v0,-32,-21,-57,-51,-57v-30,0,-51,23,-51,56v0,32,21,56,51,56"},"7":{"d":"190,-218v-56,66,-86,121,-103,218r-37,0v17,-97,48,-149,104,-215r-139,0r0,-33r175,0r0,30"},"8":{"d":"182,-189v0,25,-15,42,-34,52v25,10,43,34,43,64v0,46,-40,80,-88,80v-48,0,-89,-33,-89,-79v0,-32,18,-54,43,-65v-20,-10,-34,-27,-34,-51v-1,-86,160,-90,159,-1xm58,-187v0,25,19,40,45,40v25,0,43,-16,43,-39v0,-24,-19,-40,-44,-40v-25,0,-44,15,-44,39xm50,-73v0,29,23,50,53,50v29,0,52,-22,52,-50v0,-28,-22,-48,-52,-48v-30,0,-53,19,-53,48"},"9":{"d":"99,-256v62,0,93,53,93,120v0,103,-74,183,-153,124v-17,-13,-24,-31,-24,-51r34,0v0,41,64,58,87,21v11,-17,19,-40,19,-72v-45,56,-141,22,-141,-54v0,-50,36,-88,85,-88xm49,-171v0,32,19,56,51,55v30,0,52,-24,52,-55v0,-30,-22,-55,-52,-55v-31,0,-52,25,-51,55"},":":{"d":"37,-152r-37,0r0,-39r37,0r0,39xm37,0r-37,0r0,-39r37,0r0,39","w":61},";":{"d":"37,-152r-37,0r0,-39r37,0r0,39xm37,-39v2,45,0,84,-37,93r0,-18v13,-6,18,-15,18,-36r-18,0r0,-39r37,0","w":61},"<":{"d":"201,-11r-196,-87r0,-23r196,-86r0,28r-160,70r160,70r0,28"},"=":{"d":"203,-132r-200,0r0,-25r200,0r0,25xm203,-61r-200,0r0,-25r200,0r0,25"},">":{"d":"201,-98r-196,87r0,-28r158,-70r-158,-70r0,-28r196,86r0,23"},"?":{"d":"78,-271v61,-2,105,68,63,115v-20,23,-50,42,-48,85r-32,0v-5,-60,58,-77,62,-127v2,-25,-21,-44,-45,-44v-30,0,-47,26,-46,59r-32,0v-1,-51,29,-86,78,-88xm96,0r-36,0r0,-39r36,0r0,39","w":182},"@":{"d":"163,32v41,0,87,-15,112,-34r10,14v-30,22,-73,41,-121,41v-95,3,-164,-57,-164,-147v0,-94,81,-167,178,-167v85,0,148,49,149,127v1,60,-43,115,-102,113v-25,0,-33,-8,-34,-31v-11,18,-27,30,-54,31v-36,1,-54,-25,-56,-60v-4,-67,86,-138,129,-72r10,-20r23,0r-27,115v0,10,8,15,18,15v40,0,66,-45,66,-89v0,-68,-50,-108,-122,-108v-85,0,-154,63,-153,146v0,76,59,128,138,126xm143,-40v43,-8,47,-31,61,-87v-2,-19,-17,-32,-37,-32v-32,-1,-58,40,-57,75v0,23,11,44,33,44","w":351},"A":{"d":"235,0r-39,0r-28,-78r-103,0r-28,78r-37,0r98,-262r39,0xm158,-109r-41,-116r-41,116r82,0","w":261,"k":{"y":54,"w":44,"v":55,"t":29,"s":12,"q":17,"o":17,"j":8,"i":8,"g":17,"f":27,"e":17,"d":26,"c":18,"a":8,"Z":8,"Y":79,"W":57,"V":78,"U":19,"T":77,"S":22,"Q":28,"O":28,"J":27,"G":29,"C":27}},"B":{"d":"190,-199v0,29,-18,49,-40,58v31,3,52,27,52,60v1,48,-41,81,-90,81r-112,0r0,-262v81,1,189,-16,190,63xm153,-193v0,-49,-66,-40,-117,-40r0,81v51,1,117,7,117,-41xm165,-78v0,-53,-72,-46,-129,-45r0,91v57,1,129,7,129,-46","w":227,"k":{"z":10,"x":8,"Z":13,"Y":30,"X":25,"W":16,"V":21,"T":21,"A":17}},"C":{"d":"122,-26v41,0,74,-32,73,-72r35,0v2,60,-53,105,-112,105v-75,0,-118,-61,-118,-139v0,-78,46,-138,122,-138v55,0,107,36,106,86r-35,0v-6,-31,-34,-55,-70,-55v-54,0,-88,50,-88,107v0,56,32,106,87,106","w":244,"k":{"Z":18,"Y":28,"X":30,"W":11,"V":18,"T":19,"A":20}},"D":{"d":"215,-135v0,71,-47,135,-116,135r-99,0r0,-262r101,0v69,-2,114,57,114,127xm176,-132v0,-51,-30,-100,-78,-100r-62,0r0,200r62,0v49,1,78,-48,78,-100","w":242,"k":{"Z":32,"Y":41,"X":44,"W":20,"V":28,"T":35,"J":13,"A":31}},"E":{"d":"191,0r-191,0r0,-262r188,0r0,32r-152,0r0,78r140,0r0,31r-140,0r0,89r155,0r0,32","w":204,"k":{"y":24,"w":22,"v":25,"t":22,"q":12,"o":12,"g":12,"f":24,"e":12,"d":16,"c":12,"Y":7,"T":10,"S":12,"Q":9,"O":9,"J":15,"G":9,"C":9}},"F":{"d":"177,-230r-141,0r0,79r123,0r0,32r-123,0r0,119r-36,0r0,-262r177,0r0,32","w":185,"k":{"z":75,"y":25,"x":37,"w":22,"v":26,"u":8,"t":18,"s":17,"r":8,"q":13,"p":8,"o":12,"n":8,"m":8,"g":12,"f":21,"e":12,"d":15,"c":12,"a":19,"Z":10,"S":9,"Q":8,"O":8,"J":98,"G":8,"C":8,"A":49}},"G":{"d":"37,-132v0,57,34,108,88,108v47,0,82,-40,81,-89r-82,0r0,-29r115,0r0,142r-23,0r-8,-35v-18,24,-48,41,-86,42v-70,2,-122,-65,-122,-137v0,-109,109,-178,198,-118v22,16,34,37,37,64r-35,0v-7,-32,-37,-56,-74,-56v-55,0,-89,51,-89,108","w":262,"k":{"Y":32,"W":14,"V":21,"T":23}},"H":{"d":"208,0r-35,0r0,-123r-137,0r0,123r-36,0r0,-262r36,0r0,107r137,0r0,-107r35,0r0,262","w":237},"I":{"d":"47,0r-36,0r0,-262r36,0r0,262","w":75},"J":{"d":"75,-25v35,0,41,-20,41,-62r0,-175r36,0r0,190v0,53,-25,79,-77,79v-56,-1,-75,-33,-75,-92r35,0v0,34,9,60,40,60","w":181,"k":{"A":13}},"K":{"d":"212,0r-44,0r-92,-132r-40,39r0,93r-36,0r0,-262r36,0r0,126r126,-126r48,0r-107,106","w":234,"k":{"y":55,"w":45,"v":56,"u":13,"t":30,"s":19,"q":27,"o":27,"g":27,"f":24,"e":27,"d":32,"c":27,"a":13,"Y":7,"T":10,"S":28,"Q":39,"O":39,"J":29,"G":39,"C":37}},"L":{"d":"167,0r-167,0r0,-262r36,0r0,229r131,0r0,33","w":180,"k":{"y":47,"w":39,"v":48,"t":24,"q":12,"o":12,"j":8,"i":8,"g":12,"f":27,"e":12,"d":20,"c":12,"Z":8,"Y":79,"W":51,"V":71,"U":13,"T":77,"S":15,"Q":27,"O":27,"J":18,"G":27,"C":24}},"M":{"d":"247,0r-35,0r0,-225r-73,225r-34,0r-72,-224r0,224r-33,0r0,-262r52,0r70,221r75,-221r50,0r0,262","w":276},"N":{"d":"208,0r-39,0r-135,-213r0,213r-34,0r0,-262r39,0r135,212r0,-212r34,0r0,262","w":236},"O":{"d":"0,-131v0,-77,52,-139,126,-139v73,0,122,62,122,137v0,77,-49,140,-123,140v-75,0,-125,-62,-125,-138xm37,-131v0,57,33,106,88,106v53,0,86,-50,86,-106v0,-57,-32,-106,-86,-106v-54,0,-88,49,-88,106","w":273,"k":{"Z":28,"Y":39,"X":40,"W":18,"V":26,"T":31,"J":10,"A":28}},"P":{"d":"188,-186v0,45,-35,75,-81,75r-71,0r0,111r-36,0r0,-262r110,0v44,-1,78,31,78,76xm154,-187v0,-50,-65,-44,-118,-43r0,88v54,2,118,4,118,-45","w":208,"k":{"z":11,"x":8,"s":13,"q":17,"o":17,"g":17,"e":17,"d":20,"c":17,"a":17,"Z":26,"Y":30,"X":32,"W":14,"V":20,"T":20,"S":9,"J":104,"A":54}},"Q":{"d":"126,-270v121,0,159,165,90,243r31,26r-17,22r-37,-30v-91,48,-193,-18,-193,-122v0,-77,51,-139,126,-139xm37,-131v0,72,58,132,127,99r-29,-24r17,-22r36,28v52,-56,27,-189,-63,-189v-55,0,-88,51,-88,108","w":277,"k":{"Y":39,"W":18,"V":26,"T":32,"J":10}},"R":{"d":"194,-190v0,27,-16,50,-36,60v28,15,31,25,31,76v0,31,11,37,14,54r-41,0v-6,-9,-10,-30,-10,-63v0,-62,-61,-48,-116,-49r0,112r-36,0r0,-262v87,-1,194,-12,194,72xm159,-190v0,-48,-70,-43,-123,-42r0,89v56,2,123,3,123,-47","w":235,"k":{"y":9,"w":8,"v":9,"t":8,"s":12,"q":11,"o":11,"j":8,"i":8,"g":10,"f":9,"e":11,"d":18,"c":11,"a":10,"Z":8,"Y":38,"W":22,"V":28,"T":28,"S":14,"Q":12,"O":12,"J":23,"G":12,"C":11}},"S":{"d":"103,-242v-29,-1,-64,19,-61,45v9,67,162,33,162,121v0,78,-120,108,-174,58v-19,-18,-30,-40,-30,-69r34,0v0,39,27,65,66,65v32,0,71,-19,68,-48v-7,-69,-159,-35,-159,-122v0,-74,107,-101,158,-56v19,16,29,36,29,62r-34,0v0,-34,-24,-56,-59,-56","w":230,"k":{"z":13,"y":8,"x":10,"v":8,"Z":15,"Y":35,"X":27,"W":19,"V":25,"T":25,"J":9,"A":20}},"T":{"d":"202,-231r-83,0r0,231r-36,0r0,-231r-83,0r0,-31r202,0r0,31","w":216,"k":{"z":65,"y":64,"x":64,"w":63,"v":65,"u":58,"t":18,"s":63,"r":58,"q":61,"p":58,"o":61,"n":58,"m":58,"g":61,"f":22,"e":61,"d":65,"c":62,"a":62,"Z":10,"S":12,"Q":22,"O":22,"J":72,"G":21,"C":19,"A":66}},"U":{"d":"102,-28v39,0,68,-33,68,-74r0,-160r36,0r0,160v2,61,-44,108,-106,108v-61,0,-100,-46,-100,-108r0,-160r36,0r0,160v-1,41,26,74,66,74","w":234,"k":{"Z":10,"A":21}},"V":{"d":"224,-262r-93,262r-37,0r-94,-262r37,0r76,219r73,-219r38,0","w":243,"k":{"z":24,"y":19,"x":21,"w":18,"v":19,"u":13,"t":15,"s":31,"r":12,"q":35,"p":11,"o":35,"n":11,"m":11,"g":35,"f":15,"e":35,"d":39,"c":35,"a":35,"Z":10,"S":18,"Q":21,"O":21,"J":54,"G":21,"C":20,"A":72}},"W":{"d":"328,-262r-70,262r-35,0r-60,-217r-58,217r-36,0r-69,-262r35,0r54,209r55,-209r38,0r57,208r55,-208r34,0","w":350,"k":{"z":18,"y":13,"x":15,"w":12,"v":13,"u":7,"t":10,"s":24,"q":26,"o":25,"g":25,"f":10,"e":26,"d":30,"c":25,"a":27,"Z":10,"S":15,"Q":15,"O":15,"J":42,"G":15,"C":15,"A":54}},"X":{"d":"221,0r-44,0r-67,-106r-67,106r-43,0r90,-135r-85,-127r43,0r63,97r64,-97r42,0r-86,127","w":243,"k":{"y":42,"w":41,"v":42,"u":11,"t":27,"s":17,"q":25,"o":25,"g":25,"f":22,"e":24,"d":30,"c":24,"a":11,"Y":7,"T":10,"S":26,"Q":36,"O":36,"J":27,"G":36,"C":34}},"Y":{"d":"212,-262r-87,154r0,108r-36,0r0,-108r-89,-154r36,0r71,124r69,-124r36,0","w":229,"k":{"z":37,"y":32,"x":34,"w":31,"v":32,"u":26,"t":24,"s":48,"r":25,"q":55,"p":23,"o":54,"n":22,"m":22,"g":55,"f":28,"e":55,"d":58,"c":54,"a":53,"Z":10,"S":23,"Q":31,"O":31,"J":75,"G":31,"C":29,"A":69}},"Z":{"d":"202,0r-202,0r0,-30r161,-202r-151,0r0,-30r192,0r0,32r-158,198r158,0r0,32","w":219,"k":{"y":25,"w":24,"v":25,"t":18,"q":10,"o":10,"g":10,"f":20,"e":9,"d":13,"c":9,"S":9,"Q":18,"O":18,"J":12,"G":17,"C":15}},"[":{"d":"71,73r-71,0r0,-335r71,0r0,24r-39,0r0,286r39,0r0,25","w":96},"\\":{"d":"110,33r-23,0r-87,-303r22,0","w":135},"]":{"d":"71,73r-71,0r0,-25r39,0r0,-286r-39,0r0,-24r71,0r0,335","w":96},"^":{"d":"155,-200r-21,0r-31,-41r-31,41r-22,0r35,-62r35,0"},"_":{"d":"183,86r-183,0r0,-26r183,0r0,26","w":208},"`":{"d":"36,-181r-36,0v-2,-43,-2,-81,36,-89r0,17v-16,1,-18,19,-18,36r18,0r0,36","w":61},"a":{"d":"86,-200v40,0,74,24,74,62v0,36,-3,78,2,110v1,6,12,5,19,4r0,24v-22,10,-52,2,-51,-25v-27,43,-135,45,-130,-25v3,-46,32,-57,85,-63v34,-4,43,-2,43,-23v0,-47,-88,-44,-88,3r-31,0v-1,-41,34,-67,77,-67xm68,-22v38,0,68,-26,59,-74v-43,8,-91,10,-94,44v-2,20,16,30,35,30","k":{"y":21,"w":17,"v":20,"t":12,"f":13}},"b":{"d":"89,-195v51,-1,88,47,88,99v0,53,-35,102,-87,102v-28,0,-47,-12,-59,-30r0,24r-31,0r0,-262r31,0r0,97v11,-18,31,-30,58,-30xm86,-22v35,0,58,-34,58,-71v0,-39,-22,-75,-59,-74v-35,0,-58,33,-57,71v0,38,22,74,58,74","w":203,"k":{"z":8,"y":13,"x":21,"w":8,"v":12,"t":14,"f":16}},"c":{"d":"93,-23v28,0,50,-19,54,-45r35,0v-5,43,-44,75,-90,75v-56,0,-92,-46,-92,-103v0,-81,86,-131,148,-82v16,13,27,29,31,50r-35,0v-3,-22,-26,-40,-51,-40v-38,0,-58,33,-58,72v0,39,21,74,58,73","w":200,"k":{"y":11,"x":18,"w":7,"v":11}},"d":{"d":"0,-95v0,-82,98,-142,146,-73r0,-94r31,0r0,262r-31,0r0,-24v-15,15,-33,30,-61,30v-49,0,-85,-51,-85,-101xm93,-22v37,0,58,-36,58,-75v0,-38,-22,-72,-57,-72v-36,0,-59,35,-59,74v0,38,22,73,58,73","w":206},"e":{"d":"0,-94v0,-91,112,-143,162,-69v15,21,23,47,23,78r-149,0v0,33,23,63,57,63v25,0,48,-19,52,-42r36,0v-8,39,-42,71,-88,71v-56,1,-93,-44,-93,-101xm149,-111v0,-47,-62,-78,-95,-40v-9,11,-16,24,-18,40r113,0","w":210,"k":{"z":9,"y":16,"x":22,"w":12,"v":16,"t":11,"f":12}},"f":{"d":"98,-235v-28,-12,-37,12,-34,44r34,0r0,26r-34,0r0,165r-33,0r0,-165r-31,0r0,-26r31,0v-3,-62,12,-79,67,-74r0,30","w":122,"k":{"q":8,"o":8,"g":8,"e":8,"d":13,"c":7}},"g":{"d":"86,-197v27,1,45,13,60,30r0,-24r32,0r0,182v4,73,-83,110,-144,75v-18,-10,-26,-26,-26,-44r32,0v9,35,76,45,94,6v7,-15,13,-31,13,-51v-13,16,-33,28,-60,29v-50,1,-87,-50,-87,-102v0,-52,37,-102,86,-101xm94,-22v35,0,58,-36,57,-73v0,-39,-22,-74,-58,-74v-37,0,-58,34,-58,73v-1,39,22,74,59,74","w":217,"k":{"i":7}},"h":{"d":"94,-197v41,0,66,31,65,75r0,122r-32,0v-6,-63,22,-166,-39,-170v-29,-2,-56,27,-56,57r0,113r-32,0r0,-262r32,0r0,98v8,-20,36,-33,62,-33","w":187},"i":{"d":"35,-226r-31,0r0,-36r31,0r0,36xm35,0r-31,0r0,-191r31,0r0,191","w":71},"j":{"d":"43,-226r-32,0r0,-36r32,0r0,36xm-20,42v22,1,31,-2,31,-25r0,-208r32,0r0,212v2,42,-20,53,-63,51r0,-30","w":90,"k":{"z":11,"y":11,"x":10,"w":9,"v":11,"t":11,"s":10,"q":14,"o":8,"l":16,"i":17,"g":8,"f":11,"e":8,"d":15,"c":9,"a":9}},"k":{"d":"159,-192r-71,71r70,121r-36,0r-57,-99r-34,34r0,65r-31,0r0,-262r31,0r0,158r87,-88r41,0","w":180,"k":{"s":9,"q":17,"o":17,"g":16,"e":16,"d":27,"c":16}},"l":{"d":"43,0r-32,0r0,-262r32,0r0,262","w":72},"m":{"d":"136,-166v27,-52,128,-37,128,33r0,133r-31,0v-5,-64,21,-171,-41,-171v-63,0,-38,106,-43,171r-33,0v-6,-63,23,-170,-40,-170v-64,0,-40,105,-44,170r-32,0r0,-192r30,0r0,26v16,-40,90,-40,106,0","w":292},"n":{"d":"93,-198v86,-1,64,114,66,198r-32,0v-6,-63,23,-166,-41,-170v-31,-2,-56,30,-56,61r0,109r-30,0r0,-192r30,0r0,29v10,-20,35,-35,63,-35","w":187},"o":{"d":"185,-95v0,57,-37,101,-92,101v-55,0,-93,-44,-93,-101v0,-58,37,-102,93,-102v55,0,92,46,92,102xm35,-96v0,38,23,74,58,74v37,0,58,-35,58,-74v0,-40,-21,-73,-58,-73v-35,-1,-58,35,-58,73","w":212,"k":{"z":10,"y":15,"x":23,"w":10,"v":14,"t":10,"f":10}},"p":{"d":"91,-197v51,-2,86,50,86,103v0,53,-34,102,-86,100v-25,0,-45,-10,-60,-29r0,95r-31,0r0,-264r31,0r0,28v13,-18,32,-33,60,-33xm86,-22v36,0,58,-36,58,-74v0,-38,-23,-73,-58,-73v-35,0,-58,36,-58,74v0,38,22,73,58,73","w":203,"k":{"z":7,"y":19,"x":20,"w":9,"v":13,"t":8,"f":8}},"q":{"d":"87,-197v28,0,47,14,59,32r0,-26r31,0r0,263r-31,0r0,-97v-9,19,-30,30,-56,31v-53,1,-90,-45,-90,-100v0,-53,36,-103,87,-103xm94,-22v37,0,57,-36,57,-75v0,-38,-22,-72,-58,-72v-35,0,-58,33,-58,71v0,40,21,76,59,76","w":227,"k":{"z":14,"y":14,"x":13,"w":12,"v":13,"u":8,"t":12,"s":13,"r":7,"q":17,"p":8,"o":11,"n":8,"m":8,"l":18,"k":7,"i":18,"h":7,"g":11,"f":13,"e":11,"d":11,"c":12,"b":8,"a":12}},"r":{"d":"92,-161v-38,-1,-60,16,-60,54r0,107r-32,0r0,-191r30,0r0,34v10,-26,28,-37,62,-38r0,34","w":111},"s":{"d":"37,-145v-10,26,94,42,89,43v68,32,14,108,-50,108v-44,0,-77,-26,-76,-68r31,0v0,26,21,40,47,40v22,1,50,-13,46,-32v-8,-46,-119,-23,-119,-87v0,-53,82,-72,123,-42v16,11,23,26,23,45r-31,0v3,-40,-80,-43,-83,-7","w":180,"k":{"y":8,"x":10,"v":8}},"t":{"d":"60,-48v-3,23,17,24,35,20r0,28v-36,5,-67,2,-67,-37r0,-128r-28,0r0,-26r28,0r0,-54r32,0r0,54r35,0r0,26r-35,0r0,117","w":118,"k":{"d":11}},"u":{"d":"71,-21v32,2,57,-34,57,-67r0,-103r32,0r0,191r-31,0r0,-28v-12,20,-36,34,-65,34v-40,1,-64,-31,-64,-73r0,-124r32,0v6,63,-22,165,39,170","w":189},"v":{"d":"175,-191r-70,191r-34,0r-71,-191r35,0r53,153r52,-153r35,0","w":197,"k":{"q":9,"o":9,"g":9,"e":9,"d":9,"c":8,"a":9}},"w":{"d":"262,-191r-59,191r-32,0r-41,-147r-40,147r-32,0r-58,-191r34,0r40,146r38,-146r37,0r38,146r41,-146r34,0","w":285,"k":{"a":8}},"x":{"d":"175,0r-39,0r-50,-74r-49,74r-37,0r67,-98r-64,-93r38,0r46,68r47,-68r37,0r-64,92","w":198,"k":{"s":10,"q":18,"o":18,"g":19,"e":18,"d":18,"c":18}},"y":{"d":"25,39v30,6,38,-3,46,-32r-71,-198r36,0r53,155r53,-155r35,0r-76,213v-11,33,-35,59,-76,47r0,-30","w":199,"k":{"q":18,"o":9,"g":13,"e":10,"d":10,"c":9,"a":10}},"z":{"d":"159,0r-159,0r0,-26r112,-137r-107,0r0,-28r149,0r0,26r-112,137r117,0r0,28","w":180},"{":{"d":"82,-37v-2,51,-7,85,43,84r0,27v-50,-2,-76,-13,-76,-62v0,-49,8,-99,-49,-93r0,-27v106,12,-12,-167,125,-155r0,26v-87,-11,-7,131,-79,142v25,9,37,24,36,58","w":149},"|":{"d":"116,-120r-27,0r0,-136r27,0r0,136xm116,63r-27,0r0,-136r27,0r0,136"},"}":{"d":"76,-201v0,48,-9,100,49,93r0,27v-108,-14,17,168,-125,155r0,-27v49,6,43,-40,43,-84v0,-35,10,-48,36,-58v-38,-9,-38,-52,-35,-98v2,-34,-12,-43,-44,-44r0,-26v50,2,76,13,76,62","w":149},"~":{"d":"154,-198v25,-2,36,-21,35,-50r27,0v0,44,-21,76,-62,76v-29,6,-68,-50,-92,-50v-25,0,-36,23,-35,50r-27,0v0,-44,21,-77,62,-76v29,-6,67,52,92,50","w":241},"\u00a0":{"w":97}}});


/*
---

name: Moderna.Bold

description: MgOpen Moderna Bold built with [Cufón](http://wiki.github.com/sorccu/cufon/about)

provides: Moderna.Bold

requires: ART.Font

...
*/

/*!
 * The following copyright notice may not be removed under any circumstances.
 * 
 * Copyright:
 * Copyright (c) Magenta ltd, 2004.
 * 
 * Manufacturer:
 * Magenta ltd
 * 
 * Vendor URL:
 * http://www.magenta.gr
 * 
 * License information:
 * http://www.ellak.gr/fonts/MgOpen/license.html
 */

ART.registerFont({"w":214,"face":{"font-family":"Moderna","font-weight":700,"font-stretch":"normal","units-per-em":"360","panose-1":"2 11 8 3 0 2 0 2 0 4","ascent":"288","descent":"-72","x-height":"6","bbox":"-12 -283 335 86","underline-thickness":"18","underline-position":"-27","unicode-range":"U+0020-U+007E"},"glyphs":{" ":{"w":97},"!":{"d":"14,-73v-7,-61,-17,-118,-14,-189r54,0v2,66,-3,125,-13,189r-27,0xm54,0r-53,0r0,-53r53,0r0,53","w":79},"\"":{"d":"93,-157r-35,0r0,-99r35,0r0,99xm34,-157r-34,0r0,-99r34,0r0,99","w":117},"#":{"d":"264,-187r-13,36r-50,0r-15,43r52,0r-13,36r-52,0r-26,73r-40,0r27,-73r-44,0r-26,73r-40,0r27,-73r-51,0r13,-36r51,0r15,-43r-53,0r13,-36r53,0r26,-74r39,0r-26,74r44,0r26,-74r39,0r-26,74r50,0xm163,-151r-45,0r-16,43r45,0","w":289},"$":{"d":"3,-181v0,-43,30,-75,77,-73r0,-23r22,0r0,23v47,0,72,30,75,75r-48,0v-2,-20,-10,-33,-27,-36r0,65v52,15,81,27,81,83v0,42,-36,74,-81,73r0,34r-22,0r0,-34v-52,-6,-79,-29,-80,-84r48,0v2,25,11,39,32,45r0,-74v-46,-5,-76,-27,-77,-74xm80,-215v-25,-3,-36,32,-22,49v4,4,12,8,22,11r0,-60xm102,-33v18,-3,29,-14,29,-34v0,-17,-10,-27,-29,-33r0,67","w":207},"%":{"d":"158,-59v-1,-38,27,-67,65,-67v37,0,65,29,65,67v0,38,-27,67,-65,67v-39,0,-65,-29,-65,-67xm196,-59v0,16,10,28,27,28v17,0,27,-14,28,-28v0,-16,-11,-27,-28,-27v-16,0,-27,13,-27,27xm234,-255r-152,262r-29,0r153,-262r28,0xm0,-189v0,-38,28,-66,65,-66v38,0,64,28,64,66v0,38,-27,67,-65,67v-37,0,-64,-29,-64,-67xm93,-189v0,-15,-11,-28,-28,-28v-17,0,-29,14,-29,29v1,15,12,27,28,27v17,0,29,-14,29,-28","w":314},"&":{"d":"165,-204v-1,33,-19,46,-44,64r38,47v7,-14,11,-29,13,-44r47,0v-4,29,-14,55,-31,79r48,58r-61,0r-18,-22v-29,23,-56,34,-81,34v-41,0,-76,-42,-76,-83v0,-39,25,-59,57,-76v-14,-18,-25,-29,-26,-52v-1,-37,30,-63,68,-63v37,0,67,24,66,58xm96,-171v21,-7,37,-52,3,-54v-32,2,-21,41,-3,54xm51,-74v0,40,57,52,79,19r-48,-59v-21,13,-31,27,-31,40","w":261},"'":{"d":"50,-262v4,51,-4,96,-50,100r0,-19v18,-5,26,-16,26,-34r-26,0r0,-47r50,0","w":74},"(":{"d":"101,-262v-63,85,-64,253,0,338r-38,0v-34,-47,-63,-100,-63,-169v0,-68,28,-122,63,-169r38,0","w":126},")":{"d":"38,-262v33,47,63,100,63,169v0,68,-28,122,-63,169r-38,0v27,-46,49,-102,49,-169v0,-68,-22,-120,-49,-169r38,0","w":126},"*":{"d":"185,-192r-51,13r35,43r-31,22r-31,-45r-31,45r-31,-22r35,-43r-50,-13r11,-36r48,16r0,-50r36,0r0,50r47,-16"},"+":{"d":"203,-91r-78,0r0,91r-36,0r0,-91r-78,0r0,-36r78,0r0,-91r36,0r0,91r78,0r0,36"},",":{"d":"53,-53v-1,36,6,73,-14,92v-10,11,-23,19,-39,23r0,-21v18,-8,29,-16,29,-41r-29,0r0,-53r53,0","w":78},"-":{"d":"107,-72r-100,0r0,-49r100,0r0,49","w":136},".":{"d":"53,0r-53,0r0,-54r53,0r0,54","w":78},"\/":{"d":"164,-270r-89,303r-24,0r88,-303r25,0"},"0":{"d":"202,-123v0,66,-34,129,-94,129v-61,0,-95,-63,-95,-129v0,-68,34,-132,95,-132v60,0,94,66,94,132xm108,-213v-54,11,-57,167,0,177v54,-10,54,-167,0,-177"},"1":{"d":"51,-210v45,0,63,-9,71,-45r41,0r0,255r-50,0r0,-175r-62,0r0,-35"},"2":{"d":"108,-256v47,0,90,34,90,79v0,77,-88,84,-118,133r115,0r0,44r-178,0v12,-73,24,-72,95,-125v23,-17,34,-33,34,-50v0,-22,-19,-38,-38,-38v-26,1,-39,22,-40,49r-47,0v-1,-54,35,-92,87,-92"},"3":{"d":"159,-135v22,11,38,29,40,60v4,72,-102,110,-155,62v-18,-16,-28,-37,-28,-65r49,0v-1,26,16,44,40,44v23,0,41,-16,41,-39v0,-29,-23,-40,-57,-39r0,-35v56,9,65,-68,14,-68v-21,0,-35,17,-34,41r-48,0v-1,-50,37,-82,86,-82v43,-1,85,28,83,70v-1,26,-14,38,-31,51"},"4":{"d":"201,-55r-30,0r0,55r-49,0r0,-55r-108,0r0,-45r94,-148r63,0r0,152r30,0r0,41xm123,-94r0,-110r-70,110r70,0"},"5":{"d":"71,-154v50,-40,128,13,128,71v0,75,-100,118,-158,72v-17,-14,-26,-33,-26,-57r51,0v-1,22,18,35,38,35v25,0,43,-20,43,-47v0,-41,-55,-62,-76,-29r-47,-2r17,-137r147,0r0,43r-111,0"},"6":{"d":"15,-118v0,-97,78,-175,155,-119v16,11,23,28,23,47r-52,0v-5,-27,-43,-34,-59,-9v-8,13,-14,28,-14,51v51,-42,135,-2,132,66v-2,51,-39,91,-91,90v-65,-1,-94,-55,-94,-126xm69,-81v0,25,17,48,42,48v24,0,39,-21,39,-45v0,-25,-18,-46,-42,-46v-24,0,-39,19,-39,43"},"7":{"d":"53,0v11,-94,38,-137,89,-204r-125,0r0,-44r181,0r0,38v-51,59,-80,117,-92,210r-53,0"},"8":{"d":"107,-256v70,0,119,88,55,122v21,11,37,31,37,60v1,46,-43,82,-91,82v-52,0,-93,-31,-93,-79v0,-31,15,-51,38,-63v-18,-12,-30,-27,-31,-52v0,-39,41,-70,85,-70xm71,-183v0,18,15,30,36,30v20,0,36,-12,36,-30v0,-19,-15,-32,-36,-32v-20,0,-36,13,-36,32xm68,-73v0,21,15,38,39,38v24,0,39,-14,39,-37v0,-22,-16,-42,-39,-41v-22,0,-40,16,-39,40"},"9":{"d":"106,-255v66,0,93,55,93,127v0,96,-73,173,-150,119v-16,-11,-24,-29,-27,-49r51,0v3,25,45,35,60,11v8,-13,13,-29,13,-53v-49,42,-131,3,-131,-67v0,-52,38,-88,91,-88xm67,-168v0,25,16,45,41,45v24,0,37,-17,37,-41v0,-26,-17,-50,-41,-50v-23,0,-38,23,-37,46"},":":{"d":"54,-137r-54,0r0,-53r54,0r0,53xm54,0r-54,0r0,-54r54,0r0,54","w":78},";":{"d":"54,-137r-54,0r0,-53r54,0r0,53xm54,-54v4,59,-2,107,-54,116r0,-21v21,-8,29,-16,30,-41r-30,0r0,-54r54,0","w":79},"<":{"d":"205,-5r-196,-86r0,-35r196,-87r0,39r-145,65r145,65r0,39"},"=":{"d":"207,-130r-199,0r0,-35r199,0r0,35xm207,-53r-199,0r0,-35r199,0r0,35"},">":{"d":"205,-91r-196,86r0,-39r145,-65r-145,-65r0,-39r196,87r0,35"},"?":{"d":"91,-270v67,0,115,74,70,124v-17,19,-49,36,-48,70r-48,0r0,-26v-5,-22,63,-64,58,-86v0,-21,-16,-38,-37,-37v-24,0,-35,20,-35,44r-51,0v-1,-52,40,-89,91,-89xm116,0r-53,0r0,-53r53,0r0,53","w":203},"@":{"d":"168,27v40,0,81,-15,107,-33r14,20v-30,23,-72,40,-121,41v-97,2,-167,-57,-168,-149v-1,-97,82,-170,181,-170v86,0,149,50,150,131v1,61,-42,114,-102,114v-29,0,-33,-5,-38,-29v-25,46,-118,35,-111,-32v-7,-67,83,-137,129,-77r9,-18r32,0r-28,113v0,9,9,14,17,14v37,0,60,-45,59,-84v0,-65,-46,-103,-113,-103v-85,0,-154,61,-154,141v0,73,59,123,137,121xm118,-84v0,37,34,50,56,27v17,-18,19,-46,26,-73v0,-13,-16,-24,-31,-24v-30,0,-51,39,-51,70","w":356},"A":{"d":"251,0r-57,0r-18,-54r-102,0r-17,54r-57,0r94,-262r62,0xm162,-98r-37,-112r-37,112r74,0","w":277,"k":{"y":54,"w":41,"v":54,"t":28,"s":12,"q":16,"o":17,"j":8,"g":17,"f":23,"e":17,"d":24,"c":17,"a":8,"Y":74,"W":62,"V":76,"U":17,"T":71,"S":22,"Q":28,"O":28,"J":26,"G":28,"C":28}},"B":{"d":"207,-195v0,26,-13,45,-32,53v22,8,41,34,41,63v0,49,-44,79,-96,79r-120,0r0,-262v88,2,207,-21,207,67xm153,-189v0,-38,-62,-27,-102,-28r0,56v41,-2,102,11,102,-28xm160,-81v0,-44,-63,-34,-109,-35r0,69v45,-1,109,10,109,-34","w":243,"k":{"Y":27,"X":23,"W":17,"V":20,"T":12,"A":16}},"C":{"d":"128,-40v35,-1,57,-22,67,-50r57,0v-10,57,-60,98,-125,98v-74,1,-127,-63,-127,-139v0,-111,120,-179,208,-113v23,17,37,40,42,68r-57,0v-8,-26,-32,-46,-64,-46v-46,-1,-74,42,-74,90v0,48,27,93,73,92","w":270,"k":{"z":10,"y":8,"x":10,"v":8,"Z":15,"Y":36,"X":36,"W":21,"V":26,"T":20,"J":9,"A":27}},"D":{"d":"224,-136v0,79,-57,136,-136,136r-88,0r0,-262r104,0v71,-2,120,56,120,126xm170,-131v0,-44,-26,-87,-67,-86r-50,0r0,170v72,8,117,-18,117,-84","w":250,"k":{"x":8,"Z":22,"Y":38,"X":40,"W":22,"V":27,"T":23,"J":10,"A":31}},"E":{"d":"197,0r-197,0r0,-262r190,0r0,45r-137,0r0,56r126,0r0,45r-126,0r0,68r144,0r0,48","w":213,"k":{"y":22,"w":18,"v":22,"t":10,"f":9,"T":8,"Q":9,"O":9,"J":8,"G":8,"C":9}},"F":{"d":"183,-217r-130,0r0,60r114,0r0,45r-114,0r0,112r-53,0r0,-262r183,0r0,45","w":201,"k":{"z":22,"y":28,"x":39,"w":25,"v":28,"u":12,"t":21,"s":21,"r":12,"q":14,"p":12,"o":15,"n":12,"m":12,"g":15,"f":23,"e":15,"d":17,"c":15,"a":21,"T":8,"S":9,"Q":12,"O":12,"J":101,"G":12,"C":12,"A":48}},"G":{"d":"55,-131v0,67,65,119,118,75v12,-11,20,-25,24,-41r-55,0r0,-45r110,0r0,142r-37,0r-6,-31v-23,25,-52,39,-85,39v-74,1,-124,-64,-124,-140v0,-109,116,-177,205,-114v23,16,37,37,44,65r-58,0v-8,-22,-32,-41,-61,-41v-47,0,-75,44,-75,91","w":273,"k":{"Y":31,"W":16,"V":21,"T":15}},"H":{"d":"217,0r-54,0r0,-117r-109,0r0,117r-54,0r0,-262r54,0r0,97r109,0r0,-97r54,0r0,262","w":246},"I":{"d":"65,0r-54,0r0,-262r54,0r0,262","w":94},"J":{"d":"83,-37v24,-1,31,-17,31,-43r0,-182r54,0r0,186v-1,59,-24,84,-83,84v-66,0,-85,-34,-85,-105r52,0v-3,31,1,62,31,60","w":196,"k":{"A":12}},"K":{"d":"233,0r-65,0r-86,-120r-28,28r0,92r-54,0r0,-262r54,0r0,108r103,-108r67,0r-104,106","w":258,"k":{"y":58,"w":45,"v":58,"u":15,"t":32,"s":24,"q":28,"o":32,"j":8,"g":31,"f":23,"e":31,"d":32,"c":32,"a":17,"Y":15,"W":11,"V":13,"T":16,"S":33,"Q":43,"O":44,"J":33,"G":43,"C":44}},"L":{"d":"183,0r-183,0r0,-262r54,0r0,214r129,0r0,48","w":197,"k":{"y":42,"w":32,"v":42,"t":21,"j":8,"f":23,"d":11,"Y":74,"W":52,"V":63,"T":71,"S":9,"Q":17,"O":18,"J":14,"G":17,"C":18}},"M":{"d":"264,0r-51,0r0,-212r-53,212r-56,0r-54,-212r0,212r-50,0r0,-262r80,0r52,199r52,-199r80,0r0,262","w":294},"N":{"d":"216,0r-56,0r-107,-180r0,180r-53,0r0,-262r56,0r107,180r0,-180r53,0r0,262","w":245},"O":{"d":"258,-131v0,78,-53,139,-129,139v-76,0,-129,-62,-129,-139v0,-78,53,-139,129,-139v76,0,129,62,129,139xm55,-131v0,48,28,91,74,91v45,0,73,-43,73,-91v0,-48,-28,-91,-73,-91v-48,0,-74,43,-74,91","w":283,"k":{"Z":17,"Y":37,"X":37,"W":21,"V":26,"T":21,"J":8,"A":27}},"P":{"d":"200,-177v0,46,-31,83,-79,83r-67,0r0,94r-54,0r0,-262r117,0v49,-1,83,36,83,85xm148,-177v0,-43,-48,-42,-94,-40r0,76v43,0,94,7,94,-36","w":217,"k":{"d":8,"Y":24,"X":24,"W":12,"V":16,"T":8,"J":39,"A":43}},"Q":{"d":"129,-270v113,0,166,148,100,230r29,28r-29,30r-32,-29v-87,54,-197,-15,-197,-120v0,-78,53,-139,129,-139xm54,-130v0,59,45,107,105,83r-27,-28r29,-30r28,28v30,-52,7,-145,-58,-145v-47,0,-77,44,-77,92","w":284,"k":{"Y":36,"W":20,"V":25,"T":21}},"R":{"d":"206,-60v1,21,-2,44,11,52r0,8r-59,0v-20,-30,13,-111,-47,-102r-57,0r0,102r-54,0r0,-262r127,0v48,-2,85,26,85,72v0,30,-16,56,-40,64v27,10,34,27,34,66xm159,-183v0,-46,-61,-32,-105,-34r0,69v45,-1,104,9,105,-35","w":245,"k":{"d":10,"Y":26,"W":15,"V":19,"T":10,"J":16}},"S":{"d":"153,-185v0,-46,-92,-55,-96,-8v-11,35,119,47,116,52v27,12,41,32,41,61v0,83,-117,112,-178,65v-21,-17,-34,-39,-36,-67r54,0v0,49,103,60,108,9v11,-35,-118,-49,-116,-53v-27,-12,-41,-32,-41,-60v0,-79,113,-107,169,-62v21,16,31,37,31,63r-52,0","w":237,"k":{"Y":30,"X":22,"W":18,"V":22,"T":14,"A":15}},"T":{"d":"210,-215r-78,0r0,215r-55,0r0,-215r-77,0r0,-47r210,0r0,47","w":231,"k":{"z":36,"y":32,"x":33,"w":30,"v":31,"u":25,"t":18,"s":45,"r":25,"q":44,"p":25,"o":45,"n":25,"m":25,"g":45,"f":20,"e":46,"d":48,"c":46,"a":45,"T":8,"S":9,"Q":18,"O":18,"J":72,"G":17,"C":18,"A":66}},"U":{"d":"106,-40v32,0,51,-26,50,-60r0,-162r55,0r0,168v1,59,-47,102,-106,102v-59,0,-105,-43,-105,-102r0,-168r54,0r0,162v-1,34,21,60,52,60","w":240,"k":{"A":20}},"V":{"d":"232,-262r-89,262r-53,0r-90,-262r60,0r56,196r57,-196r59,0","w":258,"k":{"z":27,"y":22,"x":24,"w":21,"v":22,"u":16,"t":18,"s":37,"r":16,"q":37,"p":16,"o":39,"n":16,"m":15,"g":38,"f":18,"e":40,"d":41,"c":39,"a":37,"T":8,"S":21,"Q":26,"O":26,"J":54,"G":26,"C":26,"A":75}},"W":{"d":"335,-262r-75,262r-52,0r-41,-201r-40,201r-52,0r-75,-262r56,0r45,185r38,-185r57,0r38,185r45,-185r56,0","w":362,"k":{"z":23,"y":19,"x":21,"w":17,"v":19,"u":13,"t":15,"s":32,"r":12,"q":32,"p":12,"o":33,"n":12,"m":12,"g":32,"f":15,"e":34,"d":36,"c":33,"a":32,"T":8,"S":19,"Q":23,"O":23,"J":47,"G":22,"C":23,"A":63}},"X":{"d":"232,0r-62,0r-54,-91r-54,91r-62,0r82,-134r-82,-128r62,0r54,91r53,-91r63,0r-82,127","w":258,"k":{"y":37,"w":36,"v":37,"u":13,"t":28,"s":21,"q":25,"o":28,"g":28,"f":22,"e":28,"d":29,"c":28,"a":14,"T":8,"S":29,"Q":39,"O":39,"J":30,"G":38,"C":39}},"Y":{"d":"217,-262r-79,164r0,98r-54,0r0,-98r-84,-164r54,0r57,113r51,-113r55,0","w":241,"k":{"z":34,"y":30,"x":31,"w":28,"v":30,"u":23,"t":25,"s":48,"r":23,"q":49,"p":23,"o":52,"n":23,"m":23,"g":50,"f":25,"e":53,"d":53,"c":52,"a":48,"T":8,"S":25,"Q":33,"O":33,"J":72,"G":33,"C":33,"A":67}},"Z":{"d":"208,-217r-143,170r141,0r0,47r-206,0r0,-46r143,-169r-140,0r0,-47r205,0r0,45","w":234,"k":{"y":18,"w":17,"v":18,"t":14,"q":9,"o":11,"g":10,"f":14,"e":10,"d":12,"c":11,"T":8,"S":9,"Q":17,"O":17,"J":15,"G":16,"C":17}},"[":{"d":"90,78r-90,0r0,-340r90,0r0,38r-41,0r0,264r41,0r0,38","w":115},"\\":{"d":"113,33r-24,0r-89,-303r24,0","w":137},"]":{"d":"90,78r-90,0r0,-38r42,0r0,-264r-42,0r0,-38r90,0r0,340","w":115},"^":{"d":"163,-217r-24,0r-32,-39r-31,39r-25,0r35,-66r42,0"},"_":{"d":"199,86r-183,0r0,-37r183,0r0,37"},"`":{"d":"49,-170r-49,0v-4,-50,3,-96,49,-100r0,19v-18,6,-25,12,-26,34r26,0r0,47","w":74},"a":{"d":"170,-36v-2,17,11,21,11,36r-54,0v-3,-8,-5,-16,-6,-24v-24,47,-127,39,-121,-29v4,-51,28,-58,89,-64v21,-3,31,-9,31,-18v-3,-32,-67,-31,-64,5r-49,0v0,-44,32,-71,78,-71v40,0,85,22,85,57r0,108xm77,-33v31,0,49,-25,44,-62v-32,9,-71,12,-71,39v0,14,12,23,27,23","w":203,"k":{"y":9,"v":8}},"b":{"d":"187,-97v0,53,-29,104,-79,103v-28,0,-46,-14,-58,-32r0,26r-50,0r0,-262r50,0r0,92v11,-18,31,-30,58,-31v50,-1,79,51,79,104xm136,-97v0,-30,-15,-59,-42,-59v-28,-1,-44,30,-44,60v0,29,16,58,43,58v27,0,43,-29,43,-59","w":213,"k":{"y":12,"x":18,"v":10}},"c":{"d":"98,-36v22,-1,38,-18,43,-37r54,0v-8,44,-44,79,-95,79v-57,0,-100,-43,-100,-101v0,-85,94,-137,160,-86v17,13,29,31,35,55r-56,0v-20,-60,-86,-25,-86,28v0,32,16,62,45,62","k":{"y":11,"x":20,"v":10}},"d":{"d":"79,-201v27,1,47,13,58,31r0,-92r50,0r0,262r-49,0r0,-26v-14,22,-34,32,-59,32v-51,1,-79,-50,-79,-103v0,-53,28,-105,79,-104xm137,-96v0,-30,-16,-60,-43,-60v-27,0,-43,29,-43,59v0,30,15,60,42,60v27,0,44,-29,44,-59","w":216},"e":{"d":"0,-96v0,-65,32,-110,93,-110v68,0,91,48,91,123r-130,0v-5,46,58,65,75,24r52,0v-10,37,-41,66,-87,66v-56,0,-94,-45,-94,-103xm130,-117v5,-39,-42,-54,-66,-31v-7,7,-10,18,-10,31r76,0","w":209,"k":{"y":14,"x":17,"w":9,"v":13}},"f":{"d":"111,-222v-23,-1,-38,0,-33,28r33,0r0,36r-33,0r0,158r-50,0r0,-158r-28,0r0,-36r28,0v-4,-62,25,-74,83,-69r0,41","w":136},"g":{"d":"0,-98v0,-54,31,-104,82,-103v24,0,43,11,56,31r0,-24r50,0r0,181v-1,67,-27,91,-95,92v-47,1,-83,-20,-87,-60r57,0v4,13,16,18,32,18v39,1,43,-23,42,-64v-11,17,-28,26,-54,27v-51,1,-83,-45,-83,-98xm52,-100v0,29,16,57,43,57v26,0,42,-27,42,-56v1,-29,-16,-57,-43,-57v-27,0,-42,27,-42,56","w":217},"h":{"d":"111,-200v83,1,61,117,63,200r-52,0r0,-101v0,-28,-7,-56,-30,-56v-59,0,-36,96,-40,157r-52,0r0,-262r52,0r0,90v14,-16,33,-28,59,-28","w":202},"i":{"d":"55,-215r-51,0r0,-47r51,0r0,47xm55,0r-51,0r0,-194r51,0r0,194","w":84},"j":{"d":"63,-215r-52,0r0,-47r52,0r0,47xm-12,36v14,0,23,-1,23,-14r0,-216r52,0r0,225v1,42,-33,52,-75,48r0,-43","w":93},"k":{"d":"179,0r-62,0r-47,-82r-19,20r0,62r-51,0r0,-262r51,0r0,137r61,-69r63,0r-68,72","w":199,"k":{"s":9,"q":13,"o":16,"g":15,"e":15,"d":23,"c":16}},"l":{"d":"62,0r-51,0r0,-262r51,0r0,262","w":93},"m":{"d":"157,-171v26,-51,119,-30,119,35r0,136r-51,0r0,-125v0,-15,-12,-30,-28,-29v-58,3,-26,99,-34,154r-51,0r0,-125v0,-17,-10,-30,-28,-29v-56,5,-26,99,-33,154r-51,0r0,-194r49,0r0,22v20,-37,88,-36,108,1","w":304},"n":{"d":"108,-201v40,-1,67,30,66,69r0,132r-52,0r0,-117v1,-22,-11,-40,-31,-39v-59,4,-34,97,-39,156r-52,0r0,-194r50,0r0,23v11,-17,32,-30,58,-30","w":202},"o":{"d":"198,-96v0,59,-40,102,-99,102v-58,0,-99,-43,-99,-102v0,-59,40,-105,99,-105v59,0,99,46,99,105xm53,-97v0,31,16,60,45,60v30,1,46,-28,46,-60v0,-32,-16,-60,-46,-60v-30,0,-45,29,-45,60","w":225,"k":{"y":15,"x":23,"w":10,"v":14}},"p":{"d":"187,-98v0,53,-29,105,-79,104v-27,0,-47,-12,-58,-30r0,101r-50,0r0,-271r50,0r0,26v12,-18,31,-33,58,-33v50,0,79,50,79,103xm136,-96v0,-30,-14,-60,-42,-60v-29,0,-44,28,-44,58v0,30,16,61,44,60v26,0,42,-29,42,-58","w":213,"k":{"y":18,"x":18,"v":11}},"q":{"d":"79,-201v26,1,46,15,59,31r0,-24r49,0r0,271r-50,0r0,-102v-14,21,-34,31,-58,31v-49,1,-79,-49,-79,-102v0,-53,29,-107,79,-105xm138,-96v0,-29,-17,-60,-44,-60v-28,0,-43,29,-43,58v-1,30,16,61,42,61v27,0,45,-29,45,-59","w":216},"r":{"d":"112,-146v-39,0,-59,7,-60,43r0,103r-52,0r0,-194r48,0r0,34v13,-24,29,-39,64,-39r0,53","w":132},"s":{"d":"85,-161v-39,3,-35,28,3,38v60,15,84,17,88,64v6,63,-101,86,-148,49v-18,-13,-28,-30,-28,-53r52,0v-3,33,68,42,73,10v2,-21,-85,-32,-88,-37v-20,-10,-31,-26,-31,-48v-2,-60,94,-84,138,-46v15,12,24,28,27,49r-51,0v-1,-17,-17,-28,-35,-26","w":200,"k":{"y":11,"x":11,"v":10}},"t":{"d":"77,-50v0,14,15,13,30,13r0,38v-48,6,-82,0,-82,-54r0,-105r-25,0r0,-36r25,0r0,-53r52,0r0,53r30,0r0,36r-30,0r0,108","w":132},"u":{"d":"82,-38v61,0,35,-96,40,-156r51,0r0,194r-50,0r0,-23v-14,16,-36,28,-63,28v-84,0,-55,-118,-60,-199r51,0v7,55,-23,156,31,156","w":202},"v":{"d":"192,-194r-69,194r-54,0r-69,-194r58,0r39,139r40,-139r55,0","k":{"q":8,"o":9,"g":8,"e":10,"d":8,"c":9,"a":8}},"w":{"d":"274,-194r-54,194r-52,0r-31,-139r-30,139r-52,0r-55,-194r53,0r31,135r27,-135r53,0r28,135r32,-135r50,0","w":298},"x":{"d":"192,0r-61,0r-36,-62r-35,62r-60,0r66,-99r-63,-95r59,0r34,59r34,-59r58,0r-61,94","k":{"s":10,"q":14,"o":18,"g":17,"e":17,"d":14,"c":18}},"y":{"d":"31,28v21,5,41,0,39,-24v-15,-51,-50,-143,-70,-198r57,0r41,140r39,-140r55,0r-77,222v-8,37,-40,49,-84,42r0,-42","k":{"s":7,"q":16,"o":10,"g":12,"e":10,"d":8,"c":10,"a":8}},"z":{"d":"172,0r-172,0r0,-40r107,-113r-101,0r0,-41r162,0r0,42r-104,109r108,0r0,43","w":195},"{":{"d":"54,-95v73,4,-4,140,76,131r0,38v-75,5,-88,-37,-82,-107v3,-33,-15,-41,-48,-43r0,-37v80,10,25,-96,60,-132v12,-13,36,-18,70,-18r0,37v-48,-9,-41,44,-39,78v2,32,-12,44,-37,53","w":155},"|":{"d":"37,-120r-37,0r0,-135r37,0r0,135xm37,63r-37,0r0,-136r37,0r0,136","w":62},"}":{"d":"85,-202v0,49,-12,93,45,89r0,37v-80,-10,-23,95,-59,131v-12,13,-37,19,-71,19r0,-38v46,4,38,-38,38,-77v0,-32,12,-45,38,-54v-40,-7,-39,-50,-36,-95v2,-27,-12,-36,-40,-36r0,-37v56,2,85,10,85,61","w":154},"~":{"d":"155,-205v23,0,30,-20,30,-46r36,0v0,47,-21,80,-65,81v-27,6,-69,-45,-89,-45v-24,0,-31,20,-31,45r-36,0v-1,-46,22,-81,65,-81v26,-5,70,47,90,46","w":245},"\u00a0":{"w":97}}});


/*
---
name: Slick.Parser
description: Standalone CSS3 Selector parser
provides: Slick.Parser
...
*/

(function(){
	
var exports = this;
	
var parsed,
	separatorIndex,
	combinatorIndex,
	partIndex,
	reversed,
	cache = {},
	reverseCache = {};

var parse = function(expression, isReversed){
	expression = ('' + expression).replace(/^\s+|\s+$/g, '');
	reversed = !!isReversed;
	var currentCache = (reversed) ? reverseCache : cache;
	if (currentCache[expression]) return currentCache[expression];
	parsed = {Slick: true, expressions: [], raw: expression, reverse: function(){
		return parse(this.raw, true);
	}};
	separatorIndex = -1;
	while (expression != (expression = expression.replace(regexp, parser)));
	parsed.length = parsed.expressions.length;
	return currentCache[expression] = (reversed) ? reverse(parsed) : parsed;
};

var reverseCombinator = function(combinator){
	if (combinator === '!') return ' ';
	else if (combinator === ' ') return '!';
	else if ((/^!/).test(combinator)) return combinator.replace(/^(!)/, '');
	else return '!' + combinator;
};

var reverse = function(expression){
	var expressions = expression.expressions;
	for (var i = 0; i < expressions.length; i++){
		var exp = expressions[i];
		var last = {parts: [], tag: '*', combinator: reverseCombinator(exp[0].combinator)};
		
		for (var j = 0; j < exp.length; j++){
			var cexp = exp[j];
			if (!cexp.reverseCombinator) cexp.reverseCombinator = ' ';
			cexp.combinator = cexp.reverseCombinator;
			delete cexp.reverseCombinator;
		}
		
		exp.reverse().push(last);
	}
	return expression;
};

var escapeRegExp = function(string){// Credit: XRegExp 0.6.1 (c) 2007-2008 Steven Levithan <http://stevenlevithan.com/regex/xregexp/> MIT License
	return string.replace(/[-[\]{}()*+?.\\^$|,#\s]/g, "\\$&");
};

var regexp = new RegExp(
/*
#!/usr/bin/env ruby
puts "\t\t" + DATA.read.gsub(/\(\?x\)|\s+#.*$|\s+|\\$|\\n/,'')
__END__
	"(?x)^(?:\
	  \\s* ( , ) \\s*               # Separator          \n\
	| \\s* ( <combinator>+ ) \\s*   # Combinator         \n\
	|      ( \\s+ )                 # CombinatorChildren \n\
	|      ( <unicode>+ | \\* )     # Tag                \n\
	| \\#  ( <unicode>+       )     # ID                 \n\
	| \\.  ( <unicode>+       )     # ClassName          \n\
	|                               # Attribute          \n\
	\\[  \
		\\s* (<unicode1>+)  (?:  \
			\\s* ([*^$!~|]?=)  (?:  \
				\\s* (?:\
					([\"']?)(.*?)\\9 \
				)\
			)  \
		)?  \\s*  \
	\\](?!\\]) \n\
	|   :+ ( <unicode>+ )(?:\
	\\( (?:\
		 ([\"']?)((?:\\([^\\)]+\\)|[^\\(\\)]*)+)\\12\
	) \\)\
	)?\
	)"
*/
	"^(?:\\s*(,)\\s*|\\s*(<combinator>+)\\s*|(\\s+)|(<unicode>+|\\*)|\\#(<unicode>+)|\\.(<unicode>+)|\\[\\s*(<unicode1>+)(?:\\s*([*^$!~|]?=)(?:\\s*(?:([\"']?)(.*?)\\9)))?\\s*\\](?!\\])|:+(<unicode>+)(?:\\((?:([\"']?)((?:\\([^\\)]+\\)|[^\\(\\)]*)+)\\12)\\))?)"
	//"^(?:\\s*(,)\\s*|\\s*(<combinator>+)\\s*|(\\s+)|(<unicode>+|\\*)|\\#(<unicode>+)|\\.(<unicode>+)|\\[\\s*(<unicode1>+)(?:\\s*([*^$!~|]?=)(?:\\s*(?:\"((?:[^\"]|\\\\\")*)\"|'((?:[^']|\\\\')*)'|([^\\]]*?))))?\\s*\\](?!\\])|:+(<unicode>+)(?:\\((?:\"((?:[^\"]|\\\")*)\"|'((?:[^']|\\')*)'|([^\\)]*))\\))?)"//*/
	.replace(/<combinator>/, '[' + escapeRegExp(">+~`!@$%^&={}\\;</") + ']')
	.replace(/<unicode>/g, '(?:[\\w\\u00a1-\\uFFFF-]|\\\\[^\\s0-9a-f])')
	.replace(/<unicode1>/g, '(?:[:\\w\\u00a1-\\uFFFF-]|\\\\[^\\s0-9a-f])')
);

function parser(
	rawMatch,
	
	separator,
	combinator,
	combinatorChildren,
	
	tagName,
	id,
	className,
	
	attributeKey,
	attributeOperator,
	attributeQuote,
	attributeValue,
	
	pseudoClass,
	pseudoQuote,
	pseudoClassValue
){
	if (separator || separatorIndex === -1){
		parsed.expressions[++separatorIndex] = [];
		combinatorIndex = -1;
		if (separator) return '';
	}
	
	if (combinator || combinatorChildren || combinatorIndex === -1){
		combinator = combinator || ' ';
		var currentSeparator = parsed.expressions[separatorIndex];
		if (reversed && currentSeparator[combinatorIndex])
			currentSeparator[combinatorIndex].reverseCombinator = reverseCombinator(combinator);
		currentSeparator[++combinatorIndex] = {combinator: combinator, tag: '*', parts: []};
		partIndex = 0;
	}
	
	var currentParsed = parsed.expressions[separatorIndex][combinatorIndex];

	if (tagName){
		currentParsed.tag = tagName.replace(/\\/g,'');
		return '';
	} else if (id){
		currentParsed.id = id.replace(/\\/g,'');
		return '';
	} else if (className){
		className = className.replace(/\\/g,'');
	
		if (!currentParsed.classes) currentParsed.classes = [className];
		else currentParsed.classes.push(className);
	
		currentParsed.parts[partIndex] = {
			type: 'class',
			value: className,
			regexp: new RegExp('(^|\\s)' + escapeRegExp(className) + '(\\s|$)')
		};
		partIndex++;
		
	} else if (pseudoClass){
		if (!currentParsed.pseudos) currentParsed.pseudos = [];
		
		var value = pseudoClassValue || null;
		if (value) value = value.replace(/\\/g,'');
		
		currentParsed.pseudos.push(currentParsed.parts[partIndex] = {
			type: 'pseudo',
			key: pseudoClass.replace(/\\/g,''),
			value: value
		});
		partIndex++;
		
	} else if (attributeKey){
		if (!currentParsed.attributes) currentParsed.attributes = [];
		
		var key = attributeKey.replace(/\\/g,'');
		var operator = attributeOperator;
		var attribute = (attributeValue || '').replace(/\\/g,'');
		
		var test, regexp;
		
		switch (operator){
			case '^=' : regexp = new RegExp(       '^'+ escapeRegExp(attribute)            ); break;
			case '$=' : regexp = new RegExp(            escapeRegExp(attribute) +'$'       ); break;
			case '~=' : regexp = new RegExp( '(^|\\s)'+ escapeRegExp(attribute) +'(\\s|$)' ); break;
			case '|=' : regexp = new RegExp(       '^'+ escapeRegExp(attribute) +'(-|$)'   ); break;
			case  '=' : test = function(value){
				return attribute == value;
			}; break;
			case '*=' : test = function(value){
				return value && value.indexOf(attribute) > -1;
			}; break;
			case '!=' : test = function(value){
				return attribute != value;
			}; break;
			default   : test = function(value){
				return !!value;
			};
		}
		
		if (!test) test = function(value){
			return value && regexp.test(value);
		};
		
		currentParsed.attributes.push(currentParsed.parts[partIndex] = {
			type: 'attribute',
			key: key,
			operator: operator,
			value: attribute,
			test: test
		});
		partIndex++;
		
	}
	
	return '';
};

// Slick NS

var Slick = exports.Slick || {};

Slick.parse = function(expression){
	return parse(expression);
};

Slick.escapeRegExp = escapeRegExp;

if (!exports.Slick) exports.Slick = Slick;
	
}).apply((typeof exports != 'undefined') ? exports : this);


/*
---
name: Slick.Finder
description: The new, superfast css selector engine.
provides: Slick.Finder
requires: Slick.Parser
...
*/

(function(){
	
var exports = this;

var local = {};

var timeStamp = +new Date();

// Feature / Bug detection

local.isNativeCode = function(fn){
	return (/\{\s*\[native code\]\s*\}/).test('' + fn);
};

local.isXML = function(document){
	return (!!document.xmlVersion) || (!!document.xml) || (Object.prototype.toString.call(document) === '[object XMLDocument]') ||
	(document.nodeType === 9 && document.documentElement.nodeName !== 'HTML');
};

local.setDocument = function(document){
	
	// convert elements / window arguments to document. if document cannot be extrapolated, the function returns.
	
	if (document.nodeType === 9); // document
	else if (document.ownerDocument) document = document.ownerDocument; // node
	else if (document.navigator) document = document.document; // window
	else return;
	
	// check if it's the old document
	
	if (this.document === document) return;
	this.document = document;
	var root = this.root = document.documentElement;
	
	// document sort
	
	this.brokenStarGEBTN
	= this.starSelectsClosedQSA
	= this.idGetsName
	= this.brokenMixedCaseQSA
	= this.brokenGEBCN
	= false;
	
	var starSelectsClosed, starSelectsComments,
		brokenSecondClassNameGEBCN, cachedGetElementsByClassName;
	
	if (!(this.isXMLDocument = this.isXML(document))){
		
		var testNode = document.createElement('div');
		this.root.appendChild(testNode);
		var selected, id;
		
		// IE returns comment nodes for getElementsByTagName('*') for some documents
		testNode.appendChild(document.createComment(''));
		starSelectsComments = (testNode.getElementsByTagName('*').length > 0);
		
		// IE returns closed nodes (EG:"</foo>") for getElementsByTagName('*') for some documents
		try {
			testNode.innerHTML = 'foo</foo>';
			selected = testNode.getElementsByTagName('*');
			starSelectsClosed = (selected && selected.length && selected[0].nodeName.charAt(0) == '/');
		} catch(e){};
		
		this.brokenStarGEBTN = starSelectsComments || starSelectsClosed;
		
		// IE 8 returns closed nodes (EG:"</foo>") for querySelectorAll('*') for some documents
		if (testNode.querySelectorAll) try {
			testNode.innerHTML = 'foo</foo>';
			selected = testNode.querySelectorAll('*');
			this.starSelectsClosedQSA = (selected && selected.length && selected[0].nodeName.charAt(0) == '/');
		} catch(e){};
		
		// IE returns elements with the name instead of just id for getElementById for some documents
		try {
			id = 'idgetsname' + timeStamp;
			testNode.innerHTML = ('<a name='+id+'></a><b id='+id+'></b>');
			this.idGetsName = testNode.ownerDocument.getElementById(id) === testNode.firstChild;
		} catch(e){};
		
		// Safari 3.2 QSA doesnt work with mixedcase on quirksmode
		try {
			testNode.innerHTML = '<a class="MiXedCaSe"></a>';
			this.brokenMixedCaseQSA = !testNode.querySelectorAll('.MiXedCaSe').length;
		} catch(e){};

		try {
			testNode.innerHTML = '<a class="f"></a><a class="b"></a>';
			testNode.getElementsByClassName('b').length;
			testNode.firstChild.className = 'b';
			cachedGetElementsByClassName = (testNode.getElementsByClassName('b').length != 2);
		} catch(e){};
		
		// Opera 9.6 GEBCN doesnt detects the class if its not the first one
		try {
			testNode.innerHTML = '<a class="a"></a><a class="f b a"></a>';
			brokenSecondClassNameGEBCN = (testNode.getElementsByClassName('a').length != 2);
		} catch(e){};
		
		this.brokenGEBCN = cachedGetElementsByClassName || brokenSecondClassNameGEBCN;
		
		this.root.removeChild(testNode);
		testNode = null;
		
	}
	
	// contains
	
	this.contains = (root && this.isNativeCode(root.contains)) ? function(context, node){ // FIXME: Add specs: local.contains should be different for xml and html documents?
		return context.contains(node);
	} : (root && root.compareDocumentPosition) ? function(context, node){
		return context === node || !!(context.compareDocumentPosition(node) & 16);
	} : function(context, node){
		if (node) do {
			if (node === context) return true;
		} while ((node = node.parentNode));
		return false;
	};
	
	// document order sorting
	// credits to Sizzle (http://sizzlejs.com/)
	
	this.documentSorter = (root.compareDocumentPosition) ? function(a, b){
		if (!a.compareDocumentPosition || !b.compareDocumentPosition) return 0;
		return a.compareDocumentPosition(b) & 4 ? -1 : a === b ? 0 : 1;
	} : ('sourceIndex' in root) ? function(a, b){
		if (!a.sourceIndex || !b.sourceIndex) return 0;
		return a.sourceIndex - b.sourceIndex;
	} : (document.createRange) ? function(a, b){
		if (!a.ownerDocument || !b.ownerDocument) return 0;
		var aRange = a.ownerDocument.createRange(), bRange = b.ownerDocument.createRange();
		aRange.setStart(a, 0);
		aRange.setEnd(a, 0);
		bRange.setStart(b, 0);
		bRange.setEnd(b, 0);
		return aRange.compareBoundaryPoints(Range.START_TO_END, bRange);
	} : null ;
	
	this.getUID = (this.isXMLDocument) ? this.getUIDXML : this.getUIDHTML;
	
};
	
// Main Method

local.search = function(context, expression, append, first){
	
	var found = this.found = (first) ? null : (append || []);
	
	// context checks

	if (!context) return found; // No context
	if (context.navigator) context = context.document; // Convert the node from a window to a document
	else if (!context.nodeType) return found; // Reject misc junk input

	// setup
	
	var parsed, i, l;

	this.positions = {};
	var uniques = this.uniques = {};
	
	if (this.document !== (context.ownerDocument || context)) this.setDocument(context);

	// expression checks
	
	if (typeof expression == 'string'){ // expression is a string
		
		// Overrides

		for (i = this.overrides.length; i--;){
			var override = this.overrides[i];
			if (override.regexp.test(expression)){
				var result = override.method.call(context, expression, found, first);
				if (result === false) continue;
				if (result === true) return found;
				return result;
			}
		}
		
		parsed = this.Slick.parse(expression);
		if (!parsed.length) return found;
	} else if (expression == null){ // there is no expression
		return found;
	} else if (expression.Slick){ // expression is a parsed Slick object
		parsed = expression;
	} else if (this.contains(context.documentElement || context, expression)){ // expression is a node
		(found) ? found.push(expression) : found = expression;
		return found;
	} else { // other junk
		return found;
	}
		
	// should sort if there are nodes in append and if you pass multiple expressions.
	// should remove duplicates if append already has items
	var shouldUniques = !!(append && append.length);
	
	// if append is null and there is only a single selector with one expression use pushArray, else use pushUID
	this.push = this.pushUID;
	if (!shouldUniques && (first || (parsed.length == 1 && parsed.expressions[0].length == 1))) this.push = this.pushArray;
	
	if (found == null) found = [];
	
	// avoid duplicating items already in the append array
	if (shouldUniques) for (i = 0, l = found.length; i < l; i++) this.uniques[this.getUID(found[i])] = true;
	
	// default engine
	
	var currentExpression, currentBit;
	var j, m, n;
	var combinator, tag, id, parts, classes, attributes, pseudos;
	var currentItems;
	var expressions = parsed.expressions;
	var lastBit;
	
	search: for (i = 0; (currentExpression = expressions[i]); i++) for (j = 0; (currentBit = currentExpression[j]); j++){

		combinator = 'combinator:' + currentBit.combinator;
		if (!this[combinator]) continue search;
		
		tag        = (this.isXMLDocument) ? currentBit.tag : currentBit.tag.toUpperCase();
		id         = currentBit.id;
		parts      = currentBit.parts;
		classes    = currentBit.classes;
		attributes = currentBit.attributes;
		pseudos    = currentBit.pseudos;
		lastBit    = (j === (currentExpression.length - 1));
	
		this.bitUniques = {};
		
		if (lastBit){
			this.uniques = uniques;
			this.found = found;
		} else {
			this.uniques = {};
			this.found = [];
		}

		if (j === 0){
			this[combinator](context, tag, id, parts, classes, attributes, pseudos);
			if (first && lastBit && found.length) break search;
		} else {
			if (first && lastBit) for (m = 0, n = currentItems.length; m < n; m++){
				this[combinator](currentItems[m], tag, id, parts, classes, attributes, pseudos);
				if (found.length) break search;
			} else for (m = 0, n = currentItems.length; m < n; m++) this[combinator](currentItems[m], tag, id, parts, classes, attributes, pseudos);
		}
		
		currentItems = this.found;
	}
	
	if (shouldUniques || (parsed.expressions.length > 1)) this.sort(found);
	
	return (first) ? (found[0] || null) : found;
};

// Utils

local.uidx = 1;
local.uidk = 'slick:uniqueid';

local.getUIDXML = function(node){
	var uid = node.getAttribute(this.uidk);
	if (!uid){
		uid = this.uidx++;
		node.setAttribute(this.uidk, uid);
	}
	return uid;
};

local.getUIDHTML = function(node){
	return node.uniqueNumber || (node.uniqueNumber = this.uidx++);
};

// sort based on the setDocument documentSorter method.

local.sort = function(results){
	if (!this.documentSorter) return results;
	results.sort(this.documentSorter);
	return results;
};

local.cacheNTH = {};

local.matchNTH = /^([+-]?\d*)?([a-z]+)?([+-]\d+)?$/;

local.parseNTHArgument = function(argument){
	var parsed = argument.match(this.matchNTH);
	if (!parsed) return false;
	var special = parsed[2] || false;
	var a = parsed[1] || 1;
	if (a == '-') a = -1;
	var b = parseInt(parsed[3], 10) || 0;
	switch (special){
		case 'n':    parsed = {a: a, b: b}; break;
		case 'odd':  parsed = {a: 2, b: 1}; break;
		case 'even': parsed = {a: 2, b: 0}; break;
		default:     parsed = {a: 0, b: a};
	}
	return (this.cacheNTH[argument] = parsed);
};

local.pushArray = function(node, tag, id, selector, classes, attributes, pseudos){
	if (this.matchSelector(node, tag, id, selector, classes, attributes, pseudos)) this.found.push(node);
};

local.pushUID = function(node, tag, id, selector, classes, attributes, pseudos){
	var uid = this.getUID(node);
	if (!this.uniques[uid] && this.matchSelector(node, tag, id, selector, classes, attributes, pseudos)){
		this.uniques[uid] = true;
		this.found.push(node);
	}
};

local.matchNode = function(node, selector){
	var parsed = ((selector.Slick) ? selector : this.Slick.parse(selector));
	if (!parsed) return true;
	
	// simple (single) selectors
	if(parsed.length == 1 && parsed.expressions[0].length == 1){
		var exp = parsed.expressions[0][0];
		return this.matchSelector(node, (this.isXMLDocument) ? exp.tag : exp.tag.toUpperCase(), exp.id, exp.parts);
	}

	var nodes = this.search(this.document, parsed);
	for (var i=0, item; item = nodes[i++];){
		if (item === node) return true;
	}
	return false;
};

local.matchPseudo = function(node, name, argument){
	var pseudoName = 'pseudo:' + name;
	if (this[pseudoName]) return this[pseudoName](node, argument);
	var attribute = this.getAttribute(node, name);
	return (argument) ? argument == attribute : !!attribute;
};

local.matchSelector = function(node, tag, id, parts, classes, attributes, pseudos){
	if (tag && tag == '*' && (node.nodeType != 1 || node.nodeName.charCodeAt(0) == 47)) return false; // Fix for comment nodes and closed nodes
	if (tag && tag != '*' && (!node.nodeName || node.nodeName != tag)) return false;
	if (id && node.getAttribute('id') != id) return false;
	if (parts) for (var i = 0, l = parts.length, part, cls; i < l; i++){
		part = parts[i];
		if (!part) continue;
		if (part.type == 'class' && classes !== false){
			cls = ('className' in node) ? node.className : node.getAttribute('class');	
			if (!(cls && part.regexp.test(cls))) return false;
		}
		if (part.type == 'pseudo' && pseudos !== false && (!this.matchPseudo(node, part.key, part.value))) return false;
		if (part.type == 'attribute' && attributes !== false && (!part.test(this.getAttribute(node, part.key)))) return false;
	}
	return true;
};

var combinators = {

	' ': function(node, tag, id, parts, classes, attributes, pseudos){ // all child nodes, any level
		
		var i, l, item, children;

		if (!this.isXMLDocument){
			getById: if (id){
				item = this.document.getElementById(id);
				if ((!item && node.all) || (this.idGetsName && item && item.getAttributeNode('id').nodeValue != id)){
					// all[id] returns all the elements with that name or id inside node
					// if theres just one it will return the element, else it will be a collection
					children = node.all[id];
					if (!children) return;
					if (!children[0]) children = [children];
					for (i = 0; item = children[i++];) if (item.getAttributeNode('id').nodeValue == id){
						this.push(item, tag, null, parts);
						break;
					} 
					return;
				}
				if (!item){
					// if the context is in the dom we return, else we will try GEBTN, breaking the getById label
					if (this.contains(this.document.documentElement, node)) return;
					else break getById;
				} else if (this.document !== node && !this.contains(node, item)) return;
				this.push(item, tag, null, parts);
				return;
			}
			getByClass: if (node.getElementsByClassName && classes && !this.brokenGEBCN){
				children = node.getElementsByClassName(classes.join(' '));
				if (!(children && children.length)) break getByClass;
				for (i = 0, l = children.length; i < l; i++) this.push(children[i], tag, id, parts, false);
				return;
			}
		}
		getByTag: {
			children = node.getElementsByTagName(tag);
			if (!(children && children.length)) break getByTag;
			if (!this.brokenStarGEBTN) tag = null;
			var child;
			for (i = 0; child = children[i++];) this.push(child, tag, id, parts);
		}
	},
	
	'!': function(node, tag, id, parts){  // all parent nodes up to document
		while ((node = node.parentNode)) if (node !== document) this.push(node, tag, id, parts);
	},

	'>': function(node, tag, id, parts){ // direct children
		if ((node = node.firstChild)) do {
			if (node.nodeType === 1) this.push(node, tag, id, parts);
		} while ((node = node.nextSibling));
	},
	
	'!>': function(node, tag, id, parts){ // direct parent (one level)
		node = node.parentNode;
		if (node !== document) this.push(node, tag, id, parts);
	},

	'+': function(node, tag, id, parts){ // next sibling
		while ((node = node.nextSibling)) if (node.nodeType === 1){
			this.push(node, tag, id, parts);
			break;
		}
	},

	'!+': function(node, tag, id, parts){ // previous sibling
		while ((node = node.previousSibling)) if (node.nodeType === 1){
			this.push(node, tag, id, parts);
			break;
		}
	},

	'^': function(node, tag, id, parts){ // first child
		node = node.firstChild;
		if (node){
			if (node.nodeType === 1) this.push(node, tag, id, parts);
			else this['combinator:+'](node, tag, id, parts);
		}
	},

	'!^': function(node, tag, id, parts){ // last child
		node = node.lastChild;
		if (node){
			if (node.nodeType === 1) this.push(node, tag, id, parts);
			else this['combinator:!+'](node, tag, id, parts);
		}
	},

	'~': function(node, tag, id, parts){ // next siblings
		while ((node = node.nextSibling)){
			if (node.nodeType !== 1) continue;
			var uid = this.getUID(node);
			if (this.bitUniques[uid]) break;
			this.bitUniques[uid] = true;
			this.push(node, tag, id, parts);
		}
	},

	'!~': function(node, tag, id, parts){ // previous siblings
		while ((node = node.previousSibling)){
			if (node.nodeType !== 1) continue;
			var uid = this.getUID(node);
			if (this.bitUniques[uid]) break;
			this.bitUniques[uid] = true;
			this.push(node, tag, id, parts);
		}
	},
	
	'++': function(node, tag, id, parts){ // next sibling and previous sibling
		this['combinator:+'](node, tag, id, parts);
		this['combinator:!+'](node, tag, id, parts);
	},

	'~~': function(node, tag, id, parts){ // next siblings and previous siblings
		this['combinator:~'](node, tag, id, parts);
		this['combinator:!~'](node, tag, id, parts);
	}

};

for (var c in combinators) local['combinator:' + c] = combinators[c];

var pseudos = {

	'empty': function(node){
		return !node.firstChild && !(node.innerText || node.textContent || '').length;
	},

	'not': function(node, expression){
		return !this.matchNode(node, expression);
	},

	'contains': function(node, text){
		var inner = node.innerText || node.textContent || '';
		return (inner) ? inner.indexOf(text) > -1 : false;
	},

	'first-child': function(node){
		return this['pseudo:nth-child'](node, '1');
	},

	'last-child': function(node){
		while ((node = node.nextSibling)) if (node.nodeType === 1) return false;
		return true;
	},

	'only-child': function(node){
		var prev = node;
		while ((prev = prev.previousSibling)) if (prev.nodeType === 1) return false;
		var next = node;
		while ((next = next.nextSibling)) if (next.nodeType === 1) return false;
		return true;
	},

	'nth-child': function(node, argument){
		argument = (!argument) ? 'n' : argument;
		var parsed = this.cacheNTH[argument] || this.parseNTHArgument(argument);
		var uid = this.getUID(node);
		if (!this.positions[uid]){
			var count = 1;
			while ((node = node.previousSibling)){
				if (node.nodeType !== 1) continue;
				var puid = this.getUID(node);
				var position = this.positions[puid];
				if (position != null){
					count = position + count;
					break;
				}
				count++;
			}
			this.positions[uid] = count;
		}
		var a = parsed.a, b = parsed.b, pos = this.positions[uid];
		if (a == 0) return b == pos;
		if (a > 0){
			if (pos < b) return false;
		} else {
			if (b < pos) return false;
		}
		return ((pos - b) % a) == 0;
	},

	// custom pseudos

	'index': function(node, index){
		return this['pseudo:nth-child'](node, '' + index + 1);
	},

	'even': function(node, argument){
		return this['pseudo:nth-child'](node, '2n');
	},

	'odd': function(node, argument){
		return this['pseudo:nth-child'](node, '2n+1');
	},

	'enabled': function(node){
		return (node.disabled === false);
	},
	
	'disabled': function(node){
		return (node.disabled === true);
	},

	'checked': function(node){
		return node.checked;
	},

	'selected': function(node){
		return node.selected;
	}
};

for (var p in pseudos) local['pseudo:' + p] = pseudos[p];

// attributes methods

local.attributeGetters = {

	'class': function(){
		return ('className' in this) ? this.className : this.getAttribute('class');
	},
	
	'for': function(){
		return ('htmlFor' in this) ? this.htmlFor : this.getAttribute('for');
	},
	
	'href': function(){
		return ('href' in this) ? this.getAttribute('href', 2) : this.getAttribute('href');
	},
	
	'style': function(){
		return (this.style) ? this.style.cssText : this.getAttribute('style');
	}

};

local.getAttribute = function(node, name){
	// FIXME: check if getAttribute() will get input elements on a form on this browser
	// getAttribute is faster than getAttributeNode().nodeValue
	var method = this.attributeGetters[name];
	if (method) return method.call(node);
	var attributeNode = node.getAttributeNode(name);
	return attributeNode ? attributeNode.nodeValue : null;
};

// overrides

local.overrides = [];

local.override = function(regexp, method){
	this.overrides.push({regexp: regexp, method: method});
};

local.override(/./, function(expression, found, first){ //querySelectorAll override

	if (!this.querySelectorAll || this.nodeType != 9 || local.isXMLDocument || local.brokenMixedCaseQSA || Slick.disableQSA) return false;
	
	var nodes, node;
	try {
		if (first) return this.querySelector(expression) || null;
		else nodes = this.querySelectorAll(expression);
	} catch(error){
		return false;
	}

	var i, hasOthers = !!(found.length);

	if (local.starSelectsClosedQSA) for (i = 0; node = nodes[i++];){
		if (node.nodeName.charCodeAt(0) != 47 && (!hasOthers || !local.uniques[local.getUIDHTML(node)])) found.push(node);
	} else for (i = 0; node = nodes[i++];){
		if (!hasOthers || !local.uniques[local.getUIDHTML(node)]) found.push(node);
	}

	if (hasOthers) local.sort(found);

	return true;

});

local.override(/^[\w-]+$|^\*$/, function(expression, found, first){ // tag override
	var tag = expression;
	if (tag == '*' && local.brokenStarGEBTN) return false;
	
	var nodes = this.getElementsByTagName(tag);
	
	if (first) return nodes[0] || null;
	var i, node, hasOthers = !!(found.length);
	
	for (i = 0; node = nodes[i++];){
		if (!hasOthers || !local.uniques[local.getUID(node)]) found.push(node);
	}
	
	if (hasOthers) local.sort(found);

	return true;
});

local.override(/^\.[\w-]+$/, function(expression, found, first){ // class override
	if (local.isXMLDocument) return false;
	
	var nodes, node, i, hasOthers = !!(found && found.length), className = expression.substring(1);
	if (this.getElementsByClassName && !local.brokenGEBCN){
		nodes = this.getElementsByClassName(className);
		if (first) return nodes[0] || null;
		for (i = 0; node = nodes[i++];){
			if (!hasOthers || !local.uniques[local.getUIDHTML(node)]) found.push(node);
		}
	} else {
		var matchClass = new RegExp('(^|\\s)'+ Slick.escapeRegExp(className) +'(\\s|$)');
		nodes = this.getElementsByTagName('*');
		for (i = 0; node = nodes[i++];){
			if (!node.className || !matchClass.test(node.className)) continue;
			if (first) return node;
			if (!hasOthers || !local.uniques[local.getUIDHTML(node)]) found.push(node);
		}
	}
	if (hasOthers) local.sort(found);
	return (first) ? null : true;
});

local.override(/^#[\w-]+$/, function(expression, found, first){ // ID override
	if (local.isXMLDocument || this.nodeType != 9) return false;
	
	var id = expression.substring(1), el = this.getElementById(id);
	if (!el) return found;
	if (local.idGetsName && el.getAttributeNode('id').nodeValue != id) return false;
	if (first) return el || null;
	var hasOthers = !!(found.length) ;
	if (!hasOthers || !local.uniques[local.getUIDHTML(el)]) found.push(el);
	if (hasOthers) local.sort(found);
	return true;
});

if (typeof document != 'undefined') local.setDocument(document);

// Slick

var Slick = local.Slick = exports.Slick || {};

Slick.version = '0.9dev';

// Slick finder

Slick.search = function(context, expression, append){
	return local.search(context, expression, append);
};

Slick.find = function(context, expression){
	return local.search(context, expression, null, true);
};

// Slick containment checker

Slick.contains = function(container, node){
	local.setDocument(container);
	return local.contains(container, node);
};

// Slick attribute getter

Slick.getAttribute = function(node, name){
	return local.getAttribute(node, name);
};

// Slick matcher

Slick.match = function(node, selector){
	if (!(node && selector)) return false;
	if (!selector || selector === node) return true;
	if (typeof selector != 'string') return false;
	local.setDocument(node);
	return local.matchNode(node, selector);
};

// Slick attribute accessor

Slick.defineAttributeGetter = function(name, fn){
	local.attributeGetters[name] = fn;
	return this;
};

Slick.lookupAttributeGetter = function(name){
	return local.attributeGetters[name];
};

// Slick pseudo accessor

Slick.definePseudo = function(name, fn){
	local['pseudo:' + name] = function(node, argument){
		return fn.call(node, argument);
	};
	return this;
};

Slick.lookupPseudo = function(name){
	var pseudo = local['pseudo:' + name];
	if (pseudo) return function(argument){
		return pseudo.call(this, argument);
	};
	return null;
};

// Slick overrides accessor

Slick.override = function(regexp, fn){
	local.override(regexp, fn);
	return this;
};

// De-duplication of an array of HTML elements.

Slick.uniques = function(nodes, append){
	var uniques = {}, i, node, uid;
	if (!append) append = [];
	for (i = 0; node = append[i++];) uniques[local.getUIDHTML(node)] = true;
	
	for (i = 0; node = nodes[i++];){
		uid = local.getUIDHTML(node);
		if (!uniques[uid]){
			uniques[uid] = true;
			append.push(node);
		}
	}
	return append;
};

Slick.isXML = local.isXML;

// export Slick

if (!exports.Slick) exports.Slick = Slick;
	
}).apply((typeof exports != 'undefined') ? exports : this);


/*
---

name: Touch
description: Class to aid the retrieval of the cursor movements
license: MIT-Style License (http://mootools.net/license.txt)
copyright: Valerio Proietti (http://mad4milk.net)
requires: [Core/MooTools, Core/Array, Core/Function, Core/Number, Core/String, Core/Class, Core/Events, Core/Element]
provides: Touch

...
*/

var Touch = new Class({
	
	Implements: Events,
	
	initialize: function(element){
		this.element = document.id(element);
		
		this.bound = {
			start: this.start.bind(this),
			move: this.move.bind(this),
			end: this.end.bind(this)
		};
		
		if (Browser.Platform.ipod){
			this.context = this.element;
			this.startEvent = 'touchstart';
			this.endEvent = 'touchend';
			this.moveEvent = 'touchmove';
		} else {
			this.context = document;
			this.startEvent = 'mousedown';
			this.endEvent = 'mouseup';
			this.moveEvent = 'mousemove';
		}
		
		this.attach();
	},
	
	// public methods
	
	attach: function(){
		this.element.addListener(this.startEvent, this.bound.start);
	},
	
	detach: function(){
		this.element.removeListener(this.startEvent, this.bound.start);
	},
	
	// protected methods
	
	start: function(event){
		this.preventDefault(event);
		// this prevents the copy-paste dialog to show up when dragging. it only affects mobile safari.
		document.body.style.WebkitUserSelect = 'none';
		
		this.hasDragged = false;
		
		this.context.addListener(this.moveEvent, this.bound.move);
		this.context.addListener(this.endEvent, this.bound.end);
		
		var page = this.getPage(event);
			
		this.startX = page.pageX;
		this.startY = page.pageY;
		
		this.fireEvent('start');
	},
	
	move: function(event){
		this.preventDefault(event);
		
		var page = this.getPage(event);
		
		this.deltaX = page.pageX - this.startX;
		this.deltaY = page.pageY - this.startY;
		
		this.hasDragged = !(this.deltaX === 0 && this.deltaY === 0);
		
		if (this.hasDragged) this.fireEvent('move', [this.deltaX, this.deltaY]);
	},
	
	end: function(event){
		this.preventDefault(event);
		// we re-enable the copy-paste dialog on drag end
		document.body.style.WebkitUserSelect = '';
		
		this.context.removeListener(this.moveEvent, this.bound.move);
		this.context.removeListener(this.endEvent, this.bound.end);

		this.fireEvent((this.hasDragged) ? 'end' : 'cancel');
	},
	
	preventDefault: function(event){
		if (event.preventDefault) event.preventDefault();
		else event.returnValue = false;
	},
	
	getPage: function(event){
		//when on mobile safari, the coordinates information is inside the targetTouches object
		if (event.targetTouches) event = event.targetTouches[0];
		if (event.pageX != null && event.pageY != null) return {pageX: event.pageX, pageY: event.pageY};
		var element = (!document.compatMode || document.compatMode == 'CSS1Compat') ? document.documentElement : document.body;
		return {pageX: event.clientX + element.scrollLeft, pageY: event.clientY + element.scrollTop};
	}
	
});

Touch.build = "5105bf475e5c40da542ffa022f57524c8c6d349c";
