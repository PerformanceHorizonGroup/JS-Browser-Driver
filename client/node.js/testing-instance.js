var path=require('path');
for(var i=0, arg, argv=process.argv; i<argv.length; i++)
	if(arg=argv[i].match(/^adaptor=(.+)/))
		require(path.relative(__dirname, path.dirname(arg[1]))+path.sep+path.basename(arg[1])).initialize();
