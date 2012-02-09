/**
 * @module
 */
	
var Connect = require('connect'),
	path = require("path");

/**
 * @moduleFunction	createServer
 * Creates and configures the web server and Socket.IO, and BrowserManager instance that will use them.
 * @param	{Object} cfg The application configuration object.
 * @return	{Object}	Plain object with "server", "browserManager" and "io" properties.
 */
exports.createServer=function (cfg){
	
//	var server = require('http').createServer();
	
	var server = Connect.createServer(
//		Connect.gzip(),
	).use(cfg.server.testsUrl, Connect['static'](path.resolve(path.dirname(cfg.configFileName), cfg.testsPath)));
	if(cfg.userLibsPath)
		server.use(cfg.server.userLibsUrl, Connect['static'](path.resolve(path.dirname(cfg.configFileName), cfg.userLibsPath)));
	for(var p in cfg.server.otherUrlMappings)
		server.use(cfg.server.otherUrlMappings[p], Connect['static'](path.resolve(path.dirname(cfg.configFileName), p)));
	server.use(Connect['static'](__dirname + '/../client'))
		.use(Connect.errorHandler({ dumpExceptions: true, showStack:true }));

	server.listen(cfg.server.SocketIO.port, cfg.server.SocketIO.host);
	console.log('Server listening on port '+cfg.server.SocketIO.port+' at '+cfg.server.SocketIO.host);
	console.log('Go to '+cfg.server.SocketIO.protocol+'://'+cfg.server.SocketIO.host+':'+cfg.server.SocketIO.port+'/manager/manager.html to manage and run tests');

	var io=require('socket.io').listen(server);
	io.sockets
		.on('connection', function (socket){
			var client={
					socket:socket,
					name:''
				};
			socket.on('message', function (msg){
//					console.log('msg '+JSON.stringify(msg));
//					msg=JSON.parse(msg);
					switch(msg.id){
						default:
							browserManager.handleBrowserMessage(client, msg);
					}
				})
				.on('disconnect', function (){
					browserManager.onDisconnectBrowser(client.name);
				}); //.createCallback(this, [client]));
		});
	io.configure(function(){ // 'production'
		io.set('log level', cfg.server.SocketIO.logLevel); 
	});
	
	var browserManager=require('./browserManager').create({appCfg:cfg});
	
	return {
		server:server,
		browserManager:browserManager,
		io:io
	};
};

	