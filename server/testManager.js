
/**
 * @module
 */
	
var util = require('./lib/util'),
	fs = require("fs"),
	path = require("path"),
	extend=require('./lib/other/jquery.extend'),
	asyncFlow=require('../client/lib/asyncFlow');;

function testsMatch(t1, t2){
	return ((!t1.module && !t2.module) || (t1.module==t2.module)) 
			&& t1.fileName==t2.fileName 
			&& t1.name==t2.name;
}
/**
 * TO-DO: move browser operations into a separate class and call methods on instances.
 */

//function getBrowserUpdateMsg(b){
////	console.dir(b)
//	var m={
//		id:'browserUpdate',
//		data:extend(true, {}, b)
//	};
////	console.log('m:')
////	console.dir(m.data)
//	delete m.data.socket;
//	for(var i=0; i<m.data.testsQueue.length; i++){
////		console.log('m.data.testsQueue['+i+']:')
////		console.dir(m.data.testsQueue[i])
//		delete m.data.testsQueue[i].contents;
//	}
//	return m;
//}

function TestManager(cfg){
	extend(this, {
		/**
		 * @property	{Array}	testFiles	Array of objects with details about available files with tests that can be executed.
		 */
		testFiles:[]
	}, cfg);
	
	if(!('clientManager' in this)){
		this.clientManager=this.server.clientManager;
		delete this.server;
	}
	
	if(typeof this.adaptor=='string'){
		this.adaptor=require(this.adaptor);
		this.adaptor.initialize({});
	}
	
	this.clientManager.on('message', this.onClientMessage.scope(this));
	this.clientManager.on('beforeSendSlaveUpdateMessage', this.onBeforeSendSlaveUpdateMessage.scope(this));
	
	var appCfg=this.clientManager.server.appCfg,
		Connect=require('connect');
	this.clientManager.server.webServer
		.use(appCfg.server.testsUrl, Connect['static'](path.resolve(path.dirname(appCfg.configFileName), appCfg.testsPath)))
		.use(Connect['static'](__dirname + '/../client'))
		.use(Connect.errorHandler({ dumpExceptions: true, showStack:true }));;
	if(appCfg.userLibsPath)
		this.clientManager.server.webServer.use(appCfg.server.userLibsUrl, Connect['static'](path.resolve(path.dirname(appCfg.configFileName), appCfg.userLibsPath)));
	for(var p in appCfg.server.otherUrlMappings)
		this.clientManager.server.webServer.use(appCfg.server.otherUrlMappings[p], Connect['static'](path.resolve(path.dirname(appCfg.configFileName), p)));

	this.reloadTests();
	console.log('Go to '+appCfg.server.protocol+'://'+appCfg.server.host+':'+appCfg.server.port+'/manager/manager.html to manage and run tests');

	for(var b=0, browsers=appCfg.browsers; b<browsers.length; b++)
		this.clientManager.addSlave(extend({
			testsQueue:appCfg.autoRunTests.slice(0)
		}, browsers[b]));
}
require('util').inherits(TestManager, require('events').EventEmitter);
util.extend(TestManager.prototype, {
	onClientMessage:function (mngr, client, msg){
//		console.log('msg '+msg.id);
		switch(msg.id){
//			case 'ready':
//					this.runTests(client);
//				break;
			case 'onTestDone':
	//					console.log('done test '+msg.name);
					for(var i=0, queue=this.clientManager.slaves[client.name].testsQueue; i<queue.length; i++){
						if(testsMatch(queue[i], msg)){
							queue.splice(i, 1);
	//							console.log('removed test '+msg.name);
							break;
						}
					}
					// relay this message to the managers
					this.clientManager.sendMessageToManagerClients(extend({
						browserName:client.name
					}, msg));
					break;
			case 'onTestStart':
					for(var i=0, queue=this.clientManager.slaves[client.name].testsQueue; i<queue.length; i++){
						if(testsMatch(queue[i], msg)){
							this.clientManager.slaves[client.name].runningTest=queue[i];
	//							console.log('starting test '+msg.name);
							break;
						}
					}
	//					var m=extend({
	//						browserName:client.name
	//					}, msg);
	//					for(var a in this.managerClients) // update manager clients
	//						this.managerClients[a].socket.json.send(m);
				// do not break; here and move on with the code in the next case:
			case 'onAssertion':
					// relay this message to the managers
					this.clientManager.sendMessageToManagerClients(extend({
						browserName:client.name
					}, msg));
				break;
			case 'onAllTestsDone':
					var b=this.clientManager.slaves[client.name];
					delete b.runningTest;
					this.clientManager.sendSlaveUpdateMessage(client.name);
				break;
//			case 'getTestData':
//					for(var i=0; i<this.testFiles.length; i++){
//						var test=this.getTest(i);
//						if(test.relFileName==msg.fileName){
//							client.socket.json.send({
//								id:'testData',
//								test:test
//							});
//							break;
//						}
//					}
//				break;
			case 'getTestsList':
					this.getTestFiles(function (err, tests){
						client.socket.json.send({
							id:'testsList',
							data:tests
						});
					});
				break;
			case 'runTests':
					for(var i=0; i<msg.browsers.length; i++){
						var b=this.clientManager.slaves[msg.browsers[i]];
	//clientManager.slavestestsQueue=msg.tests.slice(0); // copy the queue for each browser
						this.runTests(b, msg.tests.slice(0)); // copy the queue for each browser
						this.clientManager.sendSlaveUpdateMessage(msg.browsers[i]);
//						this.sendMessageToManagerClients(getBrowserUpdateMsg(b));
	//						for(var a in this.managerClients) // update manager clients
	//							this.managerClients[a].socket.json.send(getBrowserUpdateMsg(b));
					}
				break;
			case 'reloadTests':
					this.reloadTests();
				break;
		}
	},
	onBeforeSendSlaveUpdateMessage:function (msg){
		msg.data.testsQueue=[];
		for(var i=0, queue=this.clientManager.slaves[msg.data.name]; i<queue.length; i++){
			var t={},
				td=queue[i];
			for(var p in td)
				if(p!='contents')
					t[p]=td[p];
			m.data.testsQueue.push(t);
		}
	},
	getFilesListFromDir:function (dir){
		var files=fs.readdirSync(dir);
		for(var i=0; i<files.length; i++){
			files[i]=path.resolve(dir, files[i]);
			var stat=fs.statSync(files[i]);
			if(stat.isFile()){
				if(path.extname(files[i]).toLowerCase()!='.js')
					files.splice(i--, 1);
			}else{ // is a folder (not sure if this assumption is correct
				var f=this.getFilesListFromDir(files[i]);
				files.splice.apply(files, [i, 1].concat(f));
				i+=f.length-1; // skip over these files
			}
		}
		return files;
	},
	/**
	 * @method	reloadTests
	 */
	reloadTests:function (){
		this.testFiles=true;
		// tell all browsers to abort any running tests and reload the configuration
		for(var br in this.clientManager.slaves){
			var b=this.clientManager.slaves[br];
			delete b.runningTest;
			if(b.connected)
				b.socket.json.send({id:'reset'});
			b.testsQueue=[];
			this.clientManager.sendSlaveUpdateMessage(br);
//			this.sendMessageToManagerClients(getBrowserUpdateMsg(b));  // update manager clients
//			for(var a in this.managerClients)
//				this.managerClients[a].socket.json.send(getBrowserUpdateMsg(b));
		}
		
		var files=this.getFilesListFromDir(path.resolve(path.dirname(this.clientManager.server.appCfg.configFileName), this.clientManager.server.appCfg.testsPath)),
			list=[],
			flow=new asyncFlow.serial({
				data:{
					i:0
				}
			}),
			mngr=this;
		// process all files
		flow.run(function (next){
			if(this.data.i < files.length){
				var file={
					fileName:files[this.data.i],
					relFileName:path.relative(path.resolve(path.dirname(mngr.clientManager.server.appCfg.configFileName), mngr.clientManager.server.appCfg.testsPath), files[this.data.i]),
					tests:[]
				};
				mngr.adaptor.getTestsInfoList(files[this.data.i], function (err, tests){
					file.tests=tests;
					list.push(file);
					flow.repeatCurrentFn();
				});
				++this.data.i;
			}else
				next();
		}, function (next){
			mngr.testFiles=list;
			mngr.emit('testsLoaded', list);
//			mngr.clientManager.sendMessageToManagerClients({
//				id:'testsList',
//				data:list
//			});  // update manager clients
		});
	},
	/**
	 * @method	getTestFiles
	 * Returns a list with all test files and details for the tests they contain.
	 * @return	{Array}
	 */
	getTestFiles:function (cb){
//		console.dir(this.testFiles)
//		console.log(require('util').isArray(this.testFiles))
		if(require('util').isArray(this.testFiles))
			process.nextTick(cb.createCallback(this, [null, this.testFiles]));
		else{
			if(!this.testFiles)
				this.reloadTests();
			this.once('testsLoaded', function (testFiles){
				cb(null, testFiles);
			});
		}
	},
//	/**
//	 * @method	getTest
//	 * Returns the test file details for the specified index.
//	 * @param	{Number} ind	The index of the test.
//	 * @return	{Object}
//	 */
//	getTest:function (ind, cb){
//		if(typeof this.testFiles[ind]=='string'){
//			this.testFiles[ind]={
//				fileName:this.testFiles[ind],
//				relFileName:path.relative(path.resolve(path.dirname(this.clientManager.server.appCfg.configFileName), this.clientManager.server.appCfg.testsPath), this.testFiles[ind]),
//				contents:fs.readFileSync(this.testFiles[ind], 'utf8'),
//				tests:this.adaptor.getTestsInfoList(this.testFiles[ind])
//			};
//		}
//		return this.testFiles[ind];
//	},
	/**
	 * @method	runTests
	 * Run queued tests for the specified browser or for all browsers if not specified. 
	 * @param	{Object}	(optional) browser
	 * @param	{Array}	(optional) testsList	The tests to run. If specified will replace what is in the testsQueue
	 */
	runTests:function (browser, testsList){
		if(browser){
			if(testsList)
				browser.testsQueue=testsList;
			if(browser.connected && browser.testsQueue.length && !browser.runningTest){
				browser.runningTest=true;
				browser.socket.json.send({
					id:'runTests',
					tests:browser.testsQueue
				});
			}
		}else
			for(var br in this.clientManager.slaves)
				this.runTests(this.clientManager.slaves[br]);
	}
});

exports.init=function (cfg){
	return new TestManager(cfg);
};
exports.TestManager=TestManager;