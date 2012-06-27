(function (){
	driver.loadLib('EventEmitter.js');
	driver.loadLib("eventSimulation");
	
	var waiting=false,
		autoWait=0,
		eventQueue=[],
		eventQueueTimer=null,
		ajaxRequestIds=[],
		mockAjaxResponses=false,
		runningAjaxRequests={};
		
	function processQueue(){
//		console.log('process '+eventQueue.length+' events in queue');
		while(!waiting && eventQueue.length){
			var e=eventQueue.shift();
//			console.log('exec from queue: '+e.fn.name);
			e.fn.apply(null, e.args);
		}
	}
	function onWaitedForEvent(){
		waiting=false;
		eventQueueTimer=setTimeout(processQueue, 100); // decouple event handlers
	}
	
	var methods={
		testFireEvent:function (eventType, selector, eventInfo){
			var target=$(selector, driver.targetSiteFrame.get(0).contentWindow.document).get(0);
			if(target){
				ok(true, '"'+eventType+'" on '+selector);
				driver.storage.fireEvent(eventType, target, eventInfo);
				return true;
			}else{
				ok(false, 'Can not find '+selector+' to fire '+eventType);
				return false;
			}
		},
		testWaitForEvent:function (eventType, selector){
			waiting=true;
			var target = typeof selector=='string' 
							? 
								$(selector, driver.targetSiteFrame.get(0).contentWindow.document)
							:
								typeof selector=='function' 
									?
										selector()
									:
										selector
							;
			target.one(eventType, function (){
				ok(true, '"'+eventType+'" on '+(typeof selector=='string' ? selector : target));
				onWaitedForEvent();
			});
		},
		waitCheckInterval:function (cb, delay){
			waiting=true;
			var t=setInterval(function (){
				if(cb()){
					clearInterval(t);
					onWaitedForEvent();
				}
			}, delay);
		},
		execCb:function (cb){
			cb();
		},
		wait:function (timeout){
			waiting=true;
			if(timeout)
				setTimeout(onWaitedForEvent, timeout);
			return onWaitedForEvent;
		},
		/**
		 * TO-DO: rename to expectAjaxRequestId
		 */
		setAjaxRequestId:function (reqId){
			ajaxRequestIds.push(reqId);
		},
		/**
		 * TO-DO: implement expectAjaxRequest (to replace setAjaxRequestId) and make it configurable so it can complete the request automatically without
		 * a need for completeAjaxRequest. Possible parameters: (Object) resp - Response configuration object;
		 * (Number) autoRespond - time in milliseconds to delay the response ( -1 may make it not respond );
		 * (Object) req - the request parameters to match against;
		 * (Boolean) once - whether to discard the entry after the first matched request or keep serving subsequent requests;
		 */
		completeAjaxRequest:function (cfg){  console.log('completeAjaxRequest ['+cfg.ajaxRequestId+']'); console.log(JSON.stringify(runningAjaxRequests))
			if(mockAjaxResponses && runningAjaxRequests[cfg.ajaxRequestId]){   console.log('completeAjaxRequest '+cfg.ajaxRequestId)
				var req=runningAjaxRequests[cfg.ajaxRequestId];
				delete runningAjaxRequests[cfg.ajaxRequestId];
				req.callback(cfg.status, cfg.statusText, {text:cfg.responseText});
			}
		},
		mockAjaxResponses:function (mock){
			mockAjaxResponses = mock!==false ;
		}
	};
	var tmp={};
	function addWaitingCheck(fn){
		return function (){
			if(autoWait)
				wait(autoWait);
			if(waiting){
				eventQueue.push({
					fn:fn,
					args:arguments
				});
			}else{
				return fn.apply(this, arguments);
			}
		};
	}
	
	/**
	 * TO-DO: instead of adding all these to the window object consider using something like the "fancy metaprogramming learned from 
	 * the formidable Yehuda Katz" in Screw.Unit - rebuilding the test functions inside with(){} blocks. But this must be made
	 * somewhere in the adaptor object.
	 */
	for(var m in methods){
		if(m=='wait'){ // wait returns onWaitedForEvent and addWaitingCheck will block this if waiting==true
			window.wait=(function (fn){
				return function (){
					if(waiting){
						eventQueue.push({
							fn:fn,
							args:arguments
						});
						return onWaitedForEvent;
					}else{
						return fn.apply(this, arguments);
					}
				};
			}(methods[m]));
		}else
			window[m] = addWaitingCheck(methods[m]);
	}
	methods=tmp;
	tmp=null;
	
	window.setAutoWait=function (timeout){
		autoWait=timeout;
	};
	
//	function ajaxSend(event, jqXHR, ajaxOptions){ ajaxOptions.__ajax_request_id__ = driver.storage.ReplayPageEvents.ajax.getRequestId(); }
	function ajaxSuccess(event, jqXHR, ajaxSettings){
		driver.storage.ReplayPageEvents.ajax.ajaxEventEmitter.trigger("success", [jqXHR, ajaxSettings]);
	}
	function ajaxError(event, jqXHR, ajaxSettings, thrownError){
		driver.storage.ReplayPageEvents.ajax.ajaxEventEmitter.trigger("error", [jqXHR, ajaxSettings, thrownError]);
	}

	driver.storage.ReplayPageEvents={
		initialize:function (){
			this.ajax.ajaxEventEmitter=new EventEmitter();

			waiting=false;
			autoWait=0;
			eventQueue=[];
			clearTimeout(eventQueueTimer);
			ajaxRequestIds=[];
			mockAjaxResponses=false;
			runningAjaxRequests={};
		},
		ajax:{
			getRequestId:function (){
				return ajaxRequestIds.shift();
			},
//			ajaxEventEmitter:new EventEmitter(),
			attachDocumentListeners:function (){  //console.log('attachDocumentListeners')
				var win=driver.targetSiteFrame.get(0).contentWindow;
				if(!win.ajaxListenersAttached){
					win.$(win.document)
//						.ajaxSend(ajaxSend)
						.ajaxSuccess(ajaxSuccess)
						.ajaxError(ajaxError);
					// try to register this as the first selected transport for all types
					win.$.ajaxTransport( "+json +text +html +*", function( options, originalOptions, jqXHR ){  //console.log('ajaxTransport')
//						debugger
						if(mockAjaxResponses){
							var req={
								send:function ( headers, callback ){
									var ajaxRequestId=driver.storage.ReplayPageEvents.ajax.getRequestId();    console.log('send '+ajaxRequestId)
									options.__ajax_request_id__ = ajaxRequestId;
									runningAjaxRequests[ajaxRequestId]=req;
									req.callback=callback;
								},
								abort:function (){
									delete runningAjaxRequests[options.__ajax_request_id__];
								}
							};
							return req;
						}
					});
					win.ajaxListenersAttached=true;
				}
			},
			detachDocumentListeners:function (){
				var win=driver.targetSiteFrame.get(0).contentWindow;
				win.$(win.document)
//					.unbind('ajaxSend', ajaxSend)
					.unbind('ajaxSuccess', ajaxSuccess)
					.unbind('ajaxError', ajaxError);
				win.ajaxListenersAttached=false;
			}
		}
	};

	
}());
