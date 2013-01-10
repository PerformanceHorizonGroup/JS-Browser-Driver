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
asyncTest("Button widget", 37, function (){
	var test=this,
		p=this.player,
		testUtils=this.testUtils,
		frameEl=p.frameMngr.el;

	p.initialize();

	function testIsTheOnlyElementWithClass(selector, cls){
		var sel=testUtils.$(frameEl, '.'+cls); 
		return sel.length==1 && sel.is(selector);
	}

	testUtils.setPath(frameEl, '/public_html/jqueryui/index.html', ok); // load the index page
	p.testWaitForEvent("load", frameEl);
	p.wait(800);
	p.testFireEvent("click", "html>body>ul>li:eq(2)>a");
	p.testWaitForEvent("load", frameEl);
	p.setAutoWait(500); // set 1 sec delay before each scheduled call
	p.testFireEvent("click", "button#create");

	var selector="html>body>div.demo>button.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only>span.ui-button-text";
	p.testFireEvent("mouseover", selector);
	p.execCb(function (){
		ok(testIsTheOnlyElementWithClass("html>body>div.demo>button.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only", 'ui-state-hover'), "the button is the only one with class ui-state-hover");
	});
	p.testFireEvent("mousedown", selector);
	p.execCb(function (){
		ok(testIsTheOnlyElementWithClass("html>body>div.demo>button.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only", 'ui-state-hover'), "the button is the only one with class ui-state-hover");
		ok(testIsTheOnlyElementWithClass("html>body>div.demo>button.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only", 'ui-state-active'), "the button is the only one with class ui-state-active");
	});
	p.testFireEvent("mouseup", selector);
	p.execCb(function (){
		ok(testIsTheOnlyElementWithClass("html>body>div.demo>button.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only", 'ui-state-hover'), "the button is the only one with class ui-state-hover");
		ok(!testUtils.$(frameEl, "html>body>div.demo>button.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only").hasClass('ui-state-active'), 'the button does not have class ui-state-active');
	});
	p.testFireEvent("mouseout", selector);
	
	selector="html>body>div.demo>input.ui-button.ui-widget.ui-state-default.ui-corner-all";
	p.testFireEvent("mouseover", selector);
	p.execCb(function (){
		ok(testIsTheOnlyElementWithClass("html>body>div.demo>input.ui-button.ui-widget.ui-state-default.ui-corner-all", 'ui-state-hover'), "the button is the only one with class ui-state-hover");
	});
	p.testFireEvent("mousedown", selector);
	p.execCb(function (){
		ok(testIsTheOnlyElementWithClass("html>body>div.demo>input.ui-button.ui-widget.ui-state-default.ui-corner-all", 'ui-state-hover'), "the button is the only one with class ui-state-hover");
		ok(testIsTheOnlyElementWithClass("html>body>div.demo>input.ui-button.ui-widget.ui-state-default.ui-corner-all", 'ui-state-active'), "the button is the only one with class ui-state-active");
	});
	p.testFireEvent("mouseup", selector);
	p.execCb(function (){
		ok(testIsTheOnlyElementWithClass("html>body>div.demo>input.ui-button.ui-widget.ui-state-default.ui-corner-all", 'ui-state-hover'), "the button is the only one with class ui-state-hover");
		ok(!testUtils.$(frameEl, "html>body>div.demo>input.ui-button.ui-widget.ui-state-default.ui-corner-all").hasClass('ui-state-active'), 'the button does not have class ui-state-active');
	});
	p.testFireEvent("mouseout", selector);
	
	selector="html>body>div.demo>a.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only>span.ui-button-text";
	p.testFireEvent("mouseover", selector);
	p.execCb(function (){
		ok(testIsTheOnlyElementWithClass("html>body>div.demo>a.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only", 'ui-state-hover'), "the button is the only one with class ui-state-hover");
	});
	p.testFireEvent("mousedown", selector);
	p.execCb(function (){
		ok(testIsTheOnlyElementWithClass("html>body>div.demo>a.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only", 'ui-state-hover'), "the button is the only one with class ui-state-hover");
		ok(testIsTheOnlyElementWithClass("html>body>div.demo>a.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only", 'ui-state-active'), "the button is the only one with class ui-state-active");
	});
	p.testFireEvent("mouseup", selector);
	p.execCb(function (){
		ok(testIsTheOnlyElementWithClass("html>body>div.demo>a.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only", 'ui-state-hover'), "the button is the only one with class ui-state-hover");
		ok(!testUtils.$(frameEl, "html>body>div.demo>a.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only").hasClass('ui-state-active'), 'the button does not have class ui-state-active');
	});
	p.testFireEvent("mouseout", selector);
	p.execCb(function (){
		ok(testUtils.$(frameEl, '.ui-state-hover, .ui-state-active').length==0, 'there are no buttons with class ui-state-hover or ui-state-active');
	});
	
	// try disabling a button while it is being hovered over ( bug #5295 )
	var selector="html>body>div.demo>button.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only>span.ui-button-text";
	// move the mouse over it
	p.testFireEvent("mouseover", selector);
	// disable it
	p.execCb(function (){
		frameEl.get(0).contentWindow
			.$("html>body>div.demo>button.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only", frameEl.get(0).contentWindow.document)
			.button('disable');
	});
	// move the mouse away
	p.testFireEvent("mouseout", selector);
	// enable it
	p.execCb(function (){
		frameEl.get(0).contentWindow
			.$("html>body>div.demo>button.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only", frameEl.get(0).contentWindow.document)
			.button('enable');
	});
	// it is not expected to have the ui-state-hover class but in 1.8.x it will ;-)
	p.execCb(function (){
		ok(testUtils.$(frameEl, '.ui-state-hover, .ui-state-active').length==0, 'there are no buttons with class ui-state-hover or ui-state-active');
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
