// if registerModule is defined call that. if not then this has
// been loaded as a node.js module and the code can execute right away.
(typeof registerModule=='function' ? registerModule : function (fn){fn(module, require);}).call(this, function (module, require){
	var exports=module.exports;
		
/**
 * This code intercepts calls to the QUnit testing library to allow tests written for that library to run in BrowserDriver.
 */

var driverObj=null;
exports.initialize=function (driver, cb){
	var origTest, origAsyncTest, origModule;
	
	driverObj=driver;
	
	// load the QUnit library
	if(typeof window=='object'){
		driver.attachScript(driver.util.toAbsoluteUrl('/lib/qunit.js', module.url), function (){
	//		// check if QUnit is loaded.
	//		// ( it *may not* be loaded if for exampe tests are only loaded so they can be catalogued )
	//		if('QUnit' in window){
				QUnit.testStart=function (data){
					data=$.extend({
						name:driver.runningTest.name,
						module:driver.runningTest.module,
						fileName:driver.runningTest.fileName
					}, data);
					driver.onTestStart(data);
				};
				QUnit.testDone=function (data){
					data=$.extend({
						name:driver.runningTest.name,
						module:driver.runningTest.module,
						fileName:driver.runningTest.fileName
					}, data);
					driver.onTestDone(data);
				};
		//			QUnit.done=function (data){
		//				data=$.extend({}, data);
		//				driver.onAllTestsDone(data);
		//			};
				QUnit.log=function (data){
					if(driver.runningTest){
						data=$.extend({
							name:driver.runningTest.name,
							module:driver.runningTest.module,
							fileName:driver.runningTest.fileName
						}, data);
						driver.onAssertion(data);
					}
				};
	//		}
			
			// intercept QUnit's test functions
			origTest=window.test;
			origAsyncTest=window.asyncTest;
			origModule=window.module;
				
			var currentModule='',
				currentFileName='';
			
			window.test=function (testName, expected, callback){
				var mod=currentModule,
					args=Array.prototype.slice.call(arguments, 0);
				if(args.length === 2){
					args[2]=args[1]; // callback = expected;
					args[1]=1; // expected = 1;
					expected=1;
				}
				var fn=args[2];
				args[2]=function (){
					fn.call(driver.runningTest.testEnvironment);  // set scope to driver.runningTest because QUnit will set it to its test environment object
				};
				driver.onTestRead(
					{
						module:currentModule, 
						fileName:currentFileName, 
						name:testName, 
						fn:function (){
							origModule(mod); 
							origTest.apply(window, args);
						},
						expect:expected
					}
				);
			};
			
			window.asyncTest=function (testName, expected, callback){
				var mod=currentModule,
					args=Array.prototype.slice.call(arguments, 0);
				if(args.length === 2){
					args[2]=args[1]; // callback = expected;
					args[1]=1; // expected = 1;
					expected=1;
				}
				var fn=args[2];
				args[2]=function (){
					fn.call(driver.runningTest.testEnvironment);  // set scope to driver.runningTest because QUnit will set it to its test environment object
				};
				driver.onTestRead(
					{
						module:currentModule, 
						fileName:currentFileName, 
						name:testName, 
						fn:function (){
							origModule(mod); 
							origAsyncTest.apply(window, args);
						},
						expect:expected
					}
				);
		
			};
			
			/**
			 * TO-DO: add handling of module lifecycle configuration
			 */
			window.module=function (name, lifecycle){
				currentModule=name;
				if(lifecycle)
					driver
		//			origModule.apply(window, arguments);
			};
			
			driver.on('beforeLoadTestSource', function (src){
				currentModule='';
				currentFileName=src;
			});
			
			if('QUnit' in window){
				function initQUnit(){
					QUnit.init();
					QUnit.config.autorun=true;
				}
				driver.on('reset', initQUnit);
				initQUnit();
			}
	
			cb && cb();
		});
		return false; // return false because we need some more time to complete initialization
	}else{ //	this must be node.js
		
	}
};

var inst=null;
/**
 * 
 */
exports.getTestsInfoList=function (requirePath, cb){
	if(typeof window=='object'){
//		driverObj.doLoadTestSource(requirePath);
	}else{ //	this must be node.js
		/**
		 * TO-DO: allow requirePath to be an array of files to process
		 */
		if(!inst){
			var cp = require('child_process'),
				child=cp.fork(__dirname + '/qunit-testing-instance.js', [], {env: process.env});
			child.on('message', function (msg){
				if(msg.id=='listTests')
					cb && cb(null, msg.tests);
			});
			child.send({
				id:'listTests',
				testFiles:[requirePath]
			});
		}
	}
};

}, typeof module=='object'?module:null);

