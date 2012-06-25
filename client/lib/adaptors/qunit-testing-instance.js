var extend=require('jquery.extend'),
	QUnit=require('../qunit'),
	fs = require('fs'),
	vm = require('vm'),
	testAction='run',
	tests=[];

global.driver={
	loadLib:function (){}
};

global.test=function (testName, expected, callback){
	if(testAction=='run'){
		QUnit.test(testName, expected, callback);
	}else if(testAction=='list'){
		if(typeof expected == 'function'){
			callback=expected; // callback = expected;
			expected=1;
		}
		tests.push({
			name:testName,
			expected:expected,
			module:currentModuleName
		});
	}
};
global.asyncTest=function (testName, expected, callback){
	if(testAction=='run'){
		QUnit.asyncTest(testName, expected, callback);
	}else if(testAction=='list'){
		if(typeof expected == 'function'){
			callback=expected; // callback = expected;
			expected=1;
		}
		tests.push({
			name:testName,
			expect:expected,
			module:currentModuleName
		});
	}
};
var currentModuleName='';
//	currentModuleLC=null;
global.module=function (name, lifecycle){
	if(testAction=='run'){
		QUnit.module(name, lifecycle);
	}else if(testAction=='list'){
		currentModuleName=name;
//		currentModuleLC=lifecycle;
	}
};

process.on('message', function (msg){
	if(msg.id=='listTests'){
//		console.log('listTests');
		testAction='list';
		tests=[];
		for(var i=0; i<msg.testFiles.length; i++){
			currentModuleName='';
//			currentModuleLC=null;
			var fileName=msg.testFiles[i];
			vm.runInThisContext(
			    '(function(){'+ fs.readFileSync(fileName, 'utf-8') +'}())',
			    fileName
			);
		}
		process.send({
			id:'listTests',
			tests:tests
		});
	}
});
