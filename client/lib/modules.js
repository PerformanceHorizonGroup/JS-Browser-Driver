(function (globalScope){

	/**
	 * * Modules (scripts) can be loaded a little easier and maybe faster if they are retrieved via AJAX calls
	 * because that gives a lot more details for the download. But AJAX limits us to the same domain and cross-domain
	 * calls are probably better to have.
	 * * Also retrieving the script as text (via AJAX) allows the code to be executed in a specific environment which may
	 * spare the global registerModule() function and give more flexibility.
	 * * a way to remove any trace (like jQuery's noConflict()) could be useful
	 */
	
	/**
	 * Tries to implement a module loading system which will work at least very similar to
	 * how node.js loads modules and also be compatible with node's require().
	 */
	
	
	var loadingQueue=[],
		loadingModule=null;
	function attachScript(url, cb){
		if(loadingModule)
			loadingQueue.push({url:url, cb:cb});
		else{
			var script=document.createElement('SCRIPT'),
				head=document.head||$('head').get(0),
				moduleKey=url.replace(/\.js$/, '');
			script.src=url;
	
			script.type='text/javascript';
			
			loadingModule=modules[moduleKey];
			
			if($.browser.msie) // no load event in IE so wait for readyState
				script.onreadystatechange=function(){
					if(script.readyState == 'complete' || script.readyState == 'loaded'){
						script.onreadystatechange=null;
						scriptLoaded(script, cb);
					}
				};
			else
				$(script).one('load', function (){
					scriptLoaded(script, cb);
				});
				
			head.appendChild(script);
			
			return script;
		}
	}
	function scriptLoaded(script, cb){
		loadingModule=null;
		if(cb)
			cb(script);
		var c=loadingQueue.shift();
		if(c)
			attachScript(c.url, c.cb);
	}
	function loadModule(module){
		// attach the SCRIPT element
		attachScript(module.url, function (scriptEl){
			$(scriptEl).remove();
			function complete(){
				// fire callbacks if any
				for(var i=0; i<module.loading.length; i++)
					module.loading[i]();
				delete module.loading;
			}
			complete();
		});
	}
	function nextTick(cb){
		setTimeout(cb, 10);
	}
	function toAbsoluteUrl(url, baseUrl){
		if(/^\w+:\/\//.test(url)) // if already absolute
			return url;	// return it as is
		else if(url.charAt(0)=='/') // if relative to root
			return baseUrl.match(/^\w+:\/\/[^\/]+/)[0]+url;	//	prepend the host of the base url
		else	// must be relative
			return baseUrl.match(/^\w+:\/\/[^\/]+[^#\?]*\//)[0]+url;
	}
	function blankModule(props){
		var module={
			exports:{}
		};
		module.require=function (){
			return require.apply(module, arguments);
		};
		
		$.extend(true, module, props);
		
		return module;
	}
	
	/**
	 * Store all modules kyed by absolute url
	 */
	var modules={};
	
	function requireModuleAtAbsUrl(url, cb){
		var moduleKey=url.replace(/\.js$/, ''),
			module=modules[moduleKey];
		if(module){
			if(module.loading){
				module.loading.push(function (){
					cb(module.exports);
				});
			}else{
				if(cb)
					nextTick(function (){
						cb(module.exports);
					});
			}
		}else{
			module=modules[moduleKey]=blankModule({
				url:moduleKey+'.js',
				
				/**
				 * delete this property when the module loads. Callbacks can be added
				 * to this array and will be called when it loads.
				 */
				loading:[]
			});
			module.loading.push(function (){
				cb&&cb(module.exports);
			});
			loadModule(module);
		}
		return module.exports;
	}
	function require(url, cb){ 
		if('filename' in this){	// node modules have "filename"
			// this must be node.js so use what it provides (all modules load synchronously)
			if(typeof url=='string'){
				var exports=this.require(url);
				if(cb)
					nextTick(function (){
						cb(exports);
					});
				return exports;
			}else{	// an array
				for(var i=0, exportsList=[]; i<url.length; i++)
					exportsList.push(this.require(url[i]));
				if(cb)
					nextTick(function (){
						cb(exportsList);
					});
			}
			
		}else{
			if(typeof url=='string'){
				url=toAbsoluteUrl(url, this.url);
				return requireModuleAtAbsUrl(url, cb);
			}else{ // an array
				var exportsList=[];
				function checkLoadingList(url){
					var ind=$.inArray(url, loadingList);
					if(ind>-1)
						loadingList.splice(ind, 1);
					if(loadingList.length==0)
						cb&&cb(exportsList);
				}
				for(var i=0, loadingList=[]; i<url.length; i++){
					url[i]=toAbsoluteUrl(url[i], this.url);
					loadingList.push(url[i]);
					(function (){
						var u=url[i],
							ind=i;
						exportsList.push(require.call(this, u, function (exports){
							if(exportsList[ind]!=exports)
								exportsList[ind]=exports;
							checkLoadingList(u);
						}));
					}());
				}
				return exportsList;
			}
		}
	}
	globalScope.registerModule=function (fn, module){
		if(module){	// this must be node.js
			fn(module, function (){
				return require.apply(module, arguments);
			});
		}else{
			if(typeof fn=='function'){
				fn(loadingModule, loadingModule.require);	// loadingModule must reference the currently loading module
				return loadingModule;
			}else{	// "object"
				fn.url=toAbsoluteUrl(fn.url, window.location.protocol+'//'+window.location.host+window.location.pathname);
				var moduleKey=fn.url.replace(/\.js$/, '');
				modules[moduleKey]=blankModule(fn);
				return modules[moduleKey];
			}
		}
	};
	globalScope.registerModule.loadFromAbsPath=function (path, cb){
		return requireModuleAtAbsUrl(path, cb);
	};
}( (function() {return this;}.call()) )); // use this construct to access the global object