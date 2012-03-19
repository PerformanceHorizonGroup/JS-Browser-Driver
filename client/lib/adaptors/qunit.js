(registerModule || function (){}).call(this, function (module){
	var exports=module.exports,
		require=module.require;
		
module.asyncLoading=true; // tell the module loader that we're not ready yet
// load the QUnit library
driver.attachScript('/lib/qunit.js', function (){
	module.asyncLoading(); // tell the module loader that we're now ready
});

/**
 * This code intercepts calls to the QUnit testing library to allow tests written for that library to run in BrowserDriver.
 */

exports.initialize=function (driver){
	// check if QUnit is loaded.
	// ( it *may not* be loaded if for exampe tests are only loaded so they can be catalogued )
	if('QUnit' in window){
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
	}
	
	// intercept QUnit's test functions
	var origTest=window.test,	
		origAsyncTest=window.asyncTest,
		origModule=window.module,
		
		currentModule='',
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
	
	driver.bind('beforeLoadTestSource', function (obj, src){
		currentModule='';
		currentFileName=src;
	});
	
	if('QUnit' in window){
		function initQUnit(obj){
			QUnit.init();
			QUnit.config.autorun=true;
		}
		driver.bind('reset', initQUnit);
		initQUnit();
	}
};

});

