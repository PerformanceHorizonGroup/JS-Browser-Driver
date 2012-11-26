registerModule(function (module, require){
	var exports=module.exports;

	__adaptor__.attachStylesheet(module.url.replace(/[^\/]*$/, '../bootstrap/css/bootstrap.min.css'));
	var EventEmitter,
		cbs=[];
	require(['../jquery-ui-1.8.16.custom.min', '../jquery.getPath'], function (){
		__adaptor__.requireLib(['events', 'helpers'], function (exportsList){
			EventEmitter=exportsList[0].EventEmitter;
			window.recordPageEvents={};
			$.extend(ControlPanel.prototype, EventEmitter.prototype);
			
			while(cbs.length)
				cbs.shift()();
			cbs=null;
		});
	});
	
	function ControlPanel(cfg){
		$.extend(true, this, cfg); //		EventEmitter.call(this, arguments);
		this.initialize();
	}
	
	$.extend(ControlPanel.prototype, {
		initialize:function (){
			// scope these methods so they can be passed as event callbacks
			this.appendRecordedEvent=this.appendRecordedEvent.scope(this);
			this.onAjaxSend=this.onAjaxSend.scope(this);
			this.onAjaxSuccess=this.onAjaxSuccess.scope(this);
			this.onAjaxError=this.onAjaxError.scope(this);
			this.ajaxPrefilter=this.ajaxPrefilter.scope(this);
			this.onPageLoad=this.onPageLoad.scope(this);
			
			this.recordingOptions={};
			this.recording=false;
			this.recordedEvents=[];
			this.eventsList=null;
			
			// "beforePageInit" is only triggered by the target page if it was coded to do it 
			this.frameMngr.el.bind('beforePageInit', function (){
				if(this.recording)
					this.attachDocumentListeners();
			}.scope(this));
			this.el=$('<div class="record-page-event-controls">' +
						'<button class="close-bar btn btn-warning"><i class="icon-remove-circle icon-white"></i> Close</button>' +
						'<span class="separator">|</span> url to open: <input type="text" class="page-url"> (hit Enter) ' +
						'<span class="separator">|</span> <button class="record btn btn-danger"><i class="icon-time icon-white"></i> Record</button>' +
						'<div class="recording-options">' +
							'<label class="form-inline"><input type="checkbox" class="record-ajax-data"> Record AJAX data</label>' +
							'<label class="form-inline"><input type="checkbox" class="mock-server-side"> Mock the server side</label>' +
							'<label class="form-inline"><input type="checkbox" class="record-hvoer-events"> Record <em>hover</em> events</label>' +
						'</div>' +
						'<div class="recording-tools">' +
							'<button class="generate-test-code btn btn-primary"><i class="icon-cog icon-white"></i> Generate Test</button>' +
						'</div>' +
						'<div class="recorded-events-list"><span class="title">Recorded events</span>:<div class="items"></div></div>' +
					'</div>')
					.appendTo(document.body)
					.draggable({cancel:'.record-page-event-controls>*', iframeFix:this.frameMngr.el})
					.mouseup(function (event, ui){
						 $('.ui-draggable-iframeFix').remove(); // do this in mouseup because the iframefix is added on mousedown and not when dragging actually starts
					})
					.css('position', 'absolute');
			var panelEl=this.el;
			if(!Number(panelEl.css('borderTopWidth')))
				__adaptor__.attachStylesheet(module.url.replace(/[^\/]*$/, 'recordPageEvents.css'));
			$('.close-bar', panelEl).click(function (){
				if(this.emit('beforeClose')!==false)
					this.destroy();
			}.scope(this));
			this.frameMngr.el.load(function (){
				$('.page-url').val(this.contentWindow.location.href);
			});
			$('.page-url').change(function (evt){
				var url=evt.target.value;
				if(this.recording){
					this.eventsList.append('<div>loadUrl '+url+'</div>');
					this.recordedEvents.push({
						evt:{
							type:'loadUrl'
						},
						href:url,
						time:new Date()
					});
				}
				this.frameMngr.load(url);
			}.scope(this));
			$('.record').click(function (){
				this[this.recording?'stopRecording':'startRecording']();
			}.scope(this));
			$('.generate-test-code').click(function (){
				$('.recorded-events-list .title', panelEl).html('Generated test code');
				$('.recorded-events-list', panelEl).show();
				this.eventsList.empty().append($('<pre></pre>').text(this.generateTestCode()));
			}.scope(this));
			this.eventsList=$('.recorded-events-list .items', panelEl);
		},
		startRecording:function (){
			this.recordedEvents=[];
			this.recordingOptions={
				recordHoverEvents:$('.record-hover-events').is(':checked'),
				recordAjaxData:$('.record-ajax-data').is(':checked'),
				mockServerSide:$('.mock-server-side').is(':checked')
			};
			$('.generate-test-code').attr('disabled', 'true');
			$('.recorded-events-list .title', this.el).html('Recorded events');
			this.eventsList.empty();
			$('.recording-options :input').attr('disabled', true);
			$('.record', this.el).html('Stop');
			this.recording=true;
			$('.recorded-events-list', this.el).show();
			// attach event listeners
			this.frameMngr.el.load(this.onPageLoad);
			if(this.frameMngr.el.get(0).contentWindow)				
				this.attachDocumentListeners();
		},
		stopRecording:function (){
			$('.generate-test-code').removeAttr('disabled');
			$('.recording-options :input').removeAttr('disabled');
			$('.record', this.el).html('Record');
			this.recording=false;
			$('.recorded-events-list', this.el).hide();
			// detach event listeners
			this.frameMngr.el.unbind('load', this.onPageLoad);					
			if(this.frameMngr.el.get(0).contentWindow)
				this.detachDocumentListeners();				
		},
		appendRecordedEvent:function (evt){
			var e={
				evt:evt,
				time:new Date()
			};
			this.eventsList.append('<div>'+evt.type+' '+$(evt.target).getPath(true)+'</div>');
			switch(evt.type){
				case 'load':
					break;
				case 'keydown':
				case 'keyup':
				case 'keypress':
						e.keyInfo={
							keyCode: evt.keyCode,
							key: evt.key,
							charCode: evt.charCode,
							'char': evt['char'],
							which: evt.which,
							shiftKey: evt.shiftKey,
							metaKey: evt.metaKey,
							ctrlKey: evt.ctrlKey,
							altKey: evt.altKey
						};
	//			case 'change':
				case 'click':
				case 'dblclick':
				case 'mousedown':
				case 'mouseup':
				case 'mouseover':
				case 'mouseout':
						e.elementPath=$(evt.target).getPath(true);
					break;
			}
			this.recordedEvents.push(e);
		},
		onPageLoad:function (evt){
			if(this.recording){ // if we are already recording then document listeners have not been attached as the page just loaded
				this.attachDocumentListeners();
				this.eventsList.append('<div>pageLoad</div>');
				this.recordedEvents.push({
					evt:{
						type:'pageLoad'
					},
					time:new Date()
				});
			}
		},
		onAjaxSend:function (event, jqXHR, ajaxOptions){
			this.eventsList.append('<div>ajaxSend</div>');
			var d={
				evt:{
					type:'ajaxSend'
				},
				originalOptions:ajaxOptions.__originalOptions_cache__,
				ajaxRequestId:ajaxOptions.__ajax_request_id__,
				time:new Date()
			};
			this.recordedEvents.push(d);
		},
		onAjaxSuccess:function (event, XMLHttpRequest, ajaxOptions/*obj, dlr, cbArgs*/){
			this.eventsList.append('<div>ajaxSuccess</div>');
			var d={
				evt:{
					type:'ajaxSuccess'
				},
				originalOptions:ajaxOptions.__originalOptions_cache__,
				ajaxRequestId:ajaxOptions.__ajax_request_id__,
				time:new Date()
			};
			if(this.recordingOptions.mockServerSide){
				d.status=XMLHttpRequest.status;
				d.statusText=XMLHttpRequest.statusText;
				d.responseText=XMLHttpRequest.responseText;
			}
			this.recordedEvents.push(d);
		},
		onAjaxError:function (event, XMLHttpRequest, ajaxOptions, thrownError /*obj, dlr, cbArgs*/){
			this.eventsList.append('<div>ajaxError</div>');
			var d={
				evt:{
					type:'ajaxError'
				},
				originalOptions:ajaxOptions.__originalOptions_cache__,
				ajaxRequestId:ajaxOptions.__ajax_request_id__,
				time:new Date()
			};
			if(this.recordingOptions.mockServerSide){
				d.status=XMLHttpRequest.status;
				d.statusText=XMLHttpRequest.statusText;
				d.responseText=XMLHttpRequest.responseText;
			}
			this.recordedEvents.push(d);
		},
		ajaxPrefilter:function ( options, originalOptions, jqXHR ){
			options.__originalOptions_cache__ = originalOptions; // cache this so we can access it later in $().ajaxSuccess/Error
			options.__ajax_request_id__ = this.frameMngr.el.get(0).contentWindow.$.guid++; // tag it so we can later match responses with requests
		},
		attachDocumentListeners:function (){
			var win=this.frameMngr.el.get(0).contentWindow;
			if(!win.documentListenersAttached && win.$){
				var doc=win.document;
				$(doc).click(this.appendRecordedEvent);
				$(doc).dblclick(this.appendRecordedEvent);
				$(doc).mousedown(this.appendRecordedEvent);
				if(this.recordingOptions.recordHoverEvents){
					$(doc).mouseover(this.appendRecordedEvent);
					$(doc).mouseout(this.appendRecordedEvent);
				}
				$(doc).keydown(this.appendRecordedEvent);
				$(doc).keyup(this.appendRecordedEvent);
				$(doc).keypress(this.appendRecordedEvent);
				if(this.recordingOptions.recordAjaxData){
					win.$.ajaxPrefilter(this.ajaxPrefilter);
					win.$(doc).ajaxSend(this.onAjaxSend); 
	//				win.$(doc).ajaxComplete(onAjaxComplete); 
					win.$(doc).ajaxSuccess(this.onAjaxSuccess); 
					win.$(doc).ajaxError(this.onAjaxError); 
				}
				if(this.recordingOptions.mockServerSide){
		
				}
				win.documentListenersAttached=true;
			}
		},
		detachDocumentListeners:function (){
			var win=this.frameMngr.el.get(0).contentWindow,
				doc=win.document;
			$(doc).unbind('click', this.appendRecordedEvent);
			$(doc).unbind('dblclick', this.appendRecordedEvent);
			$(doc).unbind('mousedown', this.appendRecordedEvent);
			$(doc).unbind('mouseup', this.appendRecordedEvent);
			if(this.recordingOptions.recordHoverEvents){
				$(doc).unbind('mouseover', this.appendRecordedEvent);
				$(doc).unbind('mouseout', this.appendRecordedEvent);
			}
			$(doc).unbind('keydown', this.appendRecordedEvent);
			$(doc).unbind('keyup', this.appendRecordedEvent);
			$(doc).unbind('keypress', this.appendRecordedEvent);
			if(this.recordingOptions.recordAjaxData){
				win.$(doc).unbind('ajaxSend', this.onAjaxSend);
	//			win.$(doc).unbind('ajaxComplete', onAjaxComplete);
				win.$(doc).unbind('ajaxSuccess', this.onAjaxSuccess);
				win.$(doc).unbind('ajaxError', this.onAjaxError);
			}
			if(this.recordingOptions.mockServerSide){
			}
			win.documentListenersAttached=false;
		},
		generateTestCode:function (){
			var expectCount=0,
				code=['module("auto-generated-module", {'];
				code.push('setup:function (){');
					code.push('var env=this;');
					code.push('this.__testInst.requireCustomLib([\'util\', \'recordPageEvents/replayPageEvents\', \'frameMngr\'], function (exportsList){');
						code.push('env.testUtils=exportsList[0];');
						code.push('var waitFn=env.__testInst.waitForSetup();');
						code.push('env.frameMngr=exportsList[2].createFrame(function (frameMngr){');
							code.push('frameMngr.el.css({border:0, width:\'100%\', height:\'100%\'});');
							code.push('env.player=exportsList[1].createPlayer(frameMngr, function (player){');
								code.push('env.player=player;');
								code.push('waitFn();');
							code.push('});');
						code.push('});');
					code.push('});');
				code.push('},');
				code.push('teardown:function (){');
					code.push('this.player.frameMngr.el.remove();');
					code.push('this.player.destroy();');
				code.push('}');
			code.push('});');
			
			code.push('asyncTest("auto-generated-test", function (){');
			code.push('var test=this,');
				code.push('p=this.player,');
				code.push('testUtils=this.testUtils,');
				code.push('frameEl=p.frameMngr.el;');
			code.push('');
			code.push('p.initialize();');
			
			var expectAjaxRequestCallInd;
			if(this.recordingOptions.mockServerSide){
				code.push('p.mockAjaxResponses();');
				expectAjaxRequestCallInd=code.length;
			}
			code.push('');
			if(this.recordingOptions.recordAjaxData){
//				code.push('driver.bind("beforePageInit", driver.storage.ReplayPageEvents.ajax.attachDocumentListeners);');
				/**
				 * TO-DO: add this line only of there was a "load" event recorded 
				 */
				code.push('frameEl.load(p.ajax.attachDocumentListeners.scope(p.ajax));');
				code.push('');
			}
			for(var i=0; i<this.recordedEvents.length; i++){
				if(i>0 && this.recordedEvents[i].evt.type!='pageLoad' && this.recordedEvents[i].evt.type!='ajaxSend')
					code.push('p.wait('+(this.recordedEvents[i].time.getTime()-this.recordedEvents[i-1].time.getTime())+');');
				switch(this.recordedEvents[i].evt.type){
					case 'pageLoad':
							++expectCount;
							code.push('p.testWaitForEvent(\'load\', frameEl);');
						break;
					case 'keydown':
					case 'keyup':
					case 'keypress':
							++expectCount;
							code.push('p.testFireEvent("'+this.recordedEvents[i].evt.type+'", "'+this.recordedEvents[i].elementPath+'", '+JSON.stringify(this.recordedEvents[i].keyInfo)+');');
						break;
//					case 'change':
					case 'click':
					case 'dblclick':
					case 'mousedown':
					case 'mouseup':
					case 'mouseover':
					case 'mouseout':
							++expectCount;
							code.push('p.testFireEvent("'+this.recordedEvents[i].evt.type+'", "'+this.recordedEvents[i].elementPath+'");');
						break;
					case 'ajaxSend':
							if(this.recordingOptions.mockServerSide){
								code.splice(expectAjaxRequestCallInd++, 0, 'p.expectAjaxRequest('+this.recordedEvents[i].ajaxRequestId+');');
								code.push('// ajaxSend '+this.recordedEvents[i].ajaxRequestId);
							}else
								// find the response that the server returned in the events following
								for(var e=i+1; e<this.recordedEvents.length; e++)
									if(this.recordedEvents[e].ajaxRequestId==this.recordedEvents[i].ajaxRequestId){
										++expectCount;
										code.push('p.testWaitForEvent("'+this.recordedEvents[e].evt.type+'", p.ajax);');
										this.recordedEvents.splice(e, 1);
										break;
									}
						break;
					case 'ajaxSuccess':
					case 'ajaxError':
							if(this.recordingOptions.mockServerSide){
								code.push('p.completeAjaxRequest('+JSON.stringify({
									responseType:this.recordedEvents[i].evt.type,
									status:this.recordedEvents[i].status,
									statusText:this.recordedEvents[i].statusText,
									responseText:this.recordedEvents[i].responseText,
									ajaxRequestId:this.recordedEvents[i].ajaxRequestId
								})+');');
							}
						break;
					case 'loadUrl':
							++expectCount;
							/**
							 *  TO-DO: remove the "origin" part like "http://site.com:80" 
							 */
							code.push('testUtils.setPath(frameEl, \''+this.recordedEvents[i].href+'\', ok);');
						break;
				}
			}
			code.push('');
			code.push('p.execCb(function (){');
//			if(this.recordingOptions.recordAjaxData){
//				code.push('driver.storage.ReplayPageEvents.ajax.detachDocumentListeners();');
//				code.push('driver.targetSiteFrame.unbind("load", driver.storage.ReplayPageEvents.ajax.attachDocumentListeners);');
////				code.push('driver.unbind("beforePageInit", driver.storage.ReplayPageEvents.ajax.attachDocumentListeners);');
//				code.push('');
//			}
			++expectCount;
			code.push('ok(true, "complete");');
			code.push('start();');
			code.push('});');
			code.push('});');

			code.splice(4, 0, 'expect('+expectCount+');', '');
			code.push('');
			
			/**
			 * TO-DO: pass this through a beautifier like https://github.com/einars/js-beautify
			 */

			return code.join('\n');
		},
		destroy:function (){
			if(this.recording)
				this.stopRecording();
			this.el.remove();
			this.emit('destroy');
		}
	});

	$.extend(exports, {
		createControlPanel:function (frameMngr, cb){
			var obj;
			if(EventEmitter){
				obj=new ControlPanel({frameMngr:frameMngr});
				cb&&setTimeout(function (){
					cb(obj);
				}, 15);
				return obj;
			}else if(cb)
				cbs.push(function (){
					cb(new ControlPanel({frameMngr:frameMngr}));
				});
		}
	});

});
