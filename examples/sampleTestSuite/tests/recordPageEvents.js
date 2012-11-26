(function (){
	module('Record page events', {
		setup:function (){
			console.log('module setup for '+this.__testInst.name);
			var env=this;
			this.__testInst.requireCustomLib(['recordPageEvents/recordPageEvents', 'frameMngr'], function (exportsList){
				env.RecordPageEvents=exportsList[0];
//				env.RecordPageEvents.initialize();
				env.frameMngr=exportsList[1];
			});
		},
		teardown:function (){
			console.log('module teardown for '+this.__testInst.name);
		}
	});
	
	asyncTest('Record page events', function (){
		var env=this;
		this.frameMngr.createFrame(function (frameMngr){
			frameMngr.el.css({border:0, width:'100%', height:'100%'});
			env.RecordPageEvents.createControlPanel(frameMngr, function (panel){
				panel.on('beforeClose', function (obj){
					ok(true);
					start();
				});
				panel.on('destroy', function (obj){
					frameMngr.el.remove();
				});
			});
		});
	});
	
}());
