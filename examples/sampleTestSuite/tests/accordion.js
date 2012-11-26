module('jQueryUI', {
	setup:function (){
		console.log('module setup for '+this.__testInst.name);
		var env=this;
		this.__testInst.requireCustomLib(['util', 'recordPageEvents/replayPageEvents', 'frameMngr'], function (exportsList){
			env.testUtils=exportsList[0];
			var waitFn=env.__testInst.waitForSetup();
			env.frameMngr=exportsList[2].createFrame(function (frameMngr){
				frameMngr.el.css({border:0, width:'100%', height:'100%'});
				env.player=exportsList[1].createPlayer(frameMngr, function (player){
					env.player=player;
					waitFn();
				});
			});
		});
	},
	teardown:function (){
		console.log('module teardown for '+this.__testInst.name);
		this.player.frameMngr.el.remove();
		this.player.destroy();
	}
});

asyncTest("Accordion widget", 12, function (){
	var test=this,
		p=this.player,
		testUtils=this.testUtils,
		frameEl=p.frameMngr.el;

	p.initialize();

	testUtils.setPath(frameEl, '/public_html/jqueryui/index.html', ok); // load the index page
	p.testWaitForEvent("load", frameEl);
	p.testFireEvent("click", "html>body>ul>li:eq(0)>a");
	p.testWaitForEvent("load", frameEl);
	p.testFireEvent("click", "button#create");
	p.wait(2000); // give a little time (2 sec) for the accordion widget to be creaeted
	p.testFireEvent("click", "div#accordion>h3.ui-accordion-header.ui-helper-reset:eq(1)>a");
	p.wait(1000); // give a little time (1 sec) for the accordion section to open
	p.execCb(function (){
		ok(testUtils.$(frameEl, 'div#accordion>h3.ui-accordion-header.ui-helper-reset:eq(1)').hasClass('ui-state-active ui-corner-top'), 'has classes');
	});
	p.testFireEvent("click", "div#accordion>h3.ui-accordion-header.ui-helper-reset:eq(2)>a");
	p.wait(1000); // give a little time (1 sec) for the accordion section to open
	p.execCb(function (){
		ok(testUtils.$(frameEl, 'div#accordion>h3.ui-accordion-header.ui-helper-reset:eq(2)').hasClass('ui-state-active ui-corner-top'), 'has classes');
	});
	p.testFireEvent("click", "div#accordion>h3.ui-accordion-header.ui-helper-reset:last>a");
	p.wait(1000); // give a little time (1 sec) for the accordion section to open
	p.execCb(function (){
		ok(testUtils.$(frameEl, 'div#accordion>h3.ui-accordion-header.ui-helper-reset:last').hasClass('ui-state-active ui-corner-top'), 'has classes');
	});

	p.execCb(function (){
		ok(true, "complete");
		start();
	});
});

/**
 * !!! IMPORRTANT: Most browsers will detect if the browser window that executes the test is not visible (eg. minimized or its tab is not active) 
 * and will not execute most of the simulated UI events to preserve computational resources, but that of course will break the test. So make sure
 * that window is visible !
 */
