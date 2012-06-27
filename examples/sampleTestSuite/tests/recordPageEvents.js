(function (){
	driver.loadLib('recordPageEvents/recordPageEvents');
	
	module('Record page events');
	/**
	 * TO-DO: need to implement creation and destruction of the control bar as module lifecycle procedures
	 */
	
	asyncTest('Record page events', function (){
		driver.storage.RecordPageEvents.initialize();
		driver.storage.RecordPageEvents.getControlPanel(); // create the panel
		driver.storage.RecordPageEvents.bind('beforeClose', function (obj){
			ok(true);
			start();
		});
		
	});
	
}());
