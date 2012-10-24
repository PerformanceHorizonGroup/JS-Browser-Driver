console.log('slave running');

require('../lib/modules');
var EventEmitter=require('events').EventEmitter,
	socket=new EventEmitter(),
	driver=require('../lib/driver').create({
		socket:socket
	});
socket.send=function (msg){
	process.send(msg);
};
process.on('message', function (msg){
	socket.emit('message', msg);
});
driver.on('disconnect', function (){
	process.exit(0);
});

for(var i=0, arg, argv=process.argv; i<argv.length; i++)
	if(arg=argv[i].match(/^slaveName=(.+)/))
		driver.storage.slaveName=arg[1];

driver.connect();

