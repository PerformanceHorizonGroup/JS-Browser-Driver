// if registerModule is defined call that. if not then check if this this has
// been loaded as a node.js module and the code can execute right away.
(typeof registerModule=='function' ? registerModule : function (fn){fn(module, require);}).call(this, function (module, require){
	var exports=module.exports;
		
var isNodeJS = !(typeof window=='object'),
	globalScope=function() {return this;}.call();

/**
 * This code intercepts calls to the QUnit testing library to allow tests written for that library to run in BrowserDriver.
 */

exports.initialize=function (){
	
	var extend, sendMessage, onMessage;
	
	globalScope.__adaptor__={
		testCfg:{},
		storage:{},
		requireLib:function (src, cb){
			var sep=isNodeJS ? require('path').sep:'';
			if(src instanceof Array){
				for(var i=0; i<src.length; i++)
					src[i]=(isNodeJS ? this.testCfg.clientBaseDir+sep+'lib'+sep : this.testCfg.serverUrl+'/lib/')+src[i];
			}else
				src=(isNodeJS ? this.testCfg.clientBaseDir+sep+'lib'+sep : this.testCfg.serverUrl+'/lib/')+src;
			return require(src, cb);
		},
		requireCustomLib:function (src, cb){
			var sep=isNodeJS ? require('path').sep:'';
			if(src instanceof Array){
				for(var i=0; i<src.length; i++)
					src[i]=(isNodeJS ? this.testCfg.userLibsDir+require('path').sep : this.testCfg.serverUrl+this.testCfg.userLibsUrl+'/')+src[i];
			}else
				src=(isNodeJS ? this.testCfg.userLibsDir+require('path').sep : this.testCfg.serverUrl+this.testCfg.userLibsUrl+'/')+src;
			return require(src, cb);
		},
		require:function (src, cb){
			return require(src, cb);
		},
		attachScript:attachScript,
		attachStylesheet:function (src, cb, doc){
			if(!doc)
				doc=document;
			var link=doc.createElement('link'),
				head=doc.getElementsByTagName('head')[0];

//			src = driver.storage.socketIOServerLocation
//						+'/manager/tests/lib/'
//						+src+'?cb='+(new Date()).getTime();

			link.href=src;
			link.rel='stylesheet';
			link.type='text/css';
			
			if($.browser.msie) // no load event in IE so wait for readyState
				link.onreadystatechange=function(){
					if(link.readyState == 'complete' || link.readyState == 'loaded'){
						link.onreadystatechange=null;
						if(cb)
							cb();
					}
				};
			else if(cb)
				$(link).one('load', cb);
				
			head.appendChild(link);
			
			return link;
		}
	};
	
	var sourceFilesQueue=[]
		processingSourceFile=false;
		
	function nextTick(cb){
		isNodeJS ? process.nextTick(cb) : setTimeout(cb, 0);
	}
		
	function processSourceFilesQueue(){
		if(!processingSourceFile && sourceFilesQueue.length){
			processingSourceFile=true;
			currentModule=undefined;
			function fileProcessed(){
				processingSourceFile=false;
				var file=sourceFilesQueue.shift();
				sendMessage({
					id:'allTestsRead',
					fileName:file.fileName
				});
				nextTick(processSourceFilesQueue);
			}
			if(isNodeJS){
				var vm = require("vm"),
					fs = require("fs");

				fs.readFile(sourceFilesQueue[0].filePath, function (err, fileData){
					if(err)
						console.log('ERR: processSourceFilesQueue failed loading "'+sourceFilesQueue[0].filePath+'": '+err)
					else{
//						console.log('runInThisContext '+sourceFilesQueue[0])
						try{
							vm.runInThisContext(fileData, sourceFilesQueue[0].filePath);
						}catch(e){
							console.log('Exception occured while processing test source: '+e.stack);
						}
					}
					fileProcessed();
				});
			}else{
				attachScript(sourceFilesQueue[0].filePath, function (){
					fileProcessed();
				});
			}
		}
	}
	/**
	 * Loads a test source file so tests in it are registered in the environment and ready (but not scheduled) to be run. All loaded tests
	 * are added to the testCache
	 * @param	{String}	src	The path of the test file.
	 */
	function loadTestsSource(file){
//		console.log('loadTestsSource '+path)
		if(file instanceof Array)
			sourceFilesQueue.push.apply(sourceFilesQueue, file);
		else
			sourceFilesQueue.push(file);
		processSourceFilesQueue();
	}
	
	var currentModule=undefined,
		testCache={};
//		currentFileName='';
	function addToTestCache(test){
		var obj=testCache[test.fileName];
		if(!obj)
			obj=testCache[test.fileName]={};
		obj[test.name]=test;
	}
	
	var testsQueue=[],
		runningTest;
	function processTestsQueue(){
		if(!runningTest && testsQueue.length){
			var test=testsQueue.shift(),
				cacheObj=testCache[test.fileName];
			if(cacheObj)
				extend(test, cacheObj[test.name]);				
			runningTest=new Test(test);
			runningTest.run();
		}
	}
	
	function Test(cfg){
		extend(this, cfg);
	}
	function onTestRead(test){
//		console.log('testRead', test.name, 'in', test.fileName)
		addToTestCache(test);
		sendMessage({
			id:'testRead',
			test:test
		});
//		console.log('runningTest', runningTest, runningTest&&(runningTest.module==test.module))
		if(runningTest && runningTest.paused 
						&& runningTest.fileName==test.fileName 
						&& (!(runningTest.module&&test.module) || (runningTest.module.name==test.module.name)) 
						&& runningTest.name==test.name){
//			console.log('resuming test ...');
			extend(runningTest, test);
			runningTest.resume();
		}
	}
	function Module(){
		this.initialize.apply(this, arguments);
	}

	function setup(QUnit){
		extend(Test.prototype, {
			run:function (){
				if(!this.paused && !this.setupCount){
					if(this.fn){
						this.reset();
						if(this.module && (typeof this.module.setup=='function')){
							this.setupCount++;
							this.module.setup.call(this.testEnvironment);
							this.setupCount--;
						}
						this.doRun();
					}else{
						this.pause();
						console.log('waiting for test function ...');
						loadTestsSource(this);
					}
				}
			},
			doRun:function (){
				if(!this.setupCount)
					this.fn.call(this.environment);
			},
			end:function (){
				if(this.module && (typeof this.module.teardown=='function'))
					this.module.teardown.call(this.testEnvironment);
			},
			pause:function (){
				this.paused=true;
			},
			resume:function (){
				this.paused=false;
				this.run();
			},
			reset:function (){
				this.setupCount=0;
				this.testEnvironment={
					__testInst:this
				};
			},
			requireLib:function (src, cb){
				var sep=isNodeJS ? require('path').sep:'';
				if(src instanceof Array){
					for(var i=0; i<src.length; i++)
						src[i]=(isNodeJS ? __adaptor__.testCfg.clientBaseDir+sep+'lib'+sep : __adaptor__.testCfg.serverUrl+'/lib/')+src[i];
				}else
					src=(isNodeJS ? __adaptor__.testCfg.clientBaseDir+sep+'lib'+sep : __adaptor__.testCfg.serverUrl+'/lib/')+src;
				return this.require(src, cb);
			},
			requireCustomLib:function (src, cb){
				var sep=isNodeJS ? require('path').sep:'';
				if(src instanceof Array){
					for(var i=0; i<src.length; i++)
						src[i]=(isNodeJS ? __adaptor__.testCfg.userLibsDir+require('path').sep : __adaptor__.testCfg.serverUrl+__adaptor__.testCfg.userLibsUrl+'/')+src[i];
				}else
					src=(isNodeJS ? __adaptor__.testCfg.userLibsDir+require('path').sep : __adaptor__.testCfg.serverUrl+__adaptor__.testCfg.userLibsUrl+'/')+src;
				return this.require(src, cb);
			},
			require:function (src, cb){
				var waitFn=this.waitForSetup();
				return require(src, function (exports){
					cb&&cb(exports);
					waitFn();
				});
			},
			waitForSetup:function (){
				this.setupCount++;
				var test=this;
				return function (){
					test.setupCount--;
					test.doRun();
				};
			}
		});
		extend(Module.prototype, {
			initialize:function (name, lifecycle){
				this.name=name;
				if(lifecycle)
					extend(this, lifecycle);
			}
		});

		QUnit.testStart(function (data){
			sendMessage(extend({
				id:'testStart',
				name:runningTest.name,
				module:runningTest.module?runningTest.module.name:'',
				fileName:runningTest.fileName
			}, data));
		});
		QUnit.testDone(function (data){
			runningTest.end();
			var msg=extend({
				id:'testDone',
				name:runningTest.name,
				module:runningTest.module?runningTest.module.name:'',
				fileName:runningTest.fileName
			}, data);
			runningTest=null;
			sendMessage(msg);
			processTestsQueue();
		});
		QUnit.log(function (data){
			if(runningTest){
				sendMessage(extend({
					id:'assertion',
					name:runningTest.name,
					module:runningTest.module?runningTest.module.name:'',
					fileName:runningTest.fileName
				}, data));
			}
		});

		// add the test methods to global 
		extend(globalScope, QUnit.assert, {
			start:QUnit.start,
			stop:QUnit.stop,
			expect:QUnit.expect,
			test:function (testName, expected, callback){
//				console.log('test')
				var mod=currentModule,
					args=Array.prototype.slice.call(arguments, 0);
				if(args.length === 2){
					args[2]=args[1]; // callback = expected;
					args[1]=1; // expected = 1;
					expected=1;
				}
				var fn=args[2];
				args[2]=function (){
					fn.call(runningTest.testEnvironment);  // set scope to runningTest because QUnit will set it to its test environment object
				};
				var test={
					module:mod, 
					fileName:sourceFilesQueue[0].fileName, //currentFileName, 
					name:testName, 
					fn:function (){
						if(mod)
							QUnit.module(mod.name);
						else
							QUnit.module('');
						QUnit.test.apply(QUnit, args);
					},
					expect:expected
				};
				onTestRead(test);
			},			
			asyncTest:function (testName, expected, callback){
				var mod=currentModule,
					args=Array.prototype.slice.call(arguments, 0);
				if(args.length === 2){
					args[2]=args[1]; // callback = expected;
					args[1]=1; // expected = 1;
					expected=1;
				}
				var fn=args[2];
				args[2]=function (){
					fn.call(runningTest.testEnvironment);  // set scope to runningTest because QUnit will set it to its test environment object
				};
				var test={
					module:mod, 
					fileName:sourceFilesQueue[0].fileName, //currentFileName, 
					name:testName, 
					fn:function (){
						if(mod)
							QUnit.module(mod.name);
						else
							QUnit.module('');
						QUnit.asyncTest.apply(QUnit, args);
					},
					expect:expected
				};
				onTestRead(test);
			},			
			module:function (name, lifecycle){
				currentModule=new Module(name, lifecycle);
			}
		});
	}
	// load the QUnit library
	if(isNodeJS){
		extend=require('jquery.extend');
		sendMessage=function (msg){
//			console.log('sendMessage '+msg.id)
			process.send(msg);
		};
		onMessage=function (fn){
			process.on('message', fn);
		};
		setup(require('../qunit'));
		sendMessage({
			id:'adaptorInitialized'
		});
	}else{
		sendMessage=function (msg){
			window.__adaptor__.sendMessage(msg);
		};
		(function (){
			var listeners=[];
			window.__adaptor__.onMessage=function (msg){
				for(var i=0; i<listeners.length; i++)
					listeners[i](msg);
			};
			onMessage=function (fn){
				listeners.push(fn);
			};
		}());
		attachScript(module.url.replace(/[^\/]*$/, '')+'../qunit.js', function (){
			extend=$.extend;
			// do this because for now the lib is not loaded in a standard document wich to fire "load"
			//QUnit.config.blocking=false;
			QUnit.init();
			QUnit.config.autorun=true;
			QUnit.config.semaphore=0;
			
			setup(QUnit);
			sendMessage({
				id:'adaptorInitialized'
			});
		});
	}
	onMessage(function (msg){
//		console.log('testInstance received message '+msg.id);
		switch(msg.id){
			case 'loadTestsSource':
					loadTestsSource(msg);
				break;
			case 'runTest':
					if(msg.test instanceof Array)
						testsQueue.push.apply(testsQueue, msg.test);
					else
						testsQueue.push(msg.test);
					processTestsQueue();
				break;
			case 'testCfg':
					extend(__adaptor__.testCfg, msg.cfg);
				break;
			case 'reset': console.log('reset')
					testCache={};
				break;
		}
	});
};

function attachScript(src, cb, doc){
	if(!doc)
		doc=document;
	var script=doc.createElement('SCRIPT'),
		head=doc.getElementsByTagName('head')[0];
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
}
exports.createTestingInstance=function (cfg){
	var inst={};
	if(isNodeJS){
		var cp = require('child_process');
		inst.child=cp.fork(__dirname + '/../../node.js/testing-instance.js', ['adaptor='+__filename], {env: process.env});
		inst.onMessage=function (fn){
			this.child.on('message', fn);
		};
		inst.sendMessage=function (msg){
			this.child.send(msg);
		};
		inst.disconnect=function (){
			this.child.disconnect();
			delete this.child;
		};
	}else{
		inst.listeners=[];
		inst.el=document.createElement('iframe');
		inst.el.className='testing-instance';
		document.body.appendChild(inst.el);
//		$(inst.el).bind('load', function (){
			/**
			 * TO-DO: try to use asyncFlow instead of nesting callbacks
			 */
			var doc=inst.el.contentWindow.document;
			attachScript(cfg.serverUrl+'/lib/jquery-1.7.1.min.js', function (){
					attachScript(cfg.serverUrl+'/lib/modules.js', function (){
							inst.el.contentWindow.registerModule.loadFromAbsPath(cfg.serverUrl+'/lib/adaptors/qunit', function (exports){
								exports.initialize();
								inst.el.contentWindow.__adaptor__.sendMessage=function (msg){
									for(var i=0; i<inst.listeners.length; i++)
										inst.listeners[i](msg);
								};
							});
						}, doc);
				}, doc);
//		});
		inst.onMessage=function (fn){
			this.listeners.push(fn);
		};
		inst.sendMessage=function (msg){
			this.el.contentWindow.__adaptor__.onMessage(msg);
		};
		inst.disconnect=function (){
			$(this.el).remove();
			delete this.el;
			this.listeners.splice(0, this.listeners.length);
		};
	}	
	return inst;
};

/**
 * 
 */
exports.getTestsInfoList=function (requirePath, cb){
//	console.log('getTestsInfoList ', requirePath);
	var inst=exports.createTestingInstance();
	if(isNodeJS){
		/**
		 * TO-DO: try to reuse the forked process
		 */
		if(requirePath instanceof Array){
			var sources=requirePath.slice(0),	// copy the list
				allTests=[],
				currentTestsList=[];
			inst.onMessage(function sourceComplete(msg){
				if(msg.id=='testRead'){
					currentTestsList.push({
						module:msg.test.module?msg.test.module.name:'',
						fileName:msg.test.fileName,
						name:msg.test.name,
						expect:msg.test.expect
					});

				}else if(msg.id=='allTestsRead'){
					allTests.push({
						fileName:sources.shift(),
						tests:currentTestsList
					});
					processNextSource();
				}
			});
			function processNextSource(){
				if(sources.length){
					currentTestsList=[];
					inst.sendMessage({
						id:'loadTestsSource',
						fileName:sources[0],
						filePath:sources[0]
					});
				}else{
					cb && cb(null, allTests);
					inst.disconnect();
				}
			}
			processNextSource();
		}else{
			var currentTestsList=[];
			inst.onMessage(function (msg){
				if(msg.id=='testRead'){
					currentTestsList.push({
						module:msg.test.module?msg.test.module.name:'',
						fileName:msg.test.fileName,
						name:msg.test.name,
						expect:msg.test.expect
					});

				}else if(msg.id=='allTestsRead'){
					cb && cb(null, currentTestsList);
					inst.disconnect();
				}
			});
			inst.sendMessage({
				id:'loadTestsSource',
				fileName:requirePath,
				filePath:requirePath
			});
		}
	}else{
		/**
		 * not needed for now
		 */
	}
};

}, typeof module=='object'?module:null);

