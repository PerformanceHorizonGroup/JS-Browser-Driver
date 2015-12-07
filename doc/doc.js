var documentor=require('documentor.js'),
	api=new documentor.Api({
		ns:{
			name:'BrowserDriver API',
			description:"..."
		},
		sourceFiles:[
//			'../server/clientManager.js',
			'../server/server.js',
			'../client/browserDriver.js',
	
			'../client/manager/manager.js'
		],
		sourceLoader:new documentor.FileSourceLoader(),
		sourceProcessor:new documentor.PHGDoc.PHGSourceProcessor(),
		renderer:new documentor.PHGDoc.PHGDocRenderer({exportPath:__dirname}),
		listeners:{
			'sourceQueueEmpty':function (){
				// try to set the content of README.md as the desription
				this.ns.description='<pre>'+this.sourceLoader.getSourceFile(require('path').resolve(__dirname, '../README.md'))+'</pre>';
			}
		}
	});

//documentor.processArguments(process.argv);
//documentor.run();
