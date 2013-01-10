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
asyncTest("Autocomplete", 32, function (){
	var test=this,
		p=this.player,
		testUtils=this.testUtils,
		frameEl=p.frameMngr.el;

	p.initialize();

	testUtils.setPath(frameEl, '/public_html/jqueryui/index.html', ok); // load the index page
	p.testWaitForEvent("load", frameEl);
	p.testFireEvent("click", "html>body>ul>li:eq(1)>a");
	p.testWaitForEvent("load", frameEl);
	
	p.wait(1000);
//	p.testFireEvent("mouseover", "input#tags");
//	p.testFireEvent("mousedown", "input#tags");
//	p.testFireEvent("click", "input#tags");
//	p.testFireEvent("mouseout", "input#tags");
	p.execCb(function (){
		testUtils.$(frameEl, 'input#tags').get(0).focus();
		if($.browser.webkit || $.browser.msie) // the "keypress" event will not fire correctly in Chrome so add the character now
			testUtils.$(frameEl, 'input#tags').val('j');
	});
	p.testFireEvent("keydown", "input#tags", {"keyCode":74,"charCode":0,"which":74,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
	p.testFireEvent("keypress", "input#tags", {"keyCode":106,"charCode":106,"which":106,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
	p.testFireEvent("keyup", "input#tags", {"keyCode":74,"charCode":0,"which":74,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
	p.wait(1000);
	p.testFireEvent("mouseover", "html>body>ul.ui-autocomplete.ui-menu.ui-widget.ui-widget-content.ui-corner-all>li.ui-menu-item:eq(1)>a.ui-corner-all");
	p.wait(1000);
	p.testFireEvent("mousedown", "html>body>ul.ui-autocomplete.ui-menu.ui-widget.ui-widget-content.ui-corner-all>li.ui-menu-item:eq(1)>a.ui-corner-all");
	p.testFireEvent("click", "html>body>ul.ui-autocomplete.ui-menu.ui-widget.ui-widget-content.ui-corner-all>li.ui-menu-item:eq(1)>a.ui-corner-all");
//	p.testFireEvent("mouseout", "html>body>ul.ui-autocomplete.ui-menu.ui-widget.ui-widget-content.ui-corner-all>li.ui-menu-item:eq(1)>a.ui-corner-all");
	p.wait(1000);
	p.execCb(function (){
		equal(testUtils.$(frameEl, 'input#tags').val(), 'Java', 'Java was selected');
	});
//	p.testFireEvent("click", "input#tags");
//	p.testFireEvent("click", "input#tags");
//	p.execCb(function (){
//		testUtils.$('input#tags').get(0).focus();
//	});
//	p.testFireEvent("dblclick", "input#tags");
	p.execCb(function (){
		testUtils.$(frameEl, 'input#tags').get(0).focus();
		testUtils.$(frameEl, 'input#tags').get(0).select();
		if($.browser.webkit || $.browser.msie) // the "keypress" event will not fire correctly in Chrome so add the character now
			testUtils.$(frameEl, 'input#tags').val('j');
	});
	p.wait(1000);
	p.testFireEvent("keydown", "input#tags", {"keyCode":8,"charCode":0,"which":8,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
	p.testFireEvent("keypress", "input#tags", {"keyCode":8,"charCode":0,"which":8,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
	p.testFireEvent("keyup", "input#tags", {"keyCode":8,"charCode":0,"which":8,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
	p.testFireEvent("keydown", "input#tags", {"keyCode":74,"charCode":0,"which":74,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
	p.testFireEvent("keypress", "input#tags", {"keyCode":106,"charCode":106,"which":106,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
	p.testFireEvent("keyup", "input#tags", {"keyCode":74,"charCode":0,"which":74,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
	p.wait(1000);
	p.testFireEvent("mouseover", "html>body>ul.ui-autocomplete.ui-menu.ui-widget.ui-widget-content.ui-corner-all>li.ui-menu-item:eq(2)>a.ui-corner-all");
	p.wait(1000);
	p.testFireEvent("mousedown", "html>body>ul.ui-autocomplete.ui-menu.ui-widget.ui-widget-content.ui-corner-all>li.ui-menu-item:eq(2)>a.ui-corner-all");
	p.testFireEvent("click", "html>body>ul.ui-autocomplete.ui-menu.ui-widget.ui-widget-content.ui-corner-all>li.ui-menu-item:eq(2)>a.ui-corner-all");
//	p.testFireEvent("mouseout", "html>body>ul.ui-autocomplete.ui-menu.ui-widget.ui-widget-content.ui-corner-all>li.ui-menu-item:eq(2)>a.ui-corner-all");
	p.wait(1000);
	p.execCb(function (){
		equal(testUtils.$(frameEl, 'input#tags').val(), 'Javascript', 'Javascript was selected');
	});

	p.execCb(function (){
		testUtils.$(frameEl, 'input#tags').get(0).focus();
		testUtils.$(frameEl, 'input#tags').get(0).select();
		if($.browser.webkit || $.browser.msie) // the "keypress" event will not fire correctly in Chrome so add the character now
			testUtils.$(frameEl, 'input#tags').val('p');
	});
	p.wait(1000);
	p.testFireEvent("keydown", "input#tags", {"keyCode":8,"charCode":0,"which":8,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
	p.testFireEvent("keypress", "input#tags", {"keyCode":8,"charCode":0,"which":8,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
	p.testFireEvent("keyup", "input#tags", {"keyCode":8,"charCode":0,"which":8,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
	p.testFireEvent("keydown", "input#tags", {"keyCode":80,"charCode":0,"which":80,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
	p.testFireEvent("keypress", "input#tags", {"keyCode":112,"charCode":112,"which":112,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
	p.testFireEvent("keyup", "input#tags", {"keyCode":80,"charCode":0,"which":80,"shiftKey":false,"metaKey":false,"ctrlKey":false,"altKey":false});
	p.wait(1000);
	p.testFireEvent("mouseover", "html>body>ul.ui-autocomplete.ui-menu.ui-widget.ui-widget-content.ui-corner-all>li.ui-menu-item:eq(0)>a.ui-corner-all");
	p.wait(1000);
	p.testFireEvent("mousedown", "html>body>ul.ui-autocomplete.ui-menu.ui-widget.ui-widget-content.ui-corner-all>li.ui-menu-item:eq(0)>a.ui-corner-all");
	p.testFireEvent("click", "html>body>ul.ui-autocomplete.ui-menu.ui-widget.ui-widget-content.ui-corner-all>li.ui-menu-item:eq(0)>a.ui-corner-all");
//	p.testFireEvent("mouseout", "html>body>ul.ui-autocomplete.ui-menu.ui-widget.ui-widget-content.ui-corner-all>li.ui-menu-item:eq(0)>a.ui-corner-all");
	p.wait(1000);
	p.execCb(function (){
		equal(testUtils.$(frameEl, 'input#tags').val(), 'ActionScript', 'ActionScript was selected');
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
