(function ($){
	
	/**
	 * TO-DO: setup tests as "runnable" objects so they can easily be managed (started, stopped, etc.)
	 * TO-DO: check the possibility of running in PhantomJS as a headless browser slave.
	 */

	if(!('console' in window)) // add this so browsers that don't have cosole.log() will not throw errors
		window.console={ log:$.noop };
		
	if(!('BrowserDriver' in window))
		window.BrowserDriver={};

	function testsMatch(t1, t2){
		return ((!t1.module && !t2.module) || (t1.module==t2.module)) 
				&& t1.fileName==t2.fileName 
				&& t1.name==t2.name;
	}
	
	/**
	 * @class	BrowserDriver.Driver
	 * @extends	EventEmitter
	 * @singleton
	 * Creates and manages the connection with the server and the execution environment for tests.
	 * It does not currently provide any means for directly running tests and monitoring test execution and instead relies
	 * on a separate testing library to do the job (uses QUnit by default). The testing library is hooked by adaptor
	 * which ensures the library receives proper input and test output is sent to the environment. This way the rules for
	 * writing a test are those of the library and nothing else.
	 */
	window.BrowserDriver.Driver=new EventEmitter({
		initialize:function (){
			this.targetSiteFrame=$('iframe[name=targetSite]');
//			/**
//			 * @property	{Object}	adaptor	The adaptor object must have initialize() method which will be called when the driver initializes.
//			 */
//			if(this.adaptor)
//				this.adaptor.initialize();
			this.initialized=true;
		},
		runNextBrowserTest:function (){
			if(this.testsQueue.length && !this.runningTest && !this.storage.loadingLibs && !this.storage.loadingModules){
				var t=this.testsQueue[0];
				if(t.fileName in this.testSources){ // the SCRIPT either has been loaded or is now loading
					console.log('running: '+t.name+' in '+t.fileName);
					t.testEnvironment={};
					this.runningTest=t;
					if(!('fn' in t)){
						var ind=this.getTestInd(t, this.testCache);
						if(ind>-1)
							t.fn=this.testCache[ind].fn;
					}
					/**
					 * TO-DO: amend the test environment with that of the current module if there is one
					 */
					if('fn' in t)
						t.fn(); //.call(t.testEnvironment); // set scope to the testEnvironment object
					else
						console.log('waiting for test function ...');
				}else{ // the SCRIPT has not been loaded
					this.loadTestSource(t.fileName); //, this.runNextBrowserTest.scope(this));
				}
			}
		},
		/**
		 * @method onTestStart
		 * Logger method to be called when a test starts running.
		 * @param	{Object}	data
		 * A hash with details about the test. Expected keys are "module", "fileName" and "name".
		 */
		onTestStart:function (data){
			console.log('start test "'+data.name+'"');
			driver.socket.json.send($.extend({
				id:'onTestStart'
			}, data));
		},
		/**
		 * @method onTestDone
		 * Logger method to be called when a test is over.
		 * @param	{Object}	data
		 * A hash with details about the test and the results. Expected keys are "module", "fileName", "name", "failed", "passed" and "total".
		 */
		onTestDone:function (data){
			console.log('done test "'+data.name+'"');
			driver.testsQueue.shift();
			delete driver.runningTest;
//					console.log('removing from queue test "'+t.name+'"');
			driver.socket.json.send($.extend({
				id:'onTestDone'
			}, data));
			if(driver.testsQueue.length)
				driver.runNextBrowserTest();
			else{
				driver.targetSiteFrame.unbind(); // clean up all attached listeners
				console.log('all tests done !');
				if(driver.socket)
					driver.socket.json.send({
						id:'onAllTestsDone'
					});
			}
		},
		/**
		 * @method onAssertion
		 * Logger method to be called when an assertion is evaluated.
		 * @param	{Object}	data
		 * A hash with details about the test and the assertion. Expected keys are "module", "fileName", "name", "result", "expected", "actual" and "message".
		 */
		onAssertion:function (data){
			console.log('test assertion '+(data.message||'')+' in "'+data.name+'"');
			driver.socket.json.send($.extend({
				id:'onAssertion'
			}, data));
		},
		getTestInd:function (testData, testslist){
			var ind=-1;
			if(!testslist)
				testslist=this.testsQueue;
			for(var i=0; i<testslist.length; i++){
				if(testsMatch(testData, testslist[i])){
					ind=i;
					break;
				}
			}
			return ind;
		},
		/**
		 * @method onTestRead
		 * Must be called when a test is loaded.
		 * @param	{Object}	testData	A hash with details about the test. Expected keys are "module", "fileName", "name", "fn" and "expect".
		 */
		onTestRead:function (testData){
//			console.log('onTestRead: '+testData.name);
//			console.log('onTestRead: '+testData.fileName);
//			console.log('onTestRead: '+testData.module);
			var ind=driver.getTestInd(testData, driver.testCache);
			if(ind > -1)
				$.extend(driver.testCache[ind], testData);
			else // if not already in the cache then add it
				driver.testCache.push(testData);
	        /**
	         * @event testRead
	         * Fires when a test has been loaded.
	         * @param {BrowserDriver.Driver} this
	         * @param {Object}	testData
	         */
			driver.trigger('testRead', [testData]);
			
			// check if we are waiting for the next test to load
			if(!driver.runningTest && driver.testsQueue.length && testsMatch(driver.testsQueue[0], testData))
				driver.runNextBrowserTest();
		},
		/**
		 * @method reset
		 * Remove all cached data for tests, loaded user libraries and stylesheets.
		 */
		reset:function (){
			for(var l in this.testSources)
				if(this.testSources[l].contents)
					$(this.testSources[l].contents).remove();
			this.testSources={};
			this.testCache.splice(0, this.testCache.length);
			for(var l in this.userLibs)
				if(this.userLibs[l].contents)
					$(this.userLibs[l].contents).remove();
			this.userLibs={};
			for(var l in this.storage.userStylesheets)
				if(this.storage.userStylesheets[l])
					$(this.storage.userStylesheets[l]).remove();
			this.storage.userStylesheets={};
			this.testsQueue=[];
			delete this.runningTest;
			delete this.storage.loadingLibs;
			
	        /**
	         * @event reset
	         * Fires after the environment has been reset.
	         * @param {BrowserDriver.Driver} this
	         */
			this.trigger('reset');
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
			if(!driver.storage.driverModule) // this module for now is only used to get access to the module loading system's require() function
				driver.storage.driverModule=registerModule({
					url:driver.storage.appCfg.server.protocol+'://'+driver.storage.appCfg.server.host+':'+driver.storage.appCfg.server.port+'/browserDriver',
					exports:{
						driver:window.driver
					}
				});
			if(this.storage.appCfg.modules.length){
				this.storage.loadingModules=true;
				this.storage.driverModule.require(this.storage.appCfg.modules, function (modules){
					var asyncCount=1; // set to one because there is that extra call few lines below
					function checkComplete(){
						if(--asyncCount<1){
							delete driver.storage.loadingModules;
							driver.trigger('initModules');
						}
					}
					for(var i=0; i<modules.length; i++)
						modules[i].initialize(driver, checkComplete)===false && ++asyncCount; // increment the counter if the module needs to complete asyncronously
					checkComplete();
				});
			}
		},
		/**
		 * @property	{Object} testSources
		 * A hash with loaded (or still loading) test source files with the relative file paths as keys.
		 */
		testSources:{},
		/**
		 * @property	{Object} userLibs
		 * A hash with loaded (or still loading) user libraries with the relative file paths as keys.
		 */
		userLibs:{},
		/**
		 * @property	{Array} testCache
		 * A list of all loaded tests.
		 */
		testCache:[],
		storage:{
			userStylesheets:{}
		},
		loadStylesheet:function (src, cb){
			if(driver.initialized){
				if(!(src in driver.storage.userStylesheets)){
					var link=document.createElement('link'),
						head=document.head||$('head').get(0);

					driver.storage.userStylesheets[src]=link;

					src = driver.storage.socketIOServerLocation
								+'/manager/tests/lib/'
								+src+'?cb='+(new Date()).getTime();

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
			}
		},
		/**
		 * @method attachScript
		 * Appends a SCRIPT element to the HEAD.
		 * @param	{String}	src	The "src" attribute to set.
		 * @param	{Function}	cb	A callback to invoke when the element loads.
		 */
		attachScript:function (src, cb){
			var script=document.createElement('SCRIPT'),
				head=document.head||$('head').get(0);
			script.src=src;
			script.type='text/javascript';
			
			if($.browser.msie) // no load event in IE so wait for readyState
				script.onreadystatechange=function(){
					if(script.readyState == 'complete' || script.readyState == 'loaded'){
						script.onreadystatechange=null;
						$(script).remove();
						if(cb)
							cb();
					}
				};
			else
				$(script).one('load', function (){
					$(script).remove();
					if(cb)
						cb()
				});
				
			head.appendChild(script);
			
			return script;
		},
		/**
		 * @method loadLib
		 * Loads a JS library.
		 * @param	{String}	lib	The path of the JS library file relative to the "userLibsPath" property in the test configuration file (may or may not include the .js file extension).
		 */
		loadLib:function (lib){
			if(driver.initialized){
				if(!/\.js$/.test(lib))
					lib+='.js';
				if(!(lib in driver.userLibs)){
					driver.storage.loadingLibs=true;
					var src = driver.storage.socketIOServerLocation
									+'/manager/tests/lib/'
									+lib+'?cb='+(new Date()).getTime();
					driver.userLibs[lib]={
						contents:driver.attachScript(src, function (){
							delete driver.userLibs[lib].loading;
							var loading=false;
							for(var l in driver.userLibs)
								if(driver.userLibs[l].loading){
									loading=true;
									break;
								}
							if(!loading)
								delete driver.storage.loadingLibs;
					        /**
					         * @event loadLib
					         * Fires after a user library's SCRIPT tag has been loaded.
					         * @param {BrowserDriver.Driver} this
					         * @param {String}	lib
					         */
							driver.trigger('loadLib', [lib]);
						}),
						loading:true
					};
				}
			}
		},
		/**
		 * @method loadTestSource
		 * Loads a test source file so tests in it are registered in the environment and ready (but not scheduled) to be run. All loaded tests
		 * are added to the "testCache" list.
		 * @param	{String}	src	The path of the test file relative to the "testsPath" property in the test configuration file.
		 */
		loadTestSource:function (src){
			if(src in driver.testSources)
				$(driver.testSources[src].contents).remove();
	        /**
	         * @event beforeLoadTestSource
	         * Fires before a SCRIPT tag is inserted into the DOM. Returning false from a handler will abort the operation.
	         * @param {BrowserDriver.Driver} this
	         * @param {String}	src
	         */
			if(driver.trigger('beforeLoadTestSource', [src])!==false)
				driver.testSources[src]={
					contents:driver.attachScript(driver.storage.socketIOServerLocation
														+'/manager/tests/sources/'
														+src+'?cb='+(new Date()).getTime())
				};
		},
		/**
		 * @property	{Array} testsQueue
		 * The list of scheduled tests.
		 */
		testsQueue:[],
		socket:null,
		util:{
			toAbsoluteUrl:function (url, baseUrl){
				if(/^\w+:\/\//.test(url)) // if already absolute
					return url;	// return it as is
				else if(url.charAt(0)=='/') // if relative to root
					return baseUrl.match(/^\w+:\/\/[^\/]+/)[0]+url;	//	prepend the host of the base url
				else	// must be relative
					return baseUrl.match(/^\w+:\/\/[^\/]+[^#\?]*\//)[0]+url;
			}
		}
	});

	window.driver=window.BrowserDriver.Driver;
	
}(jQuery));

if(!('Manager' in window.BrowserDriver)) // this code should not run if loaded in the manager app
	$(document).ready(function (){
		// get url parameters
		driver.storage.urlParams={};
		
		var parts=window.location.search.substring(1).split('&');
		for(var i=0; i<parts.length; i++){
			var p=parts[i].split('=');
			if(p.length==2)
				driver.storage.urlParams[p[0]]=p[1];
		}
		
		driver.storage.socketIOServerLocation=driver.storage.urlParams.socketIOServerProtocol+'://'+driver.storage.urlParams.socketIOServerHost+':'+driver.storage.urlParams.socketIOServerPort;
	
		driver.bind('loadLib', function (obj, lib){
			if(!driver.storage.loadingLibs && this.testsQueue.length)
				driver.runNextBrowserTest();
		});
		
		var log=function (msg){console.log(msg)};
		function closeWindow(msg){
			if(msg)
				log(msg);
			driver.socket.disconnect();
			log('closing window')
			window.close();
		}
		
		var retries=0,
			interval=null;
		function startSocketIO(){
			if('io' in window){
				clearInterval(interval);
				driver.socket=io.connect(driver.storage.urlParams.socketIOServerProtocol+'://'+driver.storage.urlParams.socketIOServerHost, {port:driver.storage.urlParams.socketIOServerPort, rememberTransport:false});
				driver.socket.on('connect', onConnect);
				driver.socket.on('message', onMessage);
				driver.socket.on('reconnect_failed', function (){
					closeWindow('reconnect failed');
				});
			}
		}
		interval=setInterval(startSocketIO, 500);
		
		/**
		 * TO-DO: implement RMI-style messaging. that should make it easier to sequence messages
		 */
		function onConnect(){
			log('sending capture message');
			driver.socket.json.send({
				id:'capture',
				browserName:driver.storage.urlParams.browserName
			});
		}
		function onMessage(msg){
			console.log('msg '+JSON.stringify(msg));
			switch(msg.id){
				case 'capture':
						if(msg.result=='rejected')
							closeWindow('rejected by the server');
						else{
							log('captured');
							driver.reset();
							if('tests' in msg)
								driver.testsQueue=msg.tests;
							if('appCfg' in msg){
								driver.storage.appCfg=msg.appCfg;
								driver.initModules();
							}
						}
					break;
				case 'appCfg':
						driver.storage.appCfg=msg.appCfg;
					break;
				case 'runTests':
						driver.reset();
						driver.testsQueue=msg.tests;
						driver.runNextBrowserTest();
					break;
//				case 'testData':
//						if(driver.waitingForTestData){
//							driver.testSources[msg.test.fileName]={
//								contents:msg.test.contents
//							};
//							driver.waitingForTestData=false;
//							driver.runNextBrowserTest();
//						}
//					break;
				case 'disconnect':
						closeWindow('disconnect ordered by the server');
				case 'reset':
						driver.reset();
						/**
						 * TO-DO: try to stop the test runner if it is progreessing with some tests. It may not be possible though as running test code can not be controlled
						 */
					break;
			}
		}
	});