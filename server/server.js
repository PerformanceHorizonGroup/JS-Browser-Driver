/**
 * TO-DO: running this in interactive mode and managing it by running commands in the console (for CI integration).
 */
var path=require('path'),
	extend=require('./lib/other/jquery.extend'),
	Connect = require('connect');

var host, 
	post, 
	cfg={ // configuration defaults
		server:{
			/**
			 * TO-DO: implement handling of the "protocol" option - if set to https the server should run using https
			 */
			protocol:'http', // setting this option to something else will not have any effect yet
			host:'localhost',
			port:80,
			SocketIO:{
				logLevel:0
			},
//			siteBaseUrl:'localhost',
			browserDriverUrl:'localhost/BrowserDriver.html',
			/**
			 * TO-DO: may be useful to be able to expand file system paths with special keys 
			 * so that "{server}" for example gets replaced with the folder where the server has been started
			 * and "{server}/lib" will become "/fs_root/path/to/the/server/lib"
			 */
			otherUrlMappings:{	// mappings for other paths on the server in the form "relative_fs_path_to_the_config_file":"url_on_the_server"
//			    'html':"/manager/tests/html"
			}
		},
		slaves:[
//		{
//			name:'IE',	// browser name to use
//			app:'C:\\Program Files (x86)\\Internet Explorer\\IEXPLORE.EXE',	// command to start IE (in Windows)
//			args:[]	// additional arguments to send to the application. the browserDriverUrl with additional url parameters will be appended to this list  
//		},{
//			name:'Chrome',
//			app:'chrome',
//			args:[]
//		}
		],
		
		slaveModules:[{
			"fileName":"/modules/testManager",
			"adaptor":"/lib/adaptors/qunit"
		}],	// a list with modules that the slaves need to load
		
		modules:[{
			name:'TestManager',
			requirePath:'./testManager',
			adaptor:'../client/lib/adaptors/qunit',
			testsPath:'tests', // path to be searched for *.js files which should have the tests. must be relative to the config file path
			userLibsPath:'lib', // must be relative to the config file path
			testsUrl:'/manager/tests/sources',
			userLibsUrl:'/manager/tests/lib'
		}],	// modules that the server needs to load
		
		interactiveMode:false, // if false then load tests from "autoRunTests" and run them in all slaves starting up those specified in "autoRunSlaves". can be overridden with command-line arguments
		autoRunTests:[], // a list of tests to run automatically on startup (only with interactiveMode:false ). can be overridden with command-line arguments
		autoRunSlaves:[], // a list of slaves to run automatically on startup (only with interactiveMode:false ). can be overridden with command-line arguments
		
		configFileName:__dirname+'/server.conf.json', // it's pointless to set this in a config file ;-) . shall be overridden with command-line arguments
		
		timeout:0 // timeout in seconds to wait before shutting down the server
	},
	processArguments=[];
if(module.parent){ // was loaded as a module
	exports.processArguments=processArgv;
	exports.run=startServer;
}else{
	processArgv(process.argv);
	startServer();
}

function processArgv(argv){
	for(var i=0, arg; i<argv.length; i++)
		if(arg=argv[i].match(/^configFileName="?(.+)"?/))
			cfg.configFileName=path.resolve(arg[1]);
		else 
			processArguments.push(argv[i]);
}
function startServer(cfgOverrides){
	console.log('starting server');

	if(cfgOverrides)
		extend(true, cfg, cfgOverrides);
	path.exists(cfg.configFileName, function (exists){
		if(exists){
			console.log('reading configuration file '+cfg.configFileName);
	//		JSON.parse(require('fs').readFileSync(configFileName).toString());
			extend(true, cfg, JSON.parse(require('fs').readFileSync(cfg.configFileName).toString()));
		}
	
		// process command-line arguments and override configuration if needed
		for(var i=0, arg; i<processArguments.length; i++){
	//		console.log('arg: ' + processArguments[i]);
			if(arg=processArguments[i].match(/^port=(\d+)/))
				cfg.server.port=arg[1];
			else if(arg=processArguments[i].match(/^host=(.*)/))
				cfg.server.host=arg[1];
			else if(arg=processArguments[i].match(/^interactiveMode=(\w+)/))
				cfg.interactiveMode= arg[1]=='true';
			else if(arg=processArguments[i].match(/^timeout=(\d+)/))
				cfg.timeout=Number(arg[1]);
			else if(arg=processArguments[i].match(/^test=(.*)/)){
				/**
				 * TO-DO: support the option to run all tests without enumerating them all
				 */
				arg=arg[1].match(/^'(.*)'\.'(.*)'\.'(.*)'$/); // format: 'filename.js'.'moduleName'.'testName'
				if(arg){
					cfg.autoRunTests.push({
						name:arg[3],
						module:arg[2],
						fileName:arg[1]
					});
				}
			}else if(arg=processArguments[i].match(/^autoRunSlaves=(.*)/)){
				/**
				 * TO-DO: support the option to run all slaves without enumerating them all
				 */
				arg=arg[1].split(','); // format: browser1,browser2,etc
				cfg.autoRunSlaves=arg;
			}
		}
			
	//	process.on('uncaughtException', function (err) {
	//		console.log('Caught exception: ' + err.stack);
	//		console.log(sys.inspect('err: '+err, 3));
	//		if(err.type=='non_object_property_call'){
	//			console.log('Assuming this happened in socket.io we keep running.');
	//		}else{
	//			console.log('The server is shutting down');
	//			process.exit();
	//		}
	//	});
		
		var server={
			appCfg:cfg,
			webServer:Connect.createServer(
//				Connect.gzip(),
			),
			modules:[],
			params:{
				SERVER_ROOT:__dirname,
				CLIENT_ROOT:path.resolve(__dirname, '../client')
			},
			processParamString:function (appStr){
				return appStr.replace(/%([^%]+)%/g, function (match, p1, offset, string){
					return server.params[p1];
				});
			}
			
		};
		
		(function (){
			var s=server.webServer.listen(cfg.server.port, cfg.server.host);	// this is needed with Connect 2.x
			console.log('Server listening on port '+cfg.server.port+' at '+cfg.server.host);
		
			server.io=require('socket.io').listen(s);
			server.io.configure(function(){ // 'production'
				server.io.set('log level', cfg.server.SocketIO.logLevel); 
			});
		}());
		
		server.clientManager=require('./clientManager').create({server:server});
		for(var i=0; i<cfg.modules.length; i++)
			server.modules.push(require(cfg.modules[i].requirePath).init(extend(true, {server:server}, cfg.modules[i])));
	
//		for(var b=0; b<cfg.slaves.length; b++)
//			webServer.browserManager.addBrowser(extend({
//				testsQueue:cfg.autoRunTests.slice(0)
//			}, cfg.slaves[b]));
	
		if(cfg.timeout)
			setTimeout(function (){
				console.log('timed out. testing server is shutting down');
				process.exit(); // this will not be a good idea if loaded as a module
			}, cfg.timeout*1000);
			
		if(!cfg.interactiveMode){
			webServer.browserManager.on('message', function (client, msg){
				if(msg.id=='onTestDone'){
					console.log('test on '+client.name+': '+msg.name+' '+msg.failed+', '+msg.passed+', '+msg.total);
				}else if(msg.id=='onAllTestsDone'){
					for(var b in this.slaves) // check if there are tests left in any slave
						if(this.slaves[b].testsQueue.length)
							return;
					
					for(var i=0; i<cfg.autoRunSlaves.length; i++)
						this.disconnectSlave(cfg.autoRunSlaves[i]);
					console.log('all tests complete. shutting down');
					process.exit(); // this may not be a good idea if loaded as a module. might emit some event instead.
				}
			});
			webServer.browserManager.on('testDone', function (msg){
				console.log('test on '+msg.slaveName+': '+msg.name+' '+msg.failed+', '+msg.passed+', '+msg.total);
			});
			// schedule given tests for all slaves
			for(var b=0; b<cfg.slaves.length; b++){
				webServer.browserManager.runTests(webServer.browserManager.slaves[cfg.slaves[b].name], cfg.autoRunTests.slice(0));
				
				// check if this slave must be automatically run
				for(var i=0; i<cfg.autoRunSlaves.length; i++)	
					if(cfg.slaves[b].name==cfg.autoRunSlaves[i]){
						webServer.browserManager.runSlave(cfg.autoRunSlaves[i]);
						break;
					}
			}
		}
	});
}
