driver.loadLib("recordPageEvents/replayPageEvents");
driver.loadLib("util");
asyncTest("AJAX Tabs", 30, function (){
	var test=this;

	driver.storage.ReplayPageEvents.initialize();
	mockAjaxResponses();

	driver.targetSiteFrame.load(driver.storage.ReplayPageEvents.ajax.attachDocumentListeners);

	testUtils.setPath("/public_html/jqueryui/index.html", ok);
	testWaitForEvent("load", driver.targetSiteFrame);
	wait(1911);
	testFireEvent("mousedown", "html>body>ul>li:eq(3)>a");
	wait(47);
	testFireEvent("click", "html>body>ul>li:eq(3)>a");
	testWaitForEvent("load", driver.targetSiteFrame);
	wait(1621);
	var selector="div#tabs>ul.ui-tabs-nav.ui-helper-reset.ui-helper-clearfix.ui-widget-header.ui-corner-all>li.ui-state-default.ui-corner-top.ui-state-hover>a";
	testFireEvent("mouseover", "div#tabs>ul.ui-tabs-nav.ui-helper-reset.ui-helper-clearfix.ui-widget-header.ui-corner-all>li.ui-state-default.ui-corner-top:eq(1)>a");
	wait(200);
	testFireEvent("mousedown", selector);
	wait(200);
	setAjaxRequestId(12);
	testFireEvent("click", selector);
	wait(200);
	testFireEvent("mouseup", selector);
	wait(200);
	testFireEvent("mouseout", selector);
	wait(63);
	completeAjaxRequest({"responseType":"ajaxSuccess","status":200,"statusText":"success","responseText":"<p><strong>This content was loaded via ajax.</strong></p>\r\n<p>Proin elit arcu, rutrum commodo, vehicula tempus, commodo a, risus. Curabitur nec arcu. Donec sollicitudin mi sit amet mauris. Nam elementum quam ullamcorper ante. Etiam aliquet massa et lorem. Mauris dapibus lacus auctor risus. Aenean tempor ullamcorper leo. Vivamus sed magna quis ligula eleifend adipiscing. Duis orci. Aliquam sodales tortor vitae ipsum. Aliquam nulla. Duis aliquam molestie erat. Ut et mauris vel pede varius sollicitudin. Sed ut dolor nec orci tincidunt interdum. Phasellus ipsum. Nunc tristique tempus lectus.</p>\r\n<p>Mauris vitae ante. Curabitur augue. Nulla purus nibh, lobortis ut, feugiat at, aliquam id, purus. Sed venenatis, lorem venenatis volutpat commodo, purus quam lacinia justo, mattis interdum pede pede a odio. Fusce nibh. Morbi nisl mauris, dapibus in, tristique eget, accumsan et, pede. Donec mauris risus, pulvinar ut, faucibus eu, mollis in, nunc. In augue massa, commodo a, cursus vehicula, varius eu, dui. Suspendisse sodales suscipit lorem. Morbi malesuada, eros quis condimentum dignissim, lectus nibh tristique urna, non bibendum diam massa vel risus. Morbi suscipit. Proin egestas, eros at scelerisque scelerisque, dolor lacus fringilla lacus, ut ullamcorper mi magna at quam. Aliquam sed elit. Aliquam turpis purus, congue quis, iaculis id, ullamcorper sit amet, justo. Maecenas sed mauris. Proin magna justo, interdum in, tincidunt eu, viverra eu, turpis. Suspendisse mollis. In magna. Phasellus pellentesque, urna pellentesque convallis pellentesque, augue sem blandit pede, at rhoncus libero nisl a odio.</p>\r\n<p>Sed vitae nibh non magna semper tempor. Duis dolor. Nam congue laoreet arcu. Fusce lobortis enim quis ligula. Maecenas commodo odio id mi. Maecenas scelerisque tellus eu odio. Etiam dolor purus, lacinia a, imperdiet in, aliquam et, eros. In pellentesque. Nullam ac massa. Integer et turpis. Ut quam augue, congue non, imperdiet id, eleifend ac, nisi. Etiam ac arcu. Cras iaculis accumsan erat. Nullam vulputate sapien nec nisi pretium rhoncus. Aliquam a nibh. Vivamus est ante, fermentum a, tincidunt ut, imperdiet nec, velit. Aenean non tortor. Sed nec mauris eget tellus condimentum rutrum.</p>","ajaxRequestId":12});
	wait(200);
	execCb(function (){
		ok(testUtils.$('#ui-tabs-1 p').length>0, "content is displayed");
	});
	wait(2198);
	testFireEvent("mouseover", "div#tabs>ul.ui-tabs-nav.ui-helper-reset.ui-helper-clearfix.ui-widget-header.ui-corner-all>li.ui-state-default.ui-corner-top:eq(2)>a");
	wait(200);
	testFireEvent("mousedown", selector);
	wait(200);
	setAjaxRequestId(14);
	testFireEvent("click", selector);
	wait(200);
	testFireEvent("mouseup", selector);
	wait(200);
	testFireEvent("mouseout", selector);
	wait(46);
	completeAjaxRequest({"responseType":"ajaxSuccess","status":200,"statusText":"success","responseText":"<p><strong>This other content was loaded via ajax.</strong></p>\r\n<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean nec turpis justo, et facilisis ligula. In congue interdum odio, a scelerisque eros posuere ac. Aenean massa tellus, dictum sit amet laoreet ut, aliquam in orci. Duis eu aliquam ligula. Nullam vel placerat ligula. Fusce venenatis viverra dictum. Phasellus dui dolor, imperdiet in sodales at, mattis sed libero. Morbi ac ipsum ligula. Quisque suscipit dui vel diam pretium nec cursus lacus malesuada. Donec sollicitudin, eros eget dignissim mollis, risus leo feugiat tellus, vel posuere nisl ipsum eu erat. Quisque posuere lacinia imperdiet. Quisque nunc leo, elementum quis ultricies et, vehicula sit amet turpis. Nullam sed nunc nec nibh condimentum mattis. Quisque sed ligula sit amet nisi ultricies bibendum eget id nisi.</p>\r\n<p>Proin ut erat vel nunc tincidunt commodo. Curabitur feugiat, nisi et vehicula viverra, nisl orci eleifend arcu, sed blandit lectus nisl quis nisi. In hac habitasse platea dictumst. In hac habitasse platea dictumst. Aenean rutrum gravida velit ac imperdiet. Integer vitae arcu risus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Proin tincidunt orci at leo egestas porta. Vivamus ac augue et enim bibendum hendrerit ut id urna. Donec sollicitudin pulvinar turpis vitae scelerisque. Etiam tempor porttitor est sed blandit. Phasellus varius consequat leo eget tincidunt. Aliquam ac dui lectus. In et consectetur orci. Duis posuere nulla ac turpis faucibus vestibulum. Sed ut velit et dolor rhoncus dapibus. Sed sit amet pellentesque est.</p>\r\n<p>Nam in volutpat orci. Morbi sit amet orci in erat egestas dignissim. Etiam mi sapien, tempus sed iaculis a, adipiscing quis tellus. Suspendisse potenti. Nam malesuada tristique vestibulum. In tempor tellus dignissim neque consectetur eu vestibulum nisl pellentesque. Phasellus ultrices cursus velit, id aliquam nisl fringilla quis. Cras varius elit sed urna ultrices congue. Sed ornare odio sed velit pellentesque id varius nisl sodales. Sed auctor ligula egestas mi pharetra ut consectetur erat pharetra.</p>","ajaxRequestId":14});
	wait(200);
	execCb(function (){
		ok(testUtils.$('#ui-tabs-2 p').length>0, "content is displayed");
	});
	wait(834);
	testFireEvent("mouseover", "div#tabs>ul.ui-tabs-nav.ui-helper-reset.ui-helper-clearfix.ui-widget-header.ui-corner-all>li.ui-state-default.ui-corner-top:eq(3)>a");
	wait(200);
	testFireEvent("mousedown", selector);
	wait(200);
	setAjaxRequestId(15);
	testFireEvent("click", selector);
	wait(200);
	testFireEvent("mouseup", selector);
	wait(200);
	testFireEvent("mouseout", selector);
	wait(1000); // wait one sec as per the demo description
	completeAjaxRequest({"responseType":"ajaxSuccess","status":200,"statusText":"success","responseText":"<p><strong>This content was loaded via ajax, though it took a second.</strong></p>\r\n<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean nec turpis justo, et facilisis ligula. In congue interdum odio, a scelerisque eros posuere ac. Aenean massa tellus, dictum sit amet laoreet ut, aliquam in orci. Duis eu aliquam ligula. Nullam vel placerat ligula. Fusce venenatis viverra dictum. Phasellus dui dolor, imperdiet in sodales at, mattis sed libero. Morbi ac ipsum ligula. Quisque suscipit dui vel diam pretium nec cursus lacus malesuada. Donec sollicitudin, eros eget dignissim mollis, risus leo feugiat tellus, vel posuere nisl ipsum eu erat. Quisque posuere lacinia imperdiet. Quisque nunc leo, elementum quis ultricies et, vehicula sit amet turpis. Nullam sed nunc nec nibh condimentum mattis. Quisque sed ligula sit amet nisi ultricies bibendum eget id nisi.</p>\r\n<p>Proin ut erat vel nunc tincidunt commodo. Curabitur feugiat, nisi et vehicula viverra, nisl orci eleifend arcu, sed blandit lectus nisl quis nisi. In hac habitasse platea dictumst. In hac habitasse platea dictumst. Aenean rutrum gravida velit ac imperdiet. Integer vitae arcu risus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Proin tincidunt orci at leo egestas porta. Vivamus ac augue et enim bibendum hendrerit ut id urna. Donec sollicitudin pulvinar turpis vitae scelerisque. Etiam tempor porttitor est sed blandit. Phasellus varius consequat leo eget tincidunt. Aliquam ac dui lectus. In et consectetur orci. Duis posuere nulla ac turpis faucibus vestibulum. Sed ut velit et dolor rhoncus dapibus. Sed sit amet pellentesque est.</p>\r\n<p>Nam in volutpat orci. Morbi sit amet orci in erat egestas dignissim. Etiam mi sapien, tempus sed iaculis a, adipiscing quis tellus. Suspendisse potenti. Nam malesuada tristique vestibulum. In tempor tellus dignissim neque consectetur eu vestibulum nisl pellentesque. Phasellus ultrices cursus velit, id aliquam nisl fringilla quis. Cras varius elit sed urna ultrices congue. Sed ornare odio sed velit pellentesque id varius nisl sodales. Sed auctor ligula egestas mi pharetra ut consectetur erat pharetra.</p>","ajaxRequestId":15});
	wait(200);
	execCb(function (){
		ok(testUtils.$('#ui-tabs-3 p').length>0, "content is displayed");
	});
	wait(1134);
	testFireEvent("mouseover", "div#tabs>ul.ui-tabs-nav.ui-helper-reset.ui-helper-clearfix.ui-widget-header.ui-corner-all>li.ui-state-default.ui-corner-top:eq(4)>a");
	wait(200);
	testFireEvent("mousedown", selector);
	wait(200);
	setAjaxRequestId(16);
	testFireEvent("click", selector);
	wait(200);
	testFireEvent("mouseup", selector);
	wait(200);
	testFireEvent("mouseout", selector);
	wait(50);
	completeAjaxRequest({"responseType":"ajaxError","status":404,"statusText":"error","responseText":"Cannot GET /public_html/jqueryui/ajax/content4-broken.php","ajaxRequestId":16});
	wait(200);
	execCb(function (){
		ok(testUtils.$('#ui-tabs-4 p').length==0 && testUtils.$('#ui-tabs-1').html().length>0, "error notice is displayed");
	});

	execCb(function (){
		driver.storage.ReplayPageEvents.ajax.detachDocumentListeners();
		driver.targetSiteFrame.unbind("load", driver.storage.ReplayPageEvents.ajax.attachDocumentListeners);

		ok(true, "complete");
		start();
	});
});