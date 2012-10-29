//driver.loadLib("recordPageEvents/replayPageEvents");
//asyncTest("auto-generated-test", function (){
//	var test=this;
//
//	expect(18)
//
//	testFireEvent("click", "html>body>ul>li:eq(1)>a");
//	testWaitForEvent("load", driver.targetSiteFrame);
//	testFireEvent("click", "input#tags");
//	testFireEvent("keydown", "input#tags", {"keyCode":74,"charCode":0,"which":74,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
//	testFireEvent("keypress", "input#tags", {"keyCode":0,"charCode":106,"which":106,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
//	testFireEvent("keyup", "input#tags", {"keyCode":74,"charCode":0,"which":74,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
//	testFireEvent("click", "html>body>ul.ui-autocomplete.ui-menu.ui-widget.ui-widget-content.ui-corner-all>li.ui-menu-item:eq(1)>a.ui-corner-all");
//	testFireEvent("click", "input#tags");
//	testFireEvent("click", "input#tags");
//	testFireEvent("dblclick", "input#tags");
//	testFireEvent("keydown", "input#tags", {"keyCode":8,"charCode":0,"which":8,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
//	testFireEvent("keypress", "input#tags", {"keyCode":8,"charCode":0,"which":8,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
//	testFireEvent("keyup", "input#tags", {"keyCode":8,"charCode":0,"which":8,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
//	testFireEvent("keydown", "input#tags", {"keyCode":74,"charCode":0,"which":74,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
//	testFireEvent("keypress", "input#tags", {"keyCode":0,"charCode":106,"which":106,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
//	testFireEvent("keyup", "input#tags", {"keyCode":74,"charCode":0,"which":74,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
//	testFireEvent("click", "html>body>ul.ui-autocomplete.ui-menu.ui-widget.ui-widget-content.ui-corner-all>li.ui-menu-item:eq(2)>a.ui-corner-all");
//
//	execCb(function (){
//		ok(true, "complete");
//		start();
//	});
//});

//driver.loadLib("util");
//driver.loadLib("recordPageEvents/replayPageEvents");
asyncTest("Autocomplete", 32, function (){
	var test=this;

	driver.storage.ReplayPageEvents.initialize();

	testUtils.setPath('/public_html/jqueryui/index.html', ok); // load the index page
	testWaitForEvent("load", driver.targetSiteFrame);
	testFireEvent("click", "html>body>ul>li:eq(1)>a");
	testWaitForEvent("load", driver.targetSiteFrame);
	
	wait(1000);
//	testFireEvent("mouseover", "input#tags");
//	testFireEvent("mousedown", "input#tags");
//	testFireEvent("click", "input#tags");
//	testFireEvent("mouseout", "input#tags");
	execCb(function (){
		testUtils.$('input#tags').get(0).focus();
		if($.browser.webkit || $.browser.msie) // the "keypress" event will not fire correctly in Chrome so add the character now
			testUtils.$('input#tags').val('j');
	});
	testFireEvent("keydown", "input#tags", {"keyCode":74,"charCode":0,"which":74,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
	testFireEvent("keypress", "input#tags", {"keyCode":106,"charCode":106,"which":106,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
	testFireEvent("keyup", "input#tags", {"keyCode":74,"charCode":0,"which":74,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
	wait(1000);
	testFireEvent("mouseover", "html>body>ul.ui-autocomplete.ui-menu.ui-widget.ui-widget-content.ui-corner-all>li.ui-menu-item:eq(1)>a.ui-corner-all");
	wait(1000);
	testFireEvent("mousedown", "html>body>ul.ui-autocomplete.ui-menu.ui-widget.ui-widget-content.ui-corner-all>li.ui-menu-item:eq(1)>a.ui-corner-all");
	testFireEvent("click", "html>body>ul.ui-autocomplete.ui-menu.ui-widget.ui-widget-content.ui-corner-all>li.ui-menu-item:eq(1)>a.ui-corner-all");
//	testFireEvent("mouseout", "html>body>ul.ui-autocomplete.ui-menu.ui-widget.ui-widget-content.ui-corner-all>li.ui-menu-item:eq(1)>a.ui-corner-all");
	wait(1000);
	execCb(function (){
		equal(testUtils.$('input#tags').val(), 'Java', 'Java was selected');
	});
//	testFireEvent("click", "input#tags");
//	testFireEvent("click", "input#tags");
//	execCb(function (){
//		testUtils.$('input#tags').get(0).focus();
//	});
//	testFireEvent("dblclick", "input#tags");
	execCb(function (){
		testUtils.$('input#tags').get(0).focus();
		testUtils.$('input#tags').get(0).select();
		if($.browser.webkit || $.browser.msie) // the "keypress" event will not fire correctly in Chrome so add the character now
			testUtils.$('input#tags').val('j');
	});
	wait(1000);
	testFireEvent("keydown", "input#tags", {"keyCode":8,"charCode":0,"which":8,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
	testFireEvent("keypress", "input#tags", {"keyCode":8,"charCode":0,"which":8,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
	testFireEvent("keyup", "input#tags", {"keyCode":8,"charCode":0,"which":8,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
	testFireEvent("keydown", "input#tags", {"keyCode":74,"charCode":0,"which":74,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
	testFireEvent("keypress", "input#tags", {"keyCode":106,"charCode":106,"which":106,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
	testFireEvent("keyup", "input#tags", {"keyCode":74,"charCode":0,"which":74,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
	wait(1000);
	testFireEvent("mouseover", "html>body>ul.ui-autocomplete.ui-menu.ui-widget.ui-widget-content.ui-corner-all>li.ui-menu-item:eq(2)>a.ui-corner-all");
	wait(1000);
	testFireEvent("mousedown", "html>body>ul.ui-autocomplete.ui-menu.ui-widget.ui-widget-content.ui-corner-all>li.ui-menu-item:eq(2)>a.ui-corner-all");
	testFireEvent("click", "html>body>ul.ui-autocomplete.ui-menu.ui-widget.ui-widget-content.ui-corner-all>li.ui-menu-item:eq(2)>a.ui-corner-all");
//	testFireEvent("mouseout", "html>body>ul.ui-autocomplete.ui-menu.ui-widget.ui-widget-content.ui-corner-all>li.ui-menu-item:eq(2)>a.ui-corner-all");
	wait(1000);
	execCb(function (){
		equal(testUtils.$('input#tags').val(), 'Javascript', 'Javascript was selected');
	});

	execCb(function (){
		testUtils.$('input#tags').get(0).focus();
		testUtils.$('input#tags').get(0).select();
		if($.browser.webkit || $.browser.msie) // the "keypress" event will not fire correctly in Chrome so add the character now
			testUtils.$('input#tags').val('p');
	});
	wait(1000);
	testFireEvent("keydown", "input#tags", {"keyCode":8,"charCode":0,"which":8,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
	testFireEvent("keypress", "input#tags", {"keyCode":8,"charCode":0,"which":8,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
	testFireEvent("keyup", "input#tags", {"keyCode":8,"charCode":0,"which":8,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
	testFireEvent("keydown", "input#tags", {"keyCode":80,"charCode":0,"which":80,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
	testFireEvent("keypress", "input#tags", {"keyCode":112,"charCode":112,"which":112,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
	testFireEvent("keyup", "input#tags", {"keyCode":80,"charCode":0,"which":80,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
	wait(1000);
	testFireEvent("mouseover", "html>body>ul.ui-autocomplete.ui-menu.ui-widget.ui-widget-content.ui-corner-all>li.ui-menu-item:eq(0)>a.ui-corner-all");
	wait(1000);
	testFireEvent("mousedown", "html>body>ul.ui-autocomplete.ui-menu.ui-widget.ui-widget-content.ui-corner-all>li.ui-menu-item:eq(0)>a.ui-corner-all");
	testFireEvent("click", "html>body>ul.ui-autocomplete.ui-menu.ui-widget.ui-widget-content.ui-corner-all>li.ui-menu-item:eq(0)>a.ui-corner-all");
//	testFireEvent("mouseout", "html>body>ul.ui-autocomplete.ui-menu.ui-widget.ui-widget-content.ui-corner-all>li.ui-menu-item:eq(0)>a.ui-corner-all");
	wait(1000);
	execCb(function (){
		equal(testUtils.$('input#tags').val(), 'ActionScript', 'ActionScript was selected');
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
