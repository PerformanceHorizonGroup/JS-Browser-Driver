if(!('BrowserDriver' in window))
	window.BrowserDriver={};
		
/**
 * @class	BrowserDriver.Manager
 * @singleton
 * Creates and manages the user interface inside a browser window which lets the user interactively manage slave browsers and execute tests.
 * The interface can be loaded in more than one browser window and all instances will receive updates from the server.
 */
window.BrowserDriver.Manager={
	/**
	 * @property	{Array}	testModules
	 * A list of all loaded test modules. Each module keeps a list of all its tests.
	 */
	testModules:[],
	storage:{			
	}
};

$(document).ready(function (){
//	if('adaptor' in driver)
//		driver.adaptor.initialize();
//	driver.bind('testRead', function (drv, testData){
//		var module=null;
//		for(var i=0; i<BrowserDriver.Manager.testModules.length; i++)
//			if(BrowserDriver.Manager.testModules[i].name==testData.module){
//				module=BrowserDriver.Manager.testModules[i];
//				break;
//			}
//		if(!module){
//			module={
//				name:testData.module,
//				tests:[]
//			};
//			BrowserDriver.Manager.testModules.push(module);
//		}		
//		module.tests.push(testData);
//	});

	var slaves={};
	var socket=io.connect(null);
	socket.on('connect', onConnect);
	socket.on('message', onMessage);
	socket.on('reconnect_failed', function (){
		closeWindow('reconnect failed');
	});
	function onConnect(){
		socket.json.send({
			id:'registerManagerClient'
		});
		socket.json.send({
			id:'getAppCfg'
		});
		socket.json.send({
			id:'getBrowserUpdates'
		});
	}
	function onMessage(msg){
		console.log('msg '+JSON.stringify(msg));
		switch(msg.id){
			case 'appCfg':
					BrowserDriver.Manager.storage.appCfg=msg.appCfg;
//					driver.storage.appCfg=msg.appCfg;
//					if(driver.storage.appCfg.slaveModules.length){
//						driver.one('initModules', function (driver){
//							socket.json.send({
//								id:'getTestsList'
//							});
//						});
//						driver.initModules();
//					}else{
						socket.json.send({
							id:'getTestsList'
						});
//					}
				break;
			case 'slaveUpdate':
					if(msg.data.name in slaves)
						$.extend(slaves[msg.data.name], msg.data);
					else{
						slaves[msg.data.name]=msg.data;
					}
					updateBrowser(msg.data.name);
				break;
			case 'testsList':
					BrowserDriver.Manager.testModules=[];
					for(var i=0, files=msg.data; i<files.length; ++i){ // cycle the files
						for(var t=0; t<files[i].tests.length; t++){
							var module=null,
								test=files[i].tests[t];
							test.fileName=files[i].fileName;
							test.relFileName=files[i].relFileName;
							for(var m=0; m<BrowserDriver.Manager.testModules.length; m++)
								if(BrowserDriver.Manager.testModules[m].name==test.module){
									module=BrowserDriver.Manager.testModules[m];
									break;
								}
							if(!module){
								module={
									name:test.module,
									tests:[]
								};
								BrowserDriver.Manager.testModules.push(module);
							}		
							module.tests.push(test);
						}
					}
					$('#testsList .test-details').remove();
					printTests(BrowserDriver.Manager.testModules, $('#testsList').empty());
				break;
			case 'testManager.onTestStart':
					$('#console').prepend('<div>['+formatDate(new Date(), 'HH:mm:ss')+', '+msg.slaveName+'] test start: "'+msg.name+'"</div>');
					for(var i=0, queue=slaves[msg.slaveName].testsQueue; i<queue.length; i++){
						if(((!queue[i].module && !msg.module) || (queue[i].module==msg.module)) && queue[i].fileName==msg.fileName && queue[i].name==msg.name){
							queue[i].el.addClass('running');
							break;
						}
					}
				break;
			case 'testManager.onAssertion':
					var html='<div>['+formatDate(new Date(), 'HH:mm:ss')+', '+msg.slaveName+'] test "'+msg.name+'"';
					if('expected' in msg){
						html+=', expected: '+msg.expected;
						html+=', actual: '+msg.actual;
					}
					if(typeof msg.message != 'undefined')
						html+=', message: "'+msg.message+'"';
					html+='</div>';
					$('#console').prepend($(html).addClass('done '+(msg.result?'passed':'failed')));
				break;
			case 'testManager.onTestDone':
					$('#console').prepend($('<div>['+formatDate(new Date(), 'HH:mm:ss')+', '+msg.slaveName+'] test done: "'+msg.name+'", '+msg.failed+', '+msg.passed+', '+msg.total+'</div>').addClass('done '+(msg.failed?'failed':'passed')));
					for(var i=0, queue=slaves[msg.slaveName].testsQueue; i<queue.length; i++){
						if(((!queue[i].module && !msg.module) || (queue[i].module==msg.module)) && queue[i].fileName==msg.fileName && queue[i].name==msg.name){
							queue[i].el.removeClass('running').addClass('done '+(msg.failed?'failed':'passed')).children('.assertions').html(msg.failed+', '+msg.passed+', '+msg.total);
							break;
						}
					}
				break;
		}
	}
	
	
	function printTests(module, rootEl){
		if($.isArray(module))
			for(var i=0; i<module.length; i++)
				printTests(module[i], rootEl);
		else{
			var moduleEl = module.name ? $('<fieldset class="module"><legend>'+module.name+'</legend></fieldset>').appendTo(rootEl) : rootEl;
			for(var i=0; i<module.tests.length; i++)
				$('<div class="test-details" filename="'+module.tests[i].fileName+'"><input type="checkbox"> ( "<span class="test-name">'+module.tests[i].name+'</span>" ), <span class="assertions">'+module.tests[i].expect+'</span></div>').appendTo(moduleEl);
		}
	}
	$('.connect-browser').live('click', function (){
		var b=slaves[$(this).closest('div.browser-control').attr('browsername')];
		if(this.innerHTML=='Connect'){
			if(('app' in b) || ('fork' in b))
				socket.json.send({
					id:'runSlave',
					name:b.name
				});
		}else
			socket.json.send({
				id:'disconnectSlave',
				name:b.name
			});
	});
	function updateBrowser(name){
		var b=slaves[name];
		if(!b.el)
			b.el=$('<div browsername="'+name+'" class="browser-control"></div>').appendTo($('#browsersList'));
		b.el.html('<input type="checkbox"> '+name
					+' <button class="connect-browser btn btn-'+(b.connected?'warning':'success')+'">'+(b.connected?'Disconnect':'Connect')+'</button>'
					+(BrowserDriver.Manager.storage.appCfg?
						' <a href="'
//						+BrowserDriver.Manager.storage.appCfg.server.siteBaseUrl
						+BrowserDriver.Manager.storage.appCfg.server.browserDriverUrl
						+'?socketIOServerProtocol='+BrowserDriver.Manager.storage.appCfg.server.protocol
						+'&socketIOServerHost='+BrowserDriver.Manager.storage.appCfg.server.host
						+'&socketIOServerPort='+BrowserDriver.Manager.storage.appCfg.server.port
						+'&slaveName='+name
						+'">url</a>'
					: '' )
				);
		for(var i=0; i<b.testsQueue.length; i++)
			b.testsQueue[i].el=$('<div class="test-info">'+b.testsQueue[i].name+'</div>').appendTo(b.el);
	}
	
	$('#runSelected').click(function (){
		var tests=[],
			slaves=[];
		$('.browser-control :checked').each(function (){
			slaves.push($(this).closest('.browser-control').attr('browsername'));
		});
		$('.test-details :checked').each(function (){
			tests.push({
				name:$(this).nextAll('.test-name').text(),
				module:$(this).closest('fieldset.module').children('legend:first').text(),
				fileName:$(this).closest('.test-details').attr('filename')
			});
		});
		$('#console').empty();
		socket.json.send({
			id:'runTests',
			tests:tests,
			slaves:slaves
		});
	});
	$('#reloadTests').click(function (){
		socket.json.send({
			id:'reloadTests'
		});
	});
});
