var api=new (require('../../Documentor/Documentor').Api)({
	ns:{
		name:'BrowserDriver API',
		description:"..."
	},
	sourceFiles:[
		'../server/browserManager.js',
		'../server/server.js',
		'../server/webServer.js',
		'../client/browserDriver.js',

		'../client/manager/manager.js'
	],
	sourceLoader:new (require('../../Documentor/SourceLoader').FileSourceLoader)(),
	sourceProcessor:new (require('../../Documentor/SourceProcessor').PHGSourceProcessor)(),
	listeners:{
		'sourceProcessed':function (fileURL){
			if(api.sourceFiles.length==0)
				(new (require('../../Documentor/render/PHGDoc/PHGDocRenderer').PHGDocRenderer)({exportPath:'.'})).render(this);
		}
	}
});

//documentor.processArguments(process.argv);
//documentor.run();
