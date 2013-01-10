registerModule(function (module, require){
	var exports=module.exports;
	
	var initializationCbs=null,
		nextTick=null,
		extend=null,
		inherits=null,
		EventEmitter=null,
		isNodeJS='filename' in module;

	function testsMatch(t1, t2){
		return ((!t1.module && !t2.module) || (t1.module==t2.module)) 
				&& t1.fileName==t2.fileName 
				&& t1.name==t2.name;
	}

	/**
	 * 
	 */
	function TestManager(cfg){
		extend(this, cfg);
		this.initialize();
	}
	function initClass(){
		inherits(TestManager, EventEmitter);
		extend(true, TestManager.prototype, {
			initialize:function (){
				this.adaptor=require('..'+this.adaptor, function (exports){
					var cfg={};
					if(!isNodeJS){
						cfg.serverUrl=this.driver.storage.socketIOServerLocation;
//						cfg.testsBaseUrl=this.storage.info.testsBaseUrl;
//						cfg.testsBaseDir=this.storage.info.testsBaseDir;
					}
					this.testInstance = this.adaptor.createTestingInstance(cfg);
					this.testInstance.onMessage(this.processTestInstanceMsg.scope(this));
				}.scope(this));
				this.storage={
					info:{},
					userStylesheets:{}
				};
				/**
				 * @property	{Object} testSources
				 * A hash with loaded (or still loading) test source files with the relative file paths as keys.
				 */
				
				this.driver.on('message', this.processMsg.scope(this));
//				this.driver.on('capture', function (msg){
					this.driver.socket.json.send({
						id:'testManager.clientInitialized'
					});
					
//					extend(this.storage.info, msg.testManagerInfo);
//					if('tests' in msg){
//						this.testsQueue=msg.tests;
//						this.runNextBrowserTest();
//					}
//				}.scope(this));
			},
			checkTestsQueue:function (){
				if(this.testInstance && this.testInstance.initialized && this.testsQueue.length && !this.runningTest && !this.storage.loadingLibs && !this.storage.loadingModules){
					var t=this.testsQueue[0];
//					if(t.fileName in this.testSources){ // the SCRIPT either has been loaded or is now loading
						console.log('running: '+t.name+' in '+t.fileName);
//						var fileName=t.fileName;
//						if(!isNodeJS)
//							fileName = this.storage.info.testsBaseUrl+fileName.substring(this.storage.info.testsBaseDir.length).replace(/\\/g, '/');
						this.testInstance.sendMessage({
							id:'runTest',
							test:{
								fileName:t.fileName,
								filePath : isNodeJS ? t.fileName : this.driver.storage.socketIOServerLocation+this.storage.info.testsBaseUrl+t.fileName.substring(this.storage.info.testsBaseDir.length).replace(/\\/g, '/'),
								name:t.name
							}
						});
//						t.testEnvironment={};
						this.runningTest=t;
//						if(!('fn' in t)){
//							var ind=this.getTestInd(t, this.testCache);
//							if(ind>-1)
//								t.fn=this.testCache[ind].fn;
//						}
//						/**
//						 * TO-DO: amend the test environment with that of the current module if there is one
//						 */
//						if('fn' in t)
//							t.fn(); //.call(t.testEnvironment); // set scope to the testEnvironment object
//						else
//							console.log('waiting for test function ...');
//					}else{ // the SCRIPT has not been loaded
//						this.loadTestSource(t.fileName); //, this.checkTestsQueue.scope(this));
//					}
				}
			},
//			getTestInd:function (testData, testslist){
//				var ind=-1;
//				if(!testslist)
//					testslist=this.testsQueue;
//				for(var i=0; i<testslist.length; i++){
//					if(testsMatch(testData, testslist[i])){
//						ind=i;
//						break;
//					}
//				}
//				return ind;
//			},
//			/**
//			 * @method loadTestSource
//			 * Loads a test source file so tests in it are registered in the environment and ready (but not scheduled) to be run. All loaded tests
//			 * are added to the "testCache" list.
//			 * @param	{String}	src	The path of the test file relative to the "testsPath" property in the test configuration file.
//			 */
//			loadTestSource:function (src){
//		        /**
//		         * @event beforeLoadTestSource
//		         * Fires before a [SCRIPT tag is inserted into the DOM]/[the module is require()'d].
//		         * @param {BrowserDriver.Driver} this
//		         * @param {String}	src
//		         */
//				this.emit('beforeLoadTestSource', src);
//				this.doLoadTestSource(src);
//			},
//			// this can be overridden
//			doLoadTestSource:function (src){
//				console.log('doLoadSource '+src);
//				this.testSources[src]={};
//				if(isNodeJS){
//					var path = require("path"),
//						absFileName=path.resolve(path.dirname(this.driver.storage.appCfg.configFileName), this.driver.storage.appCfg.testsPath, src);
//					console.log('require test '+absFileName);
//					require(path.relative(path.dirname(module.filename), absFileName));
//				}else
//					this.attachScript(this.driver.storage.socketIOServerLocation
//													+'/manager/tests/sources/'
//													+src+'?cb='+(new Date()).getTime())
//			},
			/**
			 * @method attachScript
			 * [in the browser] Appends a SCRIPT element to the HEAD.
			 * @param	{String}	src	The "src" attribute to set.
			 * @param	{Function}	cb	A callback to invoke when the element loads.
			 */
			attachScript:function (src, cb, doc){
				var script=(doc||document).createElement('SCRIPT'),
					head=(doc||document).getElementsByTagName('head')[0];
				script.src=src;
				script.type='text/javascript';
				
				if($.browser.msie) // no load event in IE so wait for readyState
					script.onreadystatechange=function(){
						if(script.readyState == 'complete' || script.readyState == 'loaded'){
							script.onreadystatechange=null;
							head.removeChild(script);
							if(cb)
								cb();
						}
					};
				else
					$(script).one('load', function (){
						head.removeChild(script);
						if(cb)
							cb()
					});
					
				head.appendChild(script);
				
				return script;
			},
			processMsg:function (msg){
//				console.log(msg.id);
				switch(msg.id){
					case 'testManager.runTests':
							this.reset();
							this.testsQueue=msg.tests;
							this.checkTestsQueue();
						break;
					case 'testManager.reset':
							this.reset();
							/**
							 * TO-DO: try to stop the test runner if it is progreessing with some tests. It may not be possible though 
							 * as running test code can not be controlled without unloading the JS frame that it runs in (which is most likely the current page)
							 */
							extend(this.storage.info, msg.testManagerInfo);
							if('tests' in msg){
								this.testsQueue=msg.tests;
								this.checkTestsQueue();
							}
						break;
				}
			},
			processTestInstanceMsg:function (msg){
//				console.log('testInstanceMsg '+msg.id);
				switch(msg.id){
					case 'adaptorInitialized':
							this.testInstance.initialized=true;
							var cfg=extend(true, {
								
							}, this.storage.info);
							if(!isNodeJS)
								cfg.serverUrl=this.driver.storage.socketIOServerLocation;
							this.testInstance.sendMessage({
								id:'testCfg',
								cfg:cfg
							});
							this.checkTestsQueue();
						break;
					case 'testStart':
						console.log('start test "'+msg.name+'"');
						this.driver.socket.json.send(extend({}, msg, {
							id:'testManager.onTestStart'
						}));
						break;
					case 'assertion':
							console.log('test assertion '+(msg.message||'')+' in "'+msg.name+'"');
							this.driver.socket.json.send(extend({}, msg,{
								id:'testManager.onAssertion'
							}));
						break;
					case 'testDone':
						console.log('done test "'+msg.name+'"');
						this.testsQueue.shift();
						delete this.runningTest;
						this.driver.socket.json.send(extend({}, msg, {
							id:'testManager.onTestDone'
						}));
						if(this.testsQueue.length)
							this.checkTestsQueue();
						else{
//							driver.targetSiteFrame.unbind(); // clean up all attached listeners
							console.log('all tests done !');
//							if(driver.socket)
								this.driver.socket.json.send({
									id:'testManager.onAllTestsDone'
								});
						}
						break;
					case 'adaptorInitialized':
						break;
				}
			},
			reset:function (){
				this.testsQueue=[];
				if(this.testInstance && this.testInstance.initialized)
					this.testInstance.sendMessage({
						id:'reset'
					});
//				this.testSources={};
			}
		});
	}
	if(isNodeJS){
		nextTick=process.nextTick;
		extend=require('jquery.extend');
		inherits=require('util').inherits;
		EventEmitter=require('events').EventEmitter;
		require('../lib/helpers'); 
		initClass();
	}else{
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
	}
	
	exports.TestManager=TestManager;
	exports.initialize=function (cfg, cb){
		var init=function (){
			new exports.TestManager(cfg);
			cb();
		};
		if(initializationCbs){
			initializationCbs.push(init);
			return false;
		}else
			init();
	};

}, typeof module=='object'?module:null);

