// if registerModule is defined then we must be in the browser so call that. if not then this has
// been loaded as a node.js module and the code can execute right away.
(typeof registerModule=='function' ? registerModule : function (fn){fn(module);}).call(this, function (module){
	var exports=module.exports,
		require=module.require;
		
var initializationCbs=null,
	nextTick=null,
	extend=null,
	inherits=null,
	EventEmitter=null;
/**
 * 
 */
function Driver(cfg){
	extend(this, cfg);
}
function initDriverClass(){
	inherits(Driver, EventEmitter);
	extend(true, Driver.prototype, {
		/**
		 * @property	{Object} modules
		 * A hash with loaded (or still loading) modules with the relative file paths as keys.
		 */
		modules:{},
		initModules:function (){
			// unload loaded modules
			for(var l in this.modules){
				this.modules[l].unload();
				delete this.modules[l];
			}
			if(this.storage.appCfg.slaveModules.length){
				this.storage.loadingModules=true;
				this.storage.driverModule.require(this.storage.appCfg.slaveModules, function (modules){
					var asyncCount=1; // set to one because there is that extra call few lines below
					function checkComplete(){
						if(--asyncCount<1){
							delete driver.storage.loadingModules;
							driver.emit('initModules');
						}
					}
					for(var i=0; i<modules.length; i++)
						modules[i].initialize(driver, checkComplete)===false && ++asyncCount; // increment the counter if the module needs to complete asyncronously
					checkComplete();
				});
			}
		},
	});
}
if(typeof window=='object'){
	initializationCbs=[];
	nextTick=function (cb){
		setTimeout(cb, 0);
	};
	extend=$.extend;	// assume jQuery is loaded
	require(['./util', './events'], function (modules){
		inherits=modules[0].inherits;
		EventEmitter=modules[1].EventEmitter;
		initDriverClass();
		for(var i=0; i<initializationCbs.length; ++i)
			initializationCbs[i]();
	});
}else{ //	this must be node.js
	nextTick=process.nextTick;
	extend=require('jquery.extend');
	inherits=require('util').inherits;
	EventEmitter=require('events').EventEmitter;
	initDriverClass();
}

exports.Driver=Driver;
exports.create=function (cfg, cb){
	if(typeof cfg=='function'){
		cb=cfg;
		cfg={};
	}
	var returnDriver=function (){
		cb(null, new exports.Driver(cfg));
	};
	if(initializationCbs)
		initializationCbs.push(returnDriver);
	else
		nextTick(returnDriver);
};

});

