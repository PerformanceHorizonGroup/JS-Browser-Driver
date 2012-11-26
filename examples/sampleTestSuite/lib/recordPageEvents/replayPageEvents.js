registerModule(function (module, require){
	var exports=module.exports;

	var EventEmitter, eventSimulation,
		cbs=[];
	require(['../jquery-ui-1.8.16.custom.min', '../jquery.getPath', '../eventSimulation'], function (exports){
		eventSimulation=exports[2];
		__adaptor__.requireLib(['events', 'helpers'], function (exportsList){
			EventEmitter=exportsList[0].EventEmitter;
			window.recordPageEvents={};
			$.extend(Player.prototype, EventEmitter.prototype);
			$.extend(AjaxHelper.prototype, EventEmitter.prototype);
			
			while(cbs.length)
				cbs.shift()();
			cbs=null;
		});
	});
	
	function AjaxHelper(cfg){
		$.extend(true, this, cfg); //		EventEmitter.call(this, arguments);
		this.initialize();
	}
	$.extend(AjaxHelper.prototype, {
		initialize:function (){
			this.runningAjaxRequests={};
			this.ajaxEventEmitter=new EventEmitter();

			// scope these methods so they can be passed as event callbacks
			this.ajaxSuccess=this.ajaxSuccess.scope(this);
			this.ajaxError=this.ajaxError.scope(this);
		},
		getRequestId:function (){
			return this.player.ajaxRequestIds.shift();
		},
//	function ajaxSend(event, jqXHR, ajaxOptions){ ajaxOptions.__ajax_request_id__ = driver.storage.ReplayPageEvents.ajax.getRequestId(); }
		ajaxSuccess:function (event, jqXHR, ajaxSettings){
			this.emit("ajaxSuccess", jqXHR, ajaxSettings);
		},
		ajaxError:function (event, jqXHR, ajaxSettings, thrownError){
			this.emit("ajaxError", jqXHR, ajaxSettings, thrownError);
		},
		attachDocumentListeners:function (){  //console.log('attachDocumentListeners')
			var win=this.player.frameMngr.el.get(0).contentWindow,
				helper=this;
			if(!win.ajaxListenersAttached){
				win.$(win.document)
//						.ajaxSend(ajaxSend)
					.ajaxSuccess(this.ajaxSuccess)
					.ajaxError(this.ajaxError);
				// try to register this as the first selected transport for all types
				win.$.ajaxTransport( "+json +text +html +*", function( options, originalOptions, jqXHR ){  //console.log('ajaxTransport')
//						debugger
					if(helper.player.mockAjaxResponses){
						var req={
							send:function ( headers, callback ){
								var ajaxRequestId=helper.getRequestId();    console.log('send '+ajaxRequestId)
								options.__ajax_request_id__ = ajaxRequestId;
								helper.runningAjaxRequests[ajaxRequestId]=req;
								req.callback=callback;
							},
							abort:function (){
								delete helper.runningAjaxRequests[options.__ajax_request_id__];
							}
						};
						return req;
					}
				});
				win.ajaxListenersAttached=true;
			}
		},
		detachDocumentListeners:function (){
			var win=this.player.frameMngr.el.get(0).contentWindow;
			win.$(win.document)
//					.unbind('ajaxSend', ajaxSend)
				.unbind('ajaxSuccess', ajaxSuccess)
				.unbind('ajaxError', ajaxError);
			win.ajaxListenersAttached=false;
		}
	});
	
	function Player(cfg){
		$.extend(true, this, cfg); //		EventEmitter.call(this, arguments);
		this.initialize();
	}
	
	$.extend(Player.prototype, {
		initialize:function (){
			this.ajax=new AjaxHelper({player:this});

			this.eventQueueTimer=null;
			this.waiting=false;
			this.autoWait=0;
			this.eventQueue=[];
//			clearTimeout(this.eventQueueTimer);
			this.ajaxRequestIds=[];
			this.mockAjaxResponses=false;

			// scope these methods so they can be passed as event callbacks
			this.onWaitedForEvent=this.onWaitedForEvent.scope(this);
			this.processQueue=this.processQueue.scope(this);

			var player=this;
			function addWaitingCheck(fn){
				return function (){
					if(player.autoWait)
						player.wait(player.autoWait);
					if(player.waiting){
						player.eventQueue.push({
							fn:fn,
							args:arguments
						});
					}else{
						return fn.apply(player, arguments);
					}
				};
			}
			
			for(var m in methods){
				if(m=='wait'){ // wait returns onWaitedForEvent and addWaitingCheck will block this if waiting==true
					this.wait=(function (fn){
						return function (){
							if(player.waiting){
								player.eventQueue.push({
									fn:fn,
									args:arguments
								});
								return player.onWaitedForEvent;
							}else{
								return fn.apply(player, arguments);
							}
						};
					}(methods[m]));
				}else
					this[m] = addWaitingCheck(methods[m]);
			}
		},
		processQueue:function (){
	//		console.log('process '+eventQueue.length+' events in queue');
			while(!this.waiting && this.eventQueue.length){
				var e=this.eventQueue.shift();
	//			console.log('exec from queue: '+e.fn.name);
				e.fn.apply(this, e.args);
			}
		},
		setAutoWait:function (timeout){
			this.autoWait=timeout;
		},
		onWaitedForEvent:function (){
			this.waiting=false;
			this.eventQueueTimer=setTimeout(this.processQueue, 100); // decouple event handlers
		},
		destroy:function (){
			clearTimeout(this.eventQueueTimer);
		}
	});
	
	var methods={
		testFireEvent:function (eventType, selector, eventInfo){
			var target=$(selector, this.frameMngr.el.get(0).contentWindow.document).get(0);
			if(target){
				ok(true, '"'+eventType+'" on '+selector);
				eventSimulation.fireEvent(eventType, target, eventInfo);
				return true;
			}else{
				ok(false, 'Can not find '+selector+' to fire '+eventType);
				return false;
			}
		},
		testWaitForEvent:function (eventType, selector){
			this.waiting=true;
			var player=this,
				target = typeof selector=='string' 
							? 
								$(selector, this.frameMngr.el.get(0).contentWindow.document)
							:
								typeof selector=='function' 
									?
										selector()
									:
										selector
							;
			target.one(eventType, function (){
				ok(true, '"'+eventType+'" on '+(typeof selector=='string' ? selector : target));
				player.onWaitedForEvent();
			});
		},
		waitCheckInterval:function (cb, delay){
			this.waiting=true;
			var player=this;
			var t=setInterval(function (){
				if(cb()){
					clearInterval(t);
					player.onWaitedForEvent();
				}
			}, delay);
		},
		execCb:function (cb){
			cb();
		},
		wait:function (timeout){
			this.waiting=true;
			if(timeout)
				setTimeout(this.onWaitedForEvent, timeout);
			return this.onWaitedForEvent;
		},
		/**
		 * TO-DO: rename to expectAjaxRequestId
		 * DONE!!!
		 */
		expectAjaxRequest:function (reqId){
			this.ajaxRequestIds.push(reqId);
		},
		/**
		 * TO-DO: implement expectAjaxRequest (to replace setAjaxRequestId) and make it configurable so it can complete the request automatically without
		 * a need for completeAjaxRequest. Possible parameters: (Object) resp - Response configuration object;
		 * (Number) autoRespond - time in milliseconds to delay the response ( -1 may make it not respond );
		 * (Object) req - the request parameters to match against;
		 * (Boolean) once - whether to discard the entry after the first matched request or keep serving subsequent requests;
		 */
		completeAjaxRequest:function (cfg){  console.log('completeAjaxRequest ['+cfg.ajaxRequestId+']'); console.log(JSON.stringify(this.ajax.runningAjaxRequests))
			if(this.mockAjaxResponses && this.ajax.runningAjaxRequests[cfg.ajaxRequestId]){   console.log('completeAjaxRequest '+cfg.ajaxRequestId)
				var req=this.ajax.runningAjaxRequests[cfg.ajaxRequestId];
				delete this.ajax.runningAjaxRequests[cfg.ajaxRequestId];
				req.callback(cfg.status, cfg.statusText, {text:cfg.responseText});
			}
		},
		mockAjaxResponses:function (mock){
			this.mockAjaxResponses = mock!==false ;
		}
	};
	
	$.extend(exports, {
		createPlayer:function (frameMngr, cb){
			var obj;
			if(EventEmitter){
				obj=new Player({frameMngr:frameMngr});
				cb&&setTimeout(function (){
					cb(obj);
				}, 15);
				return obj;
			}else if(cb)
				cbs.push(function (){
					cb(new Player({frameMngr:frameMngr}));
				});
		}
	});

});
