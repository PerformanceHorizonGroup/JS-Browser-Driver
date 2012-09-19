console.log('slave running');
var storage={
	browserName:'[node-slave]'
};
for(var i=0, arg, argv=process.argv; i<argv.length; i++)
	if(arg=argv[i].match(/^browserName=(.+)/))
		storage.browserName=arg[1];
setTimeout(function (){
	process.send({
		id:'capture',
		browserName:storage.browserName
	});
	setTimeout(function (){
		process.exit(0);
	}, 1000);
}, 1000);
