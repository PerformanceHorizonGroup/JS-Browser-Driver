/*!
	 * PHGDoc.js
	 * Copyright(c) 2012-2013 Georgi Kostov <p_e_a@gbg.bg>, http://performancehorizon.com
	 * https://github.com/PerformanceHorizonGroup/documentor.js
	 * MIT Licensed
	 */
	(function (){

	Function.prototype.scope=function (scopeObj){
		var f=this;	
		return function (){
			return f.apply(scopeObj, arguments);
		};
	};
	Function.prototype.createCallback=function (scopeObj, params, appendArgs){
		var f=this;	
		return function (){
			var args=params||arguments;
			if(appendArgs === true)
				args=[].slice.call(arguments, 0).concat(args);
			return f.apply(scopeObj||this, args);
		};
	};

	var ns = (typeof module == 'object' && module.exports) || (window.util = {});
	
	if(typeof module == 'object' && module.exports){
		ns.extend=require('../lib/other/jquery.extend');
//		ns.isArray = Array.isArray || require('util').isArray;
		ns.noop=function (){};
		ns.inherits=require('util').inherits;
		
		// copied from jQuery source
		ns.inArray = function( elem, array, i ) {
			var len;
	
			if ( array ) {
				if ( Array.prototype.indexOf ) {
					return Array.prototype.indexOf.call( array, elem, i );
				}
	
				len = array.length;
				i = i ? i < 0 ? Math.max( 0, len + i ) : i : 0;
	
				for ( ; i < len; i++ ) {
					// Skip accessing in sparse arrays
					if ( i in array && array[ i ] === elem ) {
						return i;
					}
				}
			}
	
			return -1;
		};
	}else{
		ns.extend=$.extend;
		ns.noop=$.noop;
		ns.inArray=$.inArray;
		
		// copied from node.js source
		ns.inherits=function (ctor, superCtor){
		    ctor.super_ = superCtor;
		    ctor.prototype = Object.create(superCtor.prototype, {
		        constructor: {
		            value: ctor,
		            enumerable: false
		        }
		    });
		};
		
	}

	/**
	 * Ensure namspace exists
	 * @param	{String}	namespace
	 * @param	{Object}	rootNS	(optional)	This is optional only in the browser and defaults to window .
	 * @return	{Object}	NS	The namespace object or null if invalid rootNS was given and the NS could not be found/created
	 */
	ns.ns=function (namespace, rootNS){
		if(typeof namespace == 'string')
			namespace=namespace.split('.');
		if(!rootNS){ // optional only in the browser!!! in node.js rootNS *must* be specified
			if(arguments.length<2){ // if no root NS was specified
				rootNS=window[namespace[0]];
				if(rootNS)
					namespace.shift();
				else
					rootNS=window;
			}else
				return null;
		}
		var res=ns.getPropValue(rootNS, namespace);
		if(!res){
			res={};
			ns.setPropValue(rootNS, namespace, res);
		}
		return res;
	};
	/**
	 * If the property does not exist it is assigned defaultVal if that is specified else - undefined. 
	 * @param	{Object}	obj
	 * @param	{Array/String}	prop An array with the property path or a dot-delimited String giving the path 
	 * @param	{Mixed}	defaultVal	(optional) The value to return if the property does not exist.
	 * @param	{Array}	alternateProp	(optional)	An optional property to return. If that property does not exist too defaultVal will be returned (so it must be passed too)
	 * @return	{Mixed}	res
	 */
	ns.getPropValue=function (obj, prop, defaultVal, alternateProp){
		var res=obj;
		if(typeof prop == 'string')
			prop=prop.split('.');
		else
			prop=prop.slice(0);
		while(prop.length){
			var p=prop.shift();
			if(!(p in res)){
				if(arguments.length>3) // if a alternateProp is given
					return ns.getPropValue(obj, alternateProp, defaultVal);
				else if(arguments.length>2) // if a defaultVal is given
					res[p] = defaultVal;
				else
					return undefined;
			}
			res=res[p];
		}
		return res;
	};
	/**
	 * @param	{Object}	obj
	 * @param	{Array/String}	prop An array with the property path or a dot-delimited String giving the path 
	 * @param	{Mixed}	val	The value to set.
	 */
	ns.setPropValue=function (obj, prop, val){
		if(typeof prop == 'string')
			prop=prop.split('.');
		else
			prop=prop.slice(0);
		if(prop.length>1){
			var p=prop.pop();
			obj=ns.getPropValue(obj, prop, {});
			prop=[p];
		}
		obj[prop[0]]=val;
	};
	
}());// if registerModule is defined then we must be in the browser so call that. if not then this has
// been loaded as a node.js module and the code can execute right away.
(typeof registerModule=='function' ? registerModule : function (fn, module){fn(module);}).call(this, function (module){
	var exports=module.exports,
		require=module.require;
		
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var isArray = Array.isArray;

function EventEmitter(cfg){
	if(cfg && typeof cfg=='object'){
		if('listeners' in cfg){
			for(var l in cfg.listeners)
				this.on(l, cfg.listeners[l]);
			delete cfg.listeners;
		}
		for(var p in cfg)
			this[p]=cfg[p];
	}
}
exports.EventEmitter = EventEmitter;

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._maxListeners = n;
};


EventEmitter.prototype.emit = function() {
  var type = arguments[0];
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var l = arguments.length;
        var args = new Array(l - 1);
        for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var l = arguments.length;
    var args = new Array(l - 1);
    for (var i = 1; i < l; i++) args[i - 1] = arguments[i];

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // If we've already got an array, just append.
    this._events[type].push(listener);

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._maxListeners !== undefined) {
        m = this._maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('.once only takes instances of Function');
  }

  var self = this;
  function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  };

  g.listener = listener;
  self.on(type, g);

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var position = -1;
    for (var i = 0, length = list.length; i < length; i++) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener))
      {
        position = i;
        break;
      }
    }

    if (position < 0) return this;
    list.splice(position, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (list === listener ||
             (list.listener && list.listener === listener))
  {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  if (arguments.length === 0) {
    this._events = {};
    return this;
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

}, (function (){ return typeof module=='object'?module:{exports:this};}).call(null));


(function (){
	
	var ns,
		emitter,
		util;
	
	if(typeof module == 'object' && module.exports){
		util=require('../lib/util');
		ns=module.exports;
		emitter=require('../lib/events').EventEmitter;
	}else{
		util=window.util;
		ns=util.ns('Documentor');
		emitter=window.EventEmitter;
	}
	
	/**
	 * @class Documentor.DocumentationRenderer
	 * @constructor
	 * @extends	EventEmitter
	 * Base class for a documentation renderer.
	 */
	ns.DocumentationRenderer=function (cfg){
//		util.extend(this, cfg);
		ns.DocumentationRenderer.super_.apply(this, arguments);
		this.initialize();
	};
	util.inherits(ns.DocumentationRenderer, emitter);

	util.extend(ns.DocumentationRenderer.prototype, {
		initialize:util.noop,
		/**
		 * @method render
		 * Renders the documentation from the given API object
		 * @param	{Documentor.Api}	api	The API object to render.
		 */
		render:function (){
		    /**
		     * @event render
		     * Fires when the documentation is rendered.
		     * @param {Documentor.Api} this
		     */
			this.emit('render', this);
		}
	});

}());

(function (){
	
	var ns, util, docRenderer;
	
	if(typeof module == 'object' && module.exports){
		util=require('../../lib/util');
		ns=module.exports;
		docRenderer=require('../DocumentationRenderer').DocumentationRenderer;
	}else{
		util=window.util;
		ns=util.ns('Documentor.PHGDoc');
		docRenderer=Documentor.DocumentationRenderer;
	}
	
	/**
	 * TO-DO: add search facility
	 * TO-DO: move "live" JS code to a separate include so that it can be used in generated static HTML documentation.
	 * TO-DO: add "view-source" feature.
	 */

	/**
	 * @class Documentor.PHGDoc.PHGDocRenderer
	 * @extends Documentor.DocumentationRenderer
	 * @constructor
	 * Renders the documentaion tree.
	 */
	ns.PHGDocRenderer=function (cfg){
		ns.PHGDocRenderer.super_.apply(this, arguments);
	};
	util.inherits(ns.PHGDocRenderer, docRenderer);
	util.extend(ns.PHGDocRenderer.prototype, {
		/**
		 * @cfg {String}	exportPath (optional)
		 * If the option is not given then it is assumed that the code runs in a browser and will render
		 * in the current page. Add this option when running in node.js and the generated content will go into a folder instead. 
		 */
		/**
		 * @cfg {String}	resourceIncludes (optional)	The HTML to include JS and CSS resources. By default it refers to "resources/jquery-1.4.3.min.js" and "resources/PHGDoc.css".
		 */
		resourceIncludes:{
			scripts:['jquery-1.10.2.js', {src:'../../../build/PHGDoc.js', dest:'PHGDoc.js'}],
			css:['PHGDoc.css'],
			files:['images/expanded.png', 'images/collapsed.png', 'images/arrow.gif', 'images/arrow_end.gif']
		},
		initialize:function (){
			/**
			 * @cfg {Function} renderFn	(optional)	The rendering function which will print the api tree and details.
			 */
			if(this.api)
				this.render(this.api);
		},
		render:function (api){
			if('exportPath' in this){ // we are writing static doc files in node.js
				var fs=require('fs'),
					path=require('path'),
					resFolder=path.resolve(__dirname, 'resources'),
					docPath=path.resolve(this.exportPath);
				function getSrcFileName(f){
					return typeof f=='string'?f:f.src;
				}
				function getDestFileName(f){
					return typeof f=='string'?f:f.dest;
				}
				function cp(src, dest){
					var targetResFolder=path.dirname(dest); 
					if(!fs.existsSync(targetResFolder))
						fs.mkdirSync(targetResFolder);
					require('util').pump(
						fs.createReadStream(src),
						fs.createWriteStream(dest, {flags:'w'})
					);
				}
				function copyResourceFileIf(fileName){
					cp(
						path.resolve(resFolder, getSrcFileName(fileName)), 
						path.resolve(docPath, 'resources', getDestFileName(fileName))
					);
				}
				var file=fs.createWriteStream(path.resolve(docPath, 'index.html'), { flags: 'w'}),
					resourceIncludesHTML='';
				file.on('error', function (err) {
					console.log(err);
				});
				if(this.resourceIncludes){
					if(this.resourceIncludes.scripts){
						for(var i=0, list=this.resourceIncludes.scripts; i<list.length; ++i)
							resourceIncludesHTML+='\n<script type="text/javascript" src="resources/'+getDestFileName(list[i])+'"></script>';
						list.forEach(copyResourceFileIf);
					}
					if(this.resourceIncludes.css){
						for(var i=0, list=this.resourceIncludes.css; i<list.length; ++i)
							resourceIncludesHTML+='\n<link rel="stylesheet" href="resources/'+getDestFileName(list[i])+'" type="text/css">';
						list.forEach(copyResourceFileIf);
					}
					if(this.resourceIncludes.files){
						this.resourceIncludes.files.forEach(copyResourceFileIf);
					}
				}
				file.write(['<!DOCTYPE html>',
						'<html>',
						'<head>',
						'<title>'+api.ns.name+'</title>',
						resourceIncludesHTML,
						'<meta charset="utf-8">',
						'<script type="text/javascript">(function (){',
						'var renderer=new Documentor.PHGDoc.PHGDocRenderer();',
						'var api='+JSON.stringify({ns:api.ns})+';',
						'api.NSPathSeparator=\''+api.NSPathSeparator+'\';',
						'api.getNSObject='+api.getNSObject.toString()+';',
						'$(document).ready(function (){ renderer.render(api); });',
						'}());</script>',
						'</head>',
						'<body>',
						'</body>',
						'</html>'].join('\n'));
			}else
				this.renderFn(api);
			ns.PHGDocRenderer.super_.prototype.render.apply(this, arguments);
		},
		renderFn:function (api){
			var renderer=this;
			function printNS(obj){ // print menu items
				var html='<ul>',
					titleStr='';
				if(obj.type=='api')
					titleStr=obj.name.split(api.NSPathSeparator).pop();
				else if(obj.type=='namespace')
					titleStr='<em>namespace</em> '+obj.name.split(api.NSPathSeparator).pop();
				else if(obj.type=='module')
					titleStr='<em>module</em> '+obj.name.split(api.NSPathSeparator).pop();
				else{
					titleStr='<span>'+obj.name.split(api.NSPathSeparator).pop();
					if(obj.flags && !$.isEmptyObject(obj.flags)){
						var flags=[];
						for(var f in obj.flags)
							if(obj.flags[f])
								flags.push(f.charAt(0));
						if(flags.length)
							titleStr+=' <span class="object-attributes">('+flags.join()+')</span>';
					}
					titleStr+='</span>';
				}
				html+='<li class="object-title obj-link" ns-path="'+obj.name+'">'+titleStr+'</li>';
				
				var children=[];
				for(var c in obj.children)
					children.push(obj.children[c]);
				children.sort(function (a, b){
					return (a.name<b.name?-1:(a.name>b.name?1:0));
				});
				for(var i=0; i<children.length; ++i){
					html+='<li class="children-list">'+printNS(children[i])+'</li>';
				}
				
				html+='</ul>';
				return html;
			}
			$(this.containerSelector||'body').append('<div id="selectionInfoWrap"><div id="selectionInfo"></div></div><div id="apiTreeWrap"><div id="apiTree">'+printNS(api.ns)+'</div></div>');
			var storage={
				hideInherited:false
			};
			function renderObj(obj){
				storage.obj=obj;
				var hierarchy=[[obj.name, obj]],
					html='',
					list;
				if('extends' in obj){
					var parentClass=obj['extends'],
						parentClassObj=api.getNSObject(parentClass);
					do{
						var hObj=[parentClass, null];
						hierarchy.unshift(hObj);
						if(parentClassObj){
							hObj[1]=parentClassObj;
							if('extends' in parentClassObj){
								parentClass=parentClassObj['extends'];
								parentClassObj=api.getNSObject(parentClass);
							}else
								parentClass=null;
						}else
							parentClass=null;
					}while(parentClass);
					var cls=hierarchy[0];
					html+='<div class="hierarchy"><em>hierarchy:</em> <div class="hierarchy-item"><div class="hierarchy-item-title'+(cls[1]?(' obj-link" ns-path="'+cls[0]+'"'):'"')+'>'+cls[0]+'</div>';
					var ending='<div class="hierarchy-item hierarchy-sub-item"><div class="hierarchy-item-title">'+hierarchy[hierarchy.length-1][0]+'</div></div>' +
							'</div></div>';
					for(var i=1; i<hierarchy.length-1; i++){
						html+='<div class="hierarchy-item hierarchy-sub-item"><div class="hierarchy-item-title'+(hierarchy[i][1]?(' obj-link" ns-path="'+hierarchy[i][0]+'"'):'"')+'>'+hierarchy[i][0]+'</div>';
						ending+='</div>';
					}
					html+=ending;
				}
				html+='<div><em>'+(obj.type!='api'?obj.type:'')+'</em> <strong>'+obj.name+'</strong>';
				if(!$.isEmptyObject(obj.flags)){
					var flags=[];
					for(var f in obj.flags)
						if(obj.flags[f])
							flags.push(f);
					if(flags.length)
						html+='<div><span class="object-attributes">( '+flags.join()+' )</span></div>';
				}
				if('definedIn' in obj){
					html+='<div class="defined-in"><em>defined in:</em> <span class="file-name" data-file-name="'+obj.definedIn+'">'+obj.definedIn.split('/').pop()+'</span></div>';
				}
				if(obj.description)
					html+='<p>'+obj.description+'</p>';
				if('subclasses' in obj){
					list=[];
					for(var i=0; i<obj.subclasses.length; i++)
						list.push('<span class="obj-link" ns-path="'+obj.subclasses[i].name+'">'+obj.subclasses[i].name+'</span>');
					html+='<p><em>subclasses:</em> '+list.join(', ')+'</p>';
				}				
				html+='</div>';
				html+='<div class="clear">';
				if(obj.type=='class')
					html+='<input type="checkbox"'+(storage.hideInherited?' checked':'')+' class="hide-inherited"> hide inherited';
				html+='</div>';
				
				/**
				 */
				function getMembersList(type){
					var members={}, list=[];
					// put members from all parents in the hash
					for(var i=storage.hideInherited?(hierarchy.length-1):0; i<hierarchy.length; ++i)
						if(hierarchy[i][1]) // if this class is in the API
							for(var m in hierarchy[i][1][type])
								if(!(m in members)) // skip overriden members
									members[m]=$.extend({definingClass:hierarchy[i][1].name}, hierarchy[i][1][type][m]);
					// move the members to a list
					for(var m in members)
						list.push(members[m]);
					// sort the list ASC by member name
					list.sort(function (a, b){
						return a.name<b.name?-1:(a.name>b.name?1:0);
					});
					return list;
				}
				// config
				if('config' in obj){
					list=getMembersList('config');
					if(list.length){
						html+='<div class="members">' +
								'<div class="members-head"><em class="members-title">configuration options:</em><div class="defined-by">defined by</div></div>';
						for(var i=0; i<list.length; ++i){
							html+='<div class="member">' +
										'<div class="member-expand">&nbsp;</div>' +
										'<div class="member-meta"><div class="defining-class obj-link" ns-path="'+list[i].definingClass+'">'+list[i].definingClass+'</div></div>' +
										'<div class="member-title"><strong>'+list[i].name+'</strong> : '+list[i].dataType+'</div>' +
										'<div class="member-summary">';
							var summary=list[i].summary||list[i].description;
							if(summary)
								html+=summary.substring(0, 100);
							if(summary.length>100)
								html+='...';
							html+='</div>' +
	//										'<div class="member-summary">'+(list[i].summary||list[i].description).substring(0, 100)+'...</div>' +
										'<div class="member-description">'+(list[i].description||list[i].summary)+'</div>' +
									'</div>';
						}
						html+='</div>';
					}
				}
				// properties
				if('properties' in obj){
					list=getMembersList('properties');
					if(list.length){
						html+='<div class="members">' +
								'<div class="members-head"><em class="members-title">properties:</em><div class="defined-by">defined by</div></div>';
						for(var i=0; i<list.length; ++i){
							html+='<div class="member">' +
										'<div class="member-expand">&nbsp;</div>' +
										'<div class="member-meta"><div class="defining-class obj-link" ns-path="'+list[i].definingClass+'">'+list[i].definingClass+'</div></div>' +
										'<div class="member-title"><strong>'+list[i].name+'</strong> : '+list[i].dataType+'</div>' +
										'<div class="member-summary">';
							var summary=list[i].summary||list[i].description;
							if(summary)
								html+=summary.substring(0, 100);
							if(summary.length>100)
								html+='...';
							html+='</div>' +
										'<div class="member-description">'+(list[i].description||list[i].summary)+'</div>' +
									'</div>';
						}
						html+='</div>';
					}
				}
				// methods
				if('methods' in obj){
					list=getMembersList('methods');
					if(list.length){
						html+='<div class="members"><div class="members-head"><em class="members-title">methods:</em><div class="defined-by">defined by</div></div>';
						for(var i=0; i<list.length; ++i){
							html+='<div class="member">' +
									'<div class="member-expand">&nbsp;</div>' +
									'<div class="member-meta"><div class="defining-class obj-link" ns-path="'+list[i].definingClass+'">'+list[i].definingClass+'</div></div>' +
									'<div class="member-title"><strong>'+list[i].name+'</strong>( ';
							var paramsList=[];
							for(var p=0; p<list[i].params.length; ++p){
								var paramStr=list[i].params[p].dataType+' <span class="pre">'+list[i].params[p].name+'</span>';
								if(list[i].params[p].optional)
									paramStr='['+paramStr+']';
								paramsList.push(paramStr);
							}
							html+=paramsList.join(', ');
							html+=' ) : '+(list[i].returns.type||'void');
							if(!$.isEmptyObject(list[i].flags)){
								var flags=[];
								for(var f in list[i].flags)
									if(list[i].flags[f])
										flags.push(f);
								if(flags.length){
									html+=' [';
									for(var f=0; f<flags.length; ++f)
										html+='<span class="method-flag">'+flags[f]+'</span>';
									html+=']';
								}
							}
							html+='</div>' +
									'<div class="member-summary">'+(list[i].summary || list[i].description)+'</div>'+
									'<div class="member-description"><div>'+(list[i].description||list[i].summary)+'</div>';
							// add Parameters and Returns (if any) to member-description 
							if(paramsList.length){
								html+='Parameters:<ul>';
								for(var p=0; p<list[i].params.length; ++p){
									html+='<li><span class="pre">'+list[i].params[p].name+'</span> : '+list[i].params[p].dataType+'<div>';
									if(list[i].params[p].optional)
										html+='(optional) ';
									html+=(list[i].params[p].description)+'</div></li>'; // ||list[i].params[p].summary
								}
								html+='</ul>';
							}
							if(list[i].returns.type!='void'){
								html+='Returns:<ul>';
								html+='<li><span class="pre">'+list[i].returns.type+'</span><div>'+list[i].returns.summary+'</div></li>';
								html+='</ul>';
							}
							html+='</div></div>';
						}
						html+='</div>';
					}
				}
				// events
				if('events' in obj){
					list=getMembersList('events');
					if(list.length){
						html+='<div class="members"><div class="members-head"><em class="members-title">events:</em><div class="defined-by">defined by</div></div>';
						for(var i=0; i<list.length; ++i){
							html+='<div class="member">' +
									'<div class="member-expand">&nbsp;</div>' +
									'<div class="member-meta"><div class="defining-class obj-link" ns-path="'+list[i].definingClass+'">'+list[i].definingClass+'</div></div>' +
									'<div class="member-title"><strong>'+list[i].name+'</strong>( ';
							var paramsString=[];
							for(var p=0; p<list[i].params.length; ++p)
								paramsString.push(list[i].params[p].dataType+' <span class="pre">'+list[i].params[p].name+'</span>');
							html+=paramsString.join(', ');
							html+=' )</div>' +
									'<div class="member-summary">'+(list[i].summary || list[i].description)+'</div>' +
									'<div class="member-description"><div>'+(list[i].description || list[i].summary)+'</div>';
							// add Parameters (if any) to member-description 
							if(paramsString.length){
								html+='Parameters:<ul>';
								for(var p=0; p<list[i].params.length; ++p)
									html+='<li><span class="pre">'+list[i].params[p].name+'</span> : '+list[i].params[p].dataType+'<div>'+(list[i].params[p].description)+'</div></li>';
								html+='</ul>';
							}
							html+='</div></div>';
						}
						html+='</div>';
					}
				}
				
				$('#selectionInfo').html(html);
				
			    /**
			     * @event renderSelectedItemInfo
			     * Fires when the details of the selected item are rendered in the selectionInfo pane.
			     * @param {Documentor.Api} this
			     * @param {Object} item	The rendered item's data.
			     */
				renderer.emit('renderSelectedItemInfo', this, obj);
			}

			/**
			 * @cfg	{String/jQuery}	containerSelector	A container to limit the global listeners' scope. 
			 */
			var containerSelector=this.containerSelector||document;
			if(!this.hasAttachedListeners){
				$(containerSelector).on('click', '.hide-inherited', function (){
					storage.hideInherited=this.checked;
					renderObj(storage.obj);
				});
				$(containerSelector).on('click', '.obj-link', function (){
					location.hash=$(this).attr('ns-path');
		//				renderObj(api.getNSObject($(this).attr('ns-path')));
				});
				$(containerSelector).on('click', '.member-expand', function (){
					$(this).parent().toggleClass('expanded');
				});

				$(window).bind( 'hashchange', renderObjectFromHash);
				$(window).bind('resize', function (){
					$('#selectionInfoWrap, #apiTreeWrap', containerSelector).height($(window).height()-10);
				});
				this.hasAttachedListeners=true;
			}
			
			function renderObjectFromHash(){
				$('.object-title.active', containerSelector).removeClass('active');
				var obj=api.getNSObject(location.hash.substring(1));
				if(obj){
					$('.object-title[ns-path="'+obj.name+'"]', containerSelector).addClass('active');
					renderObj(obj);
				}
			}
			$(window).trigger('resize');
			(function (){
				// run through all classes and compile their "subclasses"
				function processObj(obj){
					if(obj.type=='class' && obj['extends']){
						var extObj=api.getNSObject(obj['extends']);
						if(extObj){
							if(!extObj.subclasses)
								extObj.subclasses=[];
							extObj.subclasses.push(obj);
						}
					}
					if(obj.children)
						for(var c in obj.children)
							processObj(obj.children[c]);
				}
				processObj(api.ns);
			}());
				
			if(location.hash!='')
				renderObjectFromHash();
		}
	});
	
}());
