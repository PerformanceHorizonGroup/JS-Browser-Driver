/**
 * @module
 */
	
var util = require('./lib/util'),
	fs = require("fs"),
	path = require("path"),
	events=require('events'),
	sys=require('util'),
	extend=require('./lib/other/jquery.extend');

/**
 * TO-DO: rework this function to work asynchronously and adjust the code that relies on it.
 * TO-DO: move browser operations into a separate class and call methods on instances.
 */
function getFilesListFromDir(dir){
	var files=fs.readdirSync(dir);
	for(var i=0; i<files.length; i++){
		files[i]=path.resolve(dir, files[i]);
		var stat=fs.statSync(files[i]);
		if(stat.isFile()){
			if(path.extname(files[i]).toLowerCase()!='.js')
				files.splice(i--, 1);
		}else{ // is a folder (not sure if this assumption is correct
			var f=getFilesListFromDir(files[i]);
			files.splice.apply(files, [i, 1].concat(f));
			i+=f.length-1; // skip over these files
		}
	}
	return files;
}
function testsMatch(t1, t2){
	return ((!t1.module && !t2.module) || (t1.module==t2.module)) 
			&& t1.fileName==t2.fileName 
			&& t1.name==t2.name;
}


function getBrowserUpdateMsg(b){
//	console.dir(b)
	var m={
		id:'browserUpdate',
		data:extend(true, {}, b)
	};
//	console.log('m:')
//	console.dir(m.data)
	delete m.data.socket;
	for(var i=0; i<m.data.testsQueue.length; i++){
//		console.log('m.data.testsQueue['+i+']:')
//		console.dir(m.data.testsQueue[i])
		delete m.data.testsQueue[i].contents;
	}
	return m;
}
/**
 * @class BrowserManager
 * @extends	events.EventEmitter
 * @private
 * Maintains the connections with browsers. Mostly relays messages from the manager application 
 * to the slave browsers and back but also executes commands from the manager application.
 */
function mngr(cfg){
	/**
	 * @cfg	{Object}	appCfg	The application configuration object.
	 */
	util.extend(this, {
		/**
		 * @property	{Object}	browsers	A hash with available slave browsers, keyed by browser names.
		 */
		browsers:{},
		/**
		 * @property	{Array}	tests	Array of objects with details about available files with tests that can be executed.
		 */
		tests:[]
	}, cfg);
	events.EventEmitter.call(this);
	
	/**
	 * @property	{Object}	managerClients	A hash with connected manager applications, keyed by socket.io ids.
	 */
	this.managerClients={};
	
	this.reloadTests();
}
sys.inherits(mngr, events.EventEmitter);
util.extend(mngr, {
	/**
	 * @method	loadTestsFromDirectory
	 * @param	{String} dir	The path to load tests from.
	 */
	loadTestsFromDirectory:function (dir){
		this.tests.splice.apply(this.tests, [0, this.tests.length].concat(getFilesListFromDir(dir)));  // clear the list keeping the object reference and add the new files
	},
	/**
	 * @method	reloadTests
	 */
	reloadTests:function (){
		// tell all browsers to abort any running tests and reload the configuration
		for(var br in this.browsers){
			var b=this.browsers[br];
			delete b.runningTest;
			if(b.connected)
				b.socket.json.send({id:'reset'});
			b.testsQueue=[];
			this.sendMessageToManagerClients(getBrowserUpdateMsg(b));  // update manager clients
//			for(var a in this.managerClients)
//				this.managerClients[a].socket.json.send(getBrowserUpdateMsg(b));
		}
		
		this.loadTestsFromDirectory(path.resolve(path.dirname(this.appCfg.configFileName), this.appCfg.testsPath));

		var list=[];
		for(var i=0; i<this.tests.length; i++){
			var test=this.getTest(i);
			list.push({
				name:test.relFileName,
				source:test.contents
			});
		}
		this.sendMessageToManagerClients({
			id:'testsList',
			data:list
		});  // update manager clients
//		for(var a in this.managerClients) // update manager clients
//			this.managerClients[a].socket.json.send({
//				id:'testsList',
//				data:list
//			});
	},
	/**
	 * @method	getTest
	 * Returns the test file details for the specified index.
	 * @param	{Number} ind	The index of the test.
	 * @return	{Object}
	 */
	getTest:function (ind){
		if(typeof this.tests[ind]=='string'){
			this.tests[ind]={
				fileName:this.tests[ind],
				relFileName:path.relative(path.resolve(path.dirname(this.appCfg.configFileName), this.appCfg.testsPath), this.tests[ind]),
				contents:fs.readFileSync(this.tests[ind], 'utf8')
			};
		}
		return this.tests[ind];
	},
	/**
	 * @method	sendMessageToManagerClients
	 * @param	{Object} msg
	 */
	sendMessageToManagerClients:function (msg){
		for(var a in this.managerClients)
			this.managerClients[a].socket.json.send(msg);
	},
	/**
	 * @method	handleBrowserMessage
	 * @param	{Object} client
	 * @param	{Object} msg
	 */
	handleBrowserMessage:function (client, msg){
//		console.log('message '+msg.id)
		switch(msg.id){
			case 'capture':
					if((msg.browserName in this.browsers) && !this.browsers[msg.browserName].connected){
//						console.log('capture request from '+client.socket.id)
						this.onConnectBrowser(client, msg.browserName);
						var m={
							id:'capture',
							result:'captured'
						};
						if(this.browsers[client.name].testsQueue.length)
							m.tests=this.browsers[client.name].testsQueue;
//						console.dir(m)
						client.socket.json.send(m);
					}else{
						client.socket.json.send({
							id:'capture',
							result:'rejected'
						});
					}
				break;
			case 'ready':
					this.runTests(client);
				break;
			case 'onTestDone':
//					console.log('done test '+msg.name);
					for(var i=0, queue=this.browsers[client.name].testsQueue; i<queue.length; i++){
						if(testsMatch(queue[i], msg)){
							queue.splice(i, 1);
//							console.log('removed test '+msg.name);
							break;
						}
					}
					// relay this message to the managers
					this.sendMessageToManagerClients(extend({
						browserName:client.name
					}, msg));
					break;
			case 'onTestStart':
					for(var i=0, queue=this.browsers[client.name].testsQueue; i<queue.length; i++){
						if(testsMatch(queue[i], msg)){
							this.browsers[client.name].runningTest=queue[i];
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
					this.sendMessageToManagerClients(extend({
						browserName:client.name
					}, msg));
				break;
			case 'onAllTestsDone':
					var b=this.browsers[client.name];
//					b.testsQueue.shift();
					delete b.runningTest;
//					this.emit('allTestsDone', b);
//					this.runNextBrowserTest(b);
					this.sendMessageToManagerClients(getBrowserUpdateMsg(b));
//					for(var a in this.managerClients) // update manager clients
////						if(b.testsQueue.length)
//							this.managerClients[a].socket.json.send(getBrowserUpdateMsg(b));
				break;
			case 'registerManagerClient':
					this.managerClients[client.socket.id]=client;
//					console.log('Registered manager client '+client.socket.id);
				break;
			case 'getBrowserUpdates':
					for(var b in this.browsers)
						client.socket.json.send(getBrowserUpdateMsg(this.browsers[b]));
				break;
			case 'getAppCfg':
//			console.dir(this.appCfg)
					client.socket.json.send({
						id:'appCfg',
						appCfg:this.appCfg
					});
				break;
			case 'getTestData':
					for(var i=0; i<this.tests.length; i++){
						var test=this.getTest(i);
						if(test.relFileName==msg.fileName){
							client.socket.json.send({
								id:'testData',
								test:test
							});
							break;
						}
					}
				break;
			case 'getTestsList':
					var list=[];
					for(var i=0; i<this.tests.length; i++){
						var test=this.getTest(i);
						list.push({
							name:test.relFileName,
							source:test.contents
						});
					}
					client.socket.json.send({
						id:'testsList',
						data:list
					});
				break;
			case 'runTests':
					for(var i=0; i<msg.browsers.length; i++){
						var b=this.browsers[msg.browsers[i]];
//						b.testsQueue=msg.tests.slice(0); // copy the queue for each browser
						this.runTests(b, msg.tests.slice(0)); // copy the queue for each browser
						this.sendMessageToManagerClients(getBrowserUpdateMsg(b));
//						for(var a in this.managerClients) // update manager clients
//							this.managerClients[a].socket.json.send(getBrowserUpdateMsg(b));
					}
				break;
			case 'reloadTests':
					this.reloadTests();
				break;
			case 'runBrowser':
//					if(msg.name in this.browsers)
						this.runBrowser(msg.name);
				break;
			case 'disconnectBrowser':
//					if(msg.name in this.browsers)
						this.disconnectBrowser(msg.name);
				break;
		}
        /**
         * @event message
         * Fires when a message has been received.
         * @param {BrowserManager} this
         * @param {Object}	client
         * @param {Object}	msg
         */
		this.emit('message', client, msg);
	},
	/**
	 * @method	onConnectBrowser
	 * @param	{Object} client
	 * @param	{String} browserName
	 */
	onConnectBrowser:function (client, browserName){
		if(browserName in this.browsers){
			client.name=browserName; // this is needed in webServer.js for ".on('disconnect' ..." . (not a good idea to do it like this though :-()
			extend(this.browsers[browserName], client); //this.browsers[browserName]=
			var b=this.browsers[browserName];
			b.name=browserName;
			console.log('Browser '+b.name+' connected');
			b.connected=true;
//			var b=util.extend(b, client);
			this.emit('browserConnected', b);
			this.sendMessageToManagerClients(getBrowserUpdateMsg(b));
//			for(var a in this.managerClients) // update manager clients
//				this.managerClients[a].socket.json.send(getBrowserUpdateMsg(b));
//			for(var i=0; i<this.tests.length; i++)
//				b.testsQueue.push(this.getTest(i));
//			if(this.testing)
//				this.runTests(b);
		}
	},
	/**
	 * @method	onDisconnectBrowser
	 * Cleanup after a browser has disconnected
	 * @param	{String} browserName
	 */
	onDisconnectBrowser:function (browserName){
		if((browserName in this.browsers) && this.browsers[browserName].connected){
			console.log('Browser '+browserName+' was disconnected');
			this.emit('browserDisconnected', this.browsers[browserName]);
			this.browsers[browserName].connected=false;
			delete this.browsers[browserName].runningTest;
			delete this.browsers[browserName].socket;
			this.sendMessageToManagerClients(getBrowserUpdateMsg(this.browsers[browserName]));
//			for(var a in this.managerClients) // update manager clients
//				this.managerClients[a].socket.json.send(getBrowserUpdateMsg(this.browsers[browserName]));
		}
	},
	/**
	 * @method	disconnectBrowser
	 * Send disconnect message to the browser
	 * @param	{String} browserName
	 */
	disconnectBrowser:function (browserName){
		if((browserName in this.browsers) && this.browsers[browserName].connected){
//			console.log('Browser '+browserName+' was disconnected');
			this.browsers[browserName].socket.json.send({
				id:'disconnect'
			});
		}
	},
	/**
	 * @method	addBrowser
	 * Add browser to the list of available browsers.
	 * @param	{Object} browser
	 */
	addBrowser:function (browser){
		if(!(browser.name in this.browsers)){
			if(!browser.testsQueue)
				browser.testsQueue=[];
			this.browsers[browser.name]=browser;
//			console.log(browser.testsQueue.length+' tests for '+browser.name)
		}
	},
	/**
	 * @method	runBrowser
	 * Runs the application for the specified browser.
	 * @param	{String} browserName
	 */
	runBrowser:function (browserName){
		if((browserName in this.browsers) && ('app' in this.browsers[browserName])){
			console.log('starting browser: '+browserName+'('+this.browsers[browserName].app+' "'+this.browsers[browserName].args.join('" "')+'")');
//			if(process.platform=='win32')
//				console.log('child_process is not available in native Windows builds so nothing can be started !!!!');
//			else
				require('child_process').spawn(
								this.browsers[browserName].app, 
								this.browsers[browserName].args.concat([
//													this.appCfg.server.siteBaseUrl+
													this.appCfg.server.browserDriverUrl
													+'?socketIOServerProtocol='+this.appCfg.server.SocketIO.protocol+'&socketIOServerHost='+this.appCfg.server.SocketIO.host+'&socketIOServerPort='+this.appCfg.server.SocketIO.port
													+'&browserName='+browserName
												]
							));
		}
	},
	/**
	 * @method	removeBrowser
	 * Disconnect a browser and remove it from the list of available browsers.
	 * @param	{String} browserName
	 */
	removeBrowser:function (browserName){
		if(browserName in this.browsers){
			this.disconnectBrowser(browserName)
//			if(this.browsers[browserName].connected)
//				this.browsers[browserName].socket.close();
			delete this.browsers[browserName]; // this is not very clean way to remove the browser because some time after the close() method is called a 'dsconnect' will be fired 
		}
	},
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
//				this.testing=true;
				browser.runningTest=true;
				browser.socket.json.send({
					id:'runTests',
					tests:browser.testsQueue
				});
			}
		}else
			for(var br in this.browsers)
				this.runTests(this.browsers[br]);
//		for(var i=0; i<this.tests.length; i++){
//			for(var b in this.browsers)
//				this.browsers[b].testsQueue.push(this.getTest(i));
//		}
		
//		this.testing=true;
//		for(var b in this.browsers){
//			if(b.connected && b.testsQueue.length && !b.runningTest){
////				var test=b.testsQueue[0];
//				b.runningTest=true;
//				b.socket.json.send({
//					id:'runTests',
//					tests:b.testsQueue
//				});
//			}
////			this.runNextBrowserTest(this.browsers[b]);
//		}
//		for(var a in this.managerClients) // update manager clients
//			if(this.browsers[b].testsQueue.length)
//				this.managerClients[a].socket.json.send(getBrowserUpdateMsg(this.browsers[b]));
	}
});

/**
 * @moduleFunction	create
 * Creates and returns an instance of browserManager.BrowserManager
 * @param	{Object} cfg
 * @return	{browserManager.BrowserManager}
 */
exports.create=function (cfg){
	return new mngr(cfg);
};


