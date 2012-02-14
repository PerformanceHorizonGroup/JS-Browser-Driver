
driver.loadLib("util");
driver.loadLib("recordPageEvents/replayPageEvents");
asyncTest("Button widget", 37, function (){
	var test=this;

	driver.storage.ReplayPageEvents.initialize();

	function testIsTheOnlyElementWithClass(selector, cls){
		var sel=testUtils.$('.'+cls); 
		return sel.length==1 && sel.is(selector);
	}

	testUtils.setPath('/public_html/jqueryui/index.html', ok); // load the index page
	testWaitForEvent("load", driver.targetSiteFrame);
	wait(800);
	testFireEvent("click", "html>body>ul>li:eq(2)>a");
	testWaitForEvent("load", driver.targetSiteFrame);
	setAutoWait(500); // set 1 sec delay before each scheduled call
	testFireEvent("click", "button#create");

	var selector="html>body>div.demo>button.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only>span.ui-button-text";
	testFireEvent("mouseover", selector);
	execCb(function (){
		ok(testIsTheOnlyElementWithClass("html>body>div.demo>button.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only", 'ui-state-hover'), "the button is the only one with class ui-state-hover");
	});
	testFireEvent("mousedown", selector);
	execCb(function (){
		ok(testIsTheOnlyElementWithClass("html>body>div.demo>button.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only", 'ui-state-hover'), "the button is the only one with class ui-state-hover");
		ok(testIsTheOnlyElementWithClass("html>body>div.demo>button.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only", 'ui-state-active'), "the button is the only one with class ui-state-active");
	});
	testFireEvent("mouseup", selector);
	execCb(function (){
		ok(testIsTheOnlyElementWithClass("html>body>div.demo>button.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only", 'ui-state-hover'), "the button is the only one with class ui-state-hover");
		ok(!testUtils.$("html>body>div.demo>button.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only").hasClass('ui-state-active'), 'the button does not have class ui-state-active');
	});
	testFireEvent("mouseout", selector);
	
	selector="html>body>div.demo>input.ui-button.ui-widget.ui-state-default.ui-corner-all";
	testFireEvent("mouseover", selector);
	execCb(function (){
		ok(testIsTheOnlyElementWithClass("html>body>div.demo>input.ui-button.ui-widget.ui-state-default.ui-corner-all", 'ui-state-hover'), "the button is the only one with class ui-state-hover");
	});
	testFireEvent("mousedown", selector);
	execCb(function (){
		ok(testIsTheOnlyElementWithClass("html>body>div.demo>input.ui-button.ui-widget.ui-state-default.ui-corner-all", 'ui-state-hover'), "the button is the only one with class ui-state-hover");
		ok(testIsTheOnlyElementWithClass("html>body>div.demo>input.ui-button.ui-widget.ui-state-default.ui-corner-all", 'ui-state-active'), "the button is the only one with class ui-state-active");
	});
	testFireEvent("mouseup", selector);
	execCb(function (){
		ok(testIsTheOnlyElementWithClass("html>body>div.demo>input.ui-button.ui-widget.ui-state-default.ui-corner-all", 'ui-state-hover'), "the button is the only one with class ui-state-hover");
		ok(!testUtils.$("html>body>div.demo>input.ui-button.ui-widget.ui-state-default.ui-corner-all").hasClass('ui-state-active'), 'the button does not have class ui-state-active');
	});
	testFireEvent("mouseout", selector);
	
	selector="html>body>div.demo>a.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only>span.ui-button-text";
	testFireEvent("mouseover", selector);
	execCb(function (){
		ok(testIsTheOnlyElementWithClass("html>body>div.demo>a.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only", 'ui-state-hover'), "the button is the only one with class ui-state-hover");
	});
	testFireEvent("mousedown", selector);
	execCb(function (){
		ok(testIsTheOnlyElementWithClass("html>body>div.demo>a.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only", 'ui-state-hover'), "the button is the only one with class ui-state-hover");
		ok(testIsTheOnlyElementWithClass("html>body>div.demo>a.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only", 'ui-state-active'), "the button is the only one with class ui-state-active");
	});
	testFireEvent("mouseup", selector);
	execCb(function (){
		ok(testIsTheOnlyElementWithClass("html>body>div.demo>a.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only", 'ui-state-hover'), "the button is the only one with class ui-state-hover");
		ok(!testUtils.$("html>body>div.demo>a.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only").hasClass('ui-state-active'), 'the button does not have class ui-state-active');
	});
	testFireEvent("mouseout", selector);
	execCb(function (){
		ok(testUtils.$('.ui-state-hover, .ui-state-active').length==0, 'there are no buttons with class ui-state-hover or ui-state-active');
	});
	
	// try disabling a button while it is being hovered over ( bug #5295 )
	var selector="html>body>div.demo>button.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only>span.ui-button-text";
	// move the mouse over it
	testFireEvent("mouseover", selector);
	// disable it
	execCb(function (){
		driver.targetSiteFrame.get(0).contentWindow
			.$("html>body>div.demo>button.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only", driver.targetSiteFrame.get(0).contentWindow.document)
			.button('disable');
	});
	// move the mouse away
	testFireEvent("mouseout", selector);
	// enable it
	execCb(function (){
		driver.targetSiteFrame.get(0).contentWindow
			.$("html>body>div.demo>button.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only", driver.targetSiteFrame.get(0).contentWindow.document)
			.button('enable');
	});
	// it is not expected to have the ui-state-hover class but in 1.8.x it will ;-)
	execCb(function (){
		ok(testUtils.$('.ui-state-hover, .ui-state-active').length==0, 'there are no buttons with class ui-state-hover or ui-state-active');
	});
	
	execCb(function (){
		ok(true, "complete");
		start();
	});
});

/**
 * !!! IMPORRTANT: Most browsers will detect if the browser window that executes the test is not visible (eg. minimized or its tab is not active) 
 * and will not execute most of the simulated UI events to preserve computational resources, but that of course will break the test. So make sure
 * that window is visible !
 */
