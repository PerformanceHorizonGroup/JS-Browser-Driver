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
	function TestManager(cfg){
		extend(this, cfg);
		this.initialize();
	}
	function initClass(){
//		inherits(TestManager, EventEmitter);
		extend(true, TestManager.prototype, {
			initialize:function (){
				this.driver.on('message', this.processMsg.scope(this));
				this.driver.on('capture', function (msg){
					if('tests' in msg){
						this.testsQueue=msg.tests;
						this.runNextBrowserTest();
					}
				}.scope(this));
			},
			processMsg:function (msg){
	//			console.log(msg.id);
				switch(msg.id){
					case 'runTests':
							this.reset();
							this.testsQueue=msg.tests;
							this.runNextBrowserTest();
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
		require(['../lib/util', '../lib/events', '../lib/helpers'], function (modules){
			inherits=modules[0].inherits;
			EventEmitter=modules[1].EventEmitter;
			initClass();
			for(var i=0; i<initializationCbs.length; ++i)
				initializationCbs[i]();
		});
	}else{ //	this must be node.js
		nextTick=process.nextTick;
		extend=require('jquery.extend');
		inherits=require('util').inherits;
		EventEmitter=require('events').EventEmitter;
		require('../lib/helpers'); 
		initClass();
	}
	
	exports.TestManager=TestManager;
	exports.initialize=function (driver, cb){
		var init=function (){
			new exports.TestManager({driver:driver});
			cb();
		};
		if(initializationCbs){
			initializationCbs.push(init);
			return false;
		}else
			init();
	};

}, typeof module=='object'?module:null);

