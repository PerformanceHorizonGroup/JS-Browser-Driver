/**
 * @module
 */
	
var util = require('./lib/util'),
	fs = require("fs"),
	path = require("path"),
	events=require('events'),
	sys=require('util'),
	extend=require('jquery.extend');

/**
 * @class ClientManager
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
	
	var appCfg=this.server.appCfg,
		Connect=require('connect');
	this.server.webServer
		.use(Connect['static'](__dirname + '/../client')) // better use %CLIENT_ROOT%
		.use(Connect.errorHandler({ dumpExceptions: true, showStack:true }));
	if(appCfg.userLibsPath)
		this.server.webServer.use(appCfg.server.userLibsUrl, Connect['static'](path.resolve(path.dirname(appCfg.configFileName), appCfg.userLibsPath)));
	for(var p in appCfg.server.otherUrlMappings)
		this.server.webServer.use(appCfg.server.otherUrlMappings[p], Connect['static'](path.resolve(path.dirname(appCfg.configFileName), p)));

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
					var m={
						id:'capture'
					};
					if((msg.slaveName in this.slaves) && !this.slaves[msg.slaveName].connected){
//						console.log('capture request from '+client.socket.id)
						this.onConnectClient(client, msg.slaveName);
						m.result='captured';
						m.appCfg=this.server.appCfg;
//						if(this.slaves[client.name].testsQueue.length)
//							m.tests=this.slaves[client.name].testsQueue;
//						console.dir(m)
					}else
						m.result='rejected';
//				    /**
//				     * @event beforeSendCaptureMessage
//				     * Fires when a message has been received.
//				     * @param {ClientManager} this
//				     * @param {Object}	client
//				     * @param {Object}	msg
//				     */
//					this.emit('beforeSendCaptureMessage', this, client, msg, m);
					client.socket.json.send(m);
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
         * @param {ClientManager} this
         * @param {Object}	client
         * @param {Object}	msg
         */
		this.emit('message', this, client, msg);
	},
	/**
	 * @method	onConnectClient
	 * @param	{Object} client
	 * @param	{String} slaveName
	 */
	onConnectClient:function (client, slaveName){
		if(slaveName in this.slaves){
			client.name=slaveName; // this is needed in webServer.js for ".on('disconnect' ..." . (not a good idea to do it like this though :-()
			extend(this.slaves[slaveName], client); //this.slaves[slaveName]=
			var b=this.slaves[slaveName];
			b.name=slaveName;
			console.log('Slave '+b.name+' connected');
			b.connected=true;
//			var b=extend(b, client);
			this.emit('slaveConnected', b);
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
	 * Cleanup after a client has disconnected
	 * @param	{String} slaveName
	 */
	onDisconnectClient:function (slaveName){
		if((slaveName in this.slaves) && this.slaves[slaveName].connected){
			console.log('Slave '+slaveName+' was disconnected');
			this.emit('slaveDisconnected', this.slaves[slaveName]);
			this.slaves[slaveName].connected=false;
			delete this.slaves[slaveName].runningTest;
			delete this.slaves[slaveName].socket;
			this.sendSlaveUpdateMessage(slaveName);
//			this.sendMessageToManagerClients(getBrowserUpdateMsg(this.slaves[slaveName]));
//			for(var a in this.managerClients) // update manager clients
//				this.managerClients[a].socket.json.send(getBrowserUpdateMsg(this.slaves[slaveName]));
		}
	},
	/**
	 * @method	disconnectSlave
	 * Send disconnect message to the slave
	 * @param	{String} slaveName
	 */
	disconnectSlave:function (slaveName){
		if((slaveName in this.slaves) && this.slaves[slaveName].connected){
//			console.log('Browser '+slaveName+' was disconnected');
			this.slaves[slaveName].socket.json.send({
				id:'disconnect'
			});
		}
	},
	/**
	 * @method	addSlave
	 * Add slave to the list of available slaves.
	 * @param	{Object} slave
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
			var proc, app, slave=this.slaves[slaveName], cfg=this.server.appCfg;
			if('app' in slave){
				app=this.server.processParamString(slave.app);
				proc=require('child_process').spawn(
								app, 
								slave.args.concat([
													this.server.appCfg.server.browserDriverUrl
													+'?socketIOServerProtocol='+this.server.appCfg.server.protocol+'&socketIOServerHost='+this.server.appCfg.server.host+'&socketIOServerPort='+this.server.appCfg.server.port
													+'&slaveName='+slaveName
												]
				));
				proc.stdout.on('data', function (data) {
				  console.log(slaveName+', stdout: ' + data);
				});
				proc.stderr.on('data', function (data) {
				  console.log(slaveName+', stderr: ' + data);
				});
			}else if('fork' in slave){
				app=this.server.processParamString(slave.fork);
				proc=require('child_process').fork(
							app, 
							slave.args.concat([
												'slaveName='+slaveName
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
	 * Disconnect a slave and remove it from the list of available slaves.
	 * @param	{String} slaveName
	 */
	removeSlave:function (slaveName){
		if(slaveName in this.slaves){
			this.disconnectSlave(slaveName)
//			if(this.slaves[slaveName].connected)
//				this.slaves[slaveName].socket.close();
			delete this.slaves[slaveName]; // this is not very clean way to remove the slave because some time after the close() method is called a 'dsconnect' will be fired 
		}
	},
	sendSlaveUpdateMessage:function (slaveName, managerClient){
		if(slaveName in this.slaves){
			var msg={
				id:'slaveUpdate',
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


