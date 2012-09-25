registerModule(function (module, require){
	var exports=module.exports;
		
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
		this.initialize();
	}
	function initDriverClass(){
		inherits(Driver, EventEmitter);
		extend(true, Driver.prototype, {
			initialize:function (){
				if(!this.storage)
					this.storage={};
				this.socket.on('message', this.processMsg.scope(this));
			},
			connect:function (){
	//			console.log('sending capture message for '+this.storage.slaveName);
				this.socket.send({
					id:'capture',
					slaveName:this.storage.slaveName
				});
			},
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
					var paths=[],
						driver=this;
					if('filename' in module)	// this is node.js
						for(var i=0; i<this.storage.appCfg.slaveModules.length; i++){
//							var path=this.storage.appCfg.slaveModules[i];
//							if(path.indexOf('/')==0)
//								path='..'+path;
							paths.push('..'+this.storage.appCfg.slaveModules[i]);
						}
					else
						paths=this.storage.appCfg.slaveModules;
					require(paths, function (modules){
						var asyncCount=1; // set to one because there is that extra call few lines below
						function checkComplete(){
								if(--asyncCount<1){
									delete driver.storage.loadingModules;
									driver.emit('initModules');
								}
							};
						for(var i=0; i<modules.length; i++)
							modules[i].initialize(driver, checkComplete)===false && ++asyncCount; // increment the counter if the module needs to complete asyncronously
						checkComplete();
					});
				}
			},
			processMsg:function (msg){
	//			console.log(msg.id);
				switch(msg.id){
					case 'capture':
							if(msg.result=='rejected'){
								this.emit('disconnect');
							}else{
	//							console.log('captured');
								this.reset();
								if('appCfg' in msg){
									this.storage.appCfg=msg.appCfg;
									this.initModules();
								}
								if('tests' in msg){
									this.testsQueue=msg.tests;
									this.runNextBrowserTest();
								}
							}
						break;
					case 'appCfg':
							this.storage.appCfg=msg.appCfg;
						break;
					case 'runTests':
							this.reset();
							this.testsQueue=msg.tests;
							this.runNextBrowserTest();
						break;
					case 'disconnect':
							this.emit('disconnect');
						break;
					case 'reset':
							this.reset();
							/**
							 * TO-DO: try to stop the test runner if it is progreessing with some tests. It may not be possible though 
							 * as running test code can not be controlled without unloading the JS frame that it runs in (which is most likely the current page)
							 */
						break;
				}
			},
			reset:function (){
				
			}
		});
	}
	if(typeof window=='object'){
		initializationCbs=[];
		nextTick=function (cb){
			setTimeout(cb, 0);
		};
		extend=$.extend;	// assume jQuery is loaded
		require(['./util', './events', './helpers'], function (modules){
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
		require('./helpers'); 
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
		else if(cb)
			nextTick(returnDriver);
		else
			return new exports.Driver(cfg);
	};

}, typeof module=='object'?module:null);

