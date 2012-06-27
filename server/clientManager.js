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
 * @class BrowserManager
 * @extends	events.EventEmitter
 * @private
 * Maintains the connections with slaves and managers. Mostly relays messages from the manager application 
 * to the slaves and back but also executes commands from the manager application.
 */
function mngr(cfg){
	/**
	 * @cfg	{Object}	server	The server object.
	 */
	extend(this, {
		/**
		 * @property	{Object}	slaves	A hash with available slaves, keyed by slave names.
		 */
		slaves:{}
	}, cfg);
	events.EventEmitter.call(this);
	
	/**
	 * @property	{Object}	managerClients	A hash with connected manager applications, keyed by socket.io ids.
	 */
	this.managerClients={};
	
	var clientManager=this;
	this.server.io.sockets
		.on('connection', function (socket){
			var client={
					socket:socket,
					name:''
				};
			socket.on('message', function (msg){
					clientManager.handleClientMessage(client, msg);
				})
				.on('disconnect', function (){
					clientManager.onDisconnectClient(client.name);
				}); //.createCallback(this, [client]));
		});
}
sys.inherits(mngr, events.EventEmitter);
util.extend(mngr, {
	/**
	 * @method	sendMessageToManagerClients
	 * @param	{Object} msg
	 */
	sendMessageToManagerClients:function (msg){
		for(var a in this.managerClients)
			this.managerClients[a].socket.json.send(msg);
	},
	/**
	 * @method	handleClientMessage
	 * @param	{Object} client
	 * @param	{Object} msg
	 */
	handleClientMessage:function (client, msg){
//		console.log('message '+msg.id)
		switch(msg.id){
			case 'capture':
					if((msg.browserName in this.slaves) && !this.slaves[msg.browserName].connected){
//						console.log('capture request from '+client.socket.id)
						this.onConnectClient(client, msg.browserName);
						var m={
							id:'capture',
							result:'captured',
							appCfg:this.server.appCfg
						};
						if(this.slaves[client.name].testsQueue.length)
							m.tests=this.slaves[client.name].testsQueue;
//						console.dir(m)
						client.socket.json.send(m);
					}else{
						client.socket.json.send({
							id:'capture',
							result:'rejected'
						});
					}
				break;
			case 'registerManagerClient':
					this.managerClients[client.socket.id]=client;
//					console.log('Registered manager client '+client.socket.id);
				break;
			case 'getBrowserUpdates':
					for(var b in this.slaves)
						this.sendSlaveUpdateMessage(b, client);
//						client.socket.json.send(getBrowserUpdateMsg(this.slaves[b]));
				break;
			case 'getAppCfg':
//			console.dir(this.appCfg)
					client.socket.json.send({
						id:'appCfg',
						appCfg:this.server.appCfg
					});
				break;
			case 'runSlave':
//					if(msg.name in this.slaves)
						this.runSlave(msg.name);
				break;
			case 'disconnectSlave':
//					if(msg.name in this.slaves)
						this.disconnectSlave(msg.name);
				break;
		}
        /**
         * @event message
         * Fires when a message has been received.
         * @param {BrowserManager} this
         * @param {Object}	client
         * @param {Object}	msg
         */
		this.emit('message', this, client, msg);
	},
	/**
	 * @method	onConnectClient
	 * @param	{Object} client
	 * @param	{String} browserName
	 */
	onConnectClient:function (client, browserName){
		if(browserName in this.slaves){
			client.name=browserName; // this is needed in webServer.js for ".on('disconnect' ..." . (not a good idea to do it like this though :-()
			extend(this.slaves[browserName], client); //this.slaves[browserName]=
			var b=this.slaves[browserName];
			b.name=browserName;
			console.log('Browser '+b.name+' connected');
			b.connected=true;
//			var b=extend(b, client);
			this.emit('browserConnected', b);
			this.sendSlaveUpdateMessage(b.name);
//			this.sendMessageToManagerClients(getBrowserUpdateMsg(b));
//			for(var a in this.managerClients) // update manager clients
//				this.managerClients[a].socket.json.send(getBrowserUpdateMsg(b));
//			for(var i=0; i<this.tests.length; i++)
//				b.testsQueue.push(this.getTest(i));
//			if(this.testing)
//				this.runTests(b);
		}
	},
	/**
	 * @method	onDisconnectClient
	 * Cleanup after a browser has disconnected
	 * @param	{String} browserName
	 */
	onDisconnectClient:function (browserName){
		if((browserName in this.slaves) && this.slaves[browserName].connected){
			console.log('Browser '+browserName+' was disconnected');
			this.emit('browserDisconnected', this.slaves[browserName]);
			this.slaves[browserName].connected=false;
			delete this.slaves[browserName].runningTest;
			delete this.slaves[browserName].socket;
			this.sendSlaveUpdateMessage(browserName);
//			this.sendMessageToManagerClients(getBrowserUpdateMsg(this.slaves[browserName]));
//			for(var a in this.managerClients) // update manager clients
//				this.managerClients[a].socket.json.send(getBrowserUpdateMsg(this.slaves[browserName]));
		}
	},
	/**
	 * @method	disconnectSlave
	 * Send disconnect message to the slave
	 * @param	{String} slaveName
	 */
	disconnectSlave:function (slaveName){
		if((slaveName in this.slaves) && this.slaves[slaveName].connected){
//			console.log('Browser '+browserName+' was disconnected');
			this.slaves[slaveName].socket.json.send({
				id:'disconnect'
			});
		}
	},
	/**
	 * @method	addSlave
	 * Add browser to the list of available slaves.
	 * @param	{Object} browser
	 */
	addSlave:function (slave){
		if(!(slave.name in this.slaves)){
			if(!slave.testsQueue)
				slave.testsQueue=[];
			this.slaves[slave.name]=slave;
//			console.log(slave.testsQueue.length+' tests for '+slave.name)
		}
	},
	/**
	 * @method	runSlave
	 * Runs the application for the specified slave.
	 * @param	{String} slaveName
	 */
	runSlave:function (slaveName){
		if(slaveName in this.slaves){
			var proc, app, slave=this.slaves[slaveName];
			if('app' in slave){
				app=slave.app;
				proc=require('child_process').spawn(
								app, 
								slave.args.concat([
													this.server.appCfg.server.browserDriverUrl
													+'?socketIOServerProtocol='+this.server.appCfg.server.protocol+'&socketIOServerHost='+this.server.appCfg.server.host+'&socketIOServerPort='+this.server.appCfg.server.port
													+'&browserName='+slaveName
												]
				));
				proc.stdout.on('data', function (data) {
				  console.log(slaveName+', stdout: ' + data);
				});
				proc.stderr.on('data', function (data) {
				  console.log(slaveName+', stderr: ' + data);
				});
			}else if('fork' in slave){
				app=slave.fork;
				proc=require('child_process').fork(
							app, 
							slave.args.concat([
												'browserName='+slaveName
											])
					);
				var client={
						socket:proc,
						name:''
					};
				client.socket.json={send:client.socket.send.scope(client.socket)};
				proc.on('message', function(msg){
					this.handleClientMessage(client, msg);
				}.scope(this));
				proc.on('exit', function(m){
					this.onDisconnectClient(slaveName);
				}.scope(this));
			}
			if(proc)
				console.log('starting slave: '+slaveName+'('+app+' "'+slave.args.join('" "')+'")');
		}
	},
	/**
	 * @method	removeSlave
	 * Disconnect a browser and remove it from the list of available slaves.
	 * @param	{String} browserName
	 */
	removeSlave:function (slaveName){
		if(slaveName in this.slaves){
			this.disconnectSlave(slaveName)
//			if(this.slaves[browserName].connected)
//				this.slaves[browserName].socket.close();
			delete this.slaves[slaveName]; // this is not very clean way to remove the browser because some time after the close() method is called a 'dsconnect' will be fired 
		}
	},
	sendSlaveUpdateMessage:function (slaveName, managerClient){
		if(slaveName in this.slaves){
			var msg={
				id:'browserUpdate',
				data:{
					name:slaveName,
					connected:this.slaves[slaveName].connected,
					app:this.slaves[slaveName].app,
					fork:this.slaves[slaveName].fork
				}
			};					
			this.emit('beforeSendSlaveUpdateMessage', msg);
			if(managerClient)
				managerClient.socket.json.send(msg);
			else
				this.sendMessageToManagerClients(msg);
		}
	}
});

/**
 * @moduleFunction	create
 * Creates and returns an instance of clientManager.ClientManager
 * @param	{Object} server
 * @return	{clientManager.ClientManager}
 */
exports.create=function (cfg){
	return new mngr(cfg);
};


