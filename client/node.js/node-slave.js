console.log('slave running');
var storage={
	slaveName:'[node-slave]'
};
for(var i=0, arg, argv=process.argv; i<argv.length; i++)
	if(arg=argv[i].match(/^slaveName=(.+)/))
		storage.slaveName=arg[1];
setTimeout(function (){
	process.send({
		id:'capture',
		slaveName:storage.slaveName
	});
	setTimeout(function (){
		process.exit(0);
	}, 1000);
}, 1000);
