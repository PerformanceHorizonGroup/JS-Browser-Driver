(function (){
	driver.loadLib('jquery-ui-1.8.16.custom.min.js');
	driver.loadLib('jquery.getPath.js');
	driver.loadStylesheet('bootstrap/css/bootstrap.min.css');
	
	var panel=null,
		recording=false,
		recordingOptions={},
		recordedEvents=[],
		eventsList=null;

	function appendRecordedEvent(evt){
		var e={
			evt:evt,
			time:new Date()
		};
		eventsList.append('<div>'+evt.type+' '+$(evt.target).getPath(true)+'</div>');
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
		recordedEvents.push(e);
	}
	driver.bind('beforePageInit', function (){
		if(recording)
			attachDocumentListeners();
	});
	function attachDocumentListeners(){
		var win=driver.targetSiteFrame.get(0).contentWindow;
		if(!win.documentListenersAttached && win.$){
			var doc=win.document;
			$(doc).click(appendRecordedEvent);
			$(doc).dblclick(appendRecordedEvent);
			$(doc).mousedown(appendRecordedEvent);
			if(recordingOptions.recordHoverEvents){
				$(doc).mouseover(appendRecordedEvent);
				$(doc).mouseout(appendRecordedEvent);
			}
			$(doc).keydown(appendRecordedEvent);
			$(doc).keyup(appendRecordedEvent);
			$(doc).keypress(appendRecordedEvent);
			if(recordingOptions.recordAjaxData){
				win.$.ajaxPrefilter(ajaxPrefilter);
				win.$(doc).ajaxSend(onAjaxSend); 
//				win.$(doc).ajaxComplete(onAjaxComplete); 
				win.$(doc).ajaxSuccess(onAjaxSuccess); 
				win.$(doc).ajaxError(onAjaxError); 
			}
			if(recordingOptions.mockServerSide){
	
			}
			win.documentListenersAttached=true;
		}
	}
	function detachDocumentListeners(){
		var win=driver.targetSiteFrame.get(0).contentWindow,
			doc=win.document;
		$(doc).unbind('click', appendRecordedEvent);
		$(doc).unbind('dblclick', appendRecordedEvent);
		$(doc).unbind('mousedown', appendRecordedEvent);
		$(doc).unbind('mouseup', appendRecordedEvent);
		if(recordingOptions.recordHoverEvents){
			$(doc).unbind('mouseover', appendRecordedEvent);
			$(doc).unbind('mouseout', appendRecordedEvent);
		}
		$(doc).unbind('keydown', appendRecordedEvent);
		$(doc).unbind('keyup', appendRecordedEvent);
		$(doc).unbind('keypress', appendRecordedEvent);
		if(recordingOptions.recordAjaxData){
			win.$(doc).unbind('ajaxSend', onAjaxSend);
//			win.$(doc).unbind('ajaxComplete', onAjaxComplete);
			win.$(doc).unbind('ajaxSuccess', onAjaxSuccess);
			win.$(doc).unbind('ajaxError', onAjaxError);
		}
		if(recordingOptions.mockServerSide){
		}
		win.documentListenersAttached=false;
	}
	// event listeners
	function onPageLoad(evt){
		if(recording){ // if we are already recording then document listeners have not been attached as the page just loaded
			attachDocumentListeners();
			eventsList.append('<div>pageLoad</div>');
			recordedEvents.push({
				evt:{
					type:'pageLoad'
				},
				time:new Date()
			});
		}
	}
	function ajaxPrefilter( options, originalOptions, jqXHR ){
		options.__originalOptions_cache__ = originalOptions; // cache this so we can access it later in $().ajaxSuccess/Error
		options.__ajax_request_id__ = driver.targetSiteFrame.get(0).contentWindow.$.guid++; // tag it so we can later match responses with requests
	}
	function onAjaxSend(event, jqXHR, ajaxOptions){
		eventsList.append('<div>ajaxSend</div>');
		var d={
			evt:{
				type:'ajaxSend'
			},
			originalOptions:ajaxOptions.__originalOptions_cache__,
			ajaxRequestId:ajaxOptions.__ajax_request_id__,
			time:new Date()
		};
		recordedEvents.push(d);
	}
	function onAjaxSuccess(event, XMLHttpRequest, ajaxOptions/*obj, dlr, cbArgs*/){
		eventsList.append('<div>ajaxSuccess</div>');
		var d={
			evt:{
				type:'ajaxSuccess'
			},
			originalOptions:ajaxOptions.__originalOptions_cache__,
			ajaxRequestId:ajaxOptions.__ajax_request_id__,
			time:new Date()
		};
		if(recordingOptions.mockServerSide){
			d.status=XMLHttpRequest.status;
			d.statusText=XMLHttpRequest.statusText;
			d.responseText=XMLHttpRequest.responseText;
		}
		recordedEvents.push(d);
	}
	function onAjaxError(event, XMLHttpRequest, ajaxOptions, thrownError /*obj, dlr, cbArgs*/){
		eventsList.append('<div>ajaxError</div>');
		var d={
			evt:{
				type:'ajaxError'
			},
			originalOptions:ajaxOptions.__originalOptions_cache__,
			ajaxRequestId:ajaxOptions.__ajax_request_id__,
			time:new Date()
		};
		if(recordingOptions.mockServerSide){
			d.status=XMLHttpRequest.status;
			d.statusText=XMLHttpRequest.statusText;
			d.responseText=XMLHttpRequest.responseText;
		}
		recordedEvents.push(d);
	}

	driver.storage.RecordPageEvents=new EventEmitter({
		getControlPanel:function (){
			if(!panel){
				panel=$('<div class="record-page-event-controls">' +
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
						.draggable({cancel:'.record-page-event-controls>*'})
						.css('position', 'absolute');
				if(!Number(panel.css('borderTopWidth')))
					driver.loadStylesheet('recordPageEvents/recordPageEvents.css');
				$('.close-bar', panel).click(function (){
					if(driver.storage.RecordPageEvents.trigger('beforeClose')!==false)
						driver.storage.RecordPageEvents.destroy();
				});
				driver.targetSiteFrame.load(function (){
					$('.page-url').val(driver.targetSiteFrame.get(0).contentWindow.location.href);
				});
				$('.page-url').change(function (){
					if(recording){
						eventsList.append('<div>loadUrl '+this.value+'</div>');
						recordedEvents.push({
							evt:{
								type:'loadUrl'
							},
							href:this.value,
							time:new Date()
						});
					}
					driver.targetSiteFrame.get(0).contentWindow.location.href=this.value;
				});
				$('.record').click(function (){
					driver.storage.RecordPageEvents[recording?'stopRecording':'startRecording']();
				});
				$('.generate-test-code').click(function (){
					$('.recorded-events-list .title', panel).html('Generated test code');
					$('.recorded-events-list', panel).show();
					eventsList.empty().append($('<pre></pre>').text(driver.storage.RecordPageEvents.generateTestCode()));
				});
				eventsList=$('.recorded-events-list .items', panel);
			}
			return panel;
		},
		startRecording:function (){
			recordedEvents=[];
			recordingOptions={
				recordHoverEvents:$('.record-hover-events').is(':checked'),
				recordAjaxData:$('.record-ajax-data').is(':checked'),
				mockServerSide:$('.mock-server-side').is(':checked')
			};
			$('.generate-test-code').attr('disabled', 'true');
			$('.recorded-events-list .title', panel).html('Recorded events');
			eventsList.empty();
			$('.recording-options :input').attr('disabled', true);
			$('.record', panel).html('Stop');
			recording=true;
			$('.recorded-events-list', panel).show();
			// attach event listeners
			driver.targetSiteFrame.load(onPageLoad);
			if(driver.targetSiteFrame.get(0).contentWindow)				
				attachDocumentListeners();
		},
		stopRecording:function (){
			$('.generate-test-code').removeAttr('disabled');
			$('.recording-options :input').removeAttr('disabled');
			$('.record', panel).html('Record');
			recording=false;
			$('.recorded-events-list', panel).hide();
			// detach event listeners
			driver.targetSiteFrame.unbind('load', onPageLoad);					
			if(driver.targetSiteFrame.get(0).contentWindow)
				detachDocumentListeners();				
		},
		generateTestCode:function (){
			var expectCount=0,
				code=['driver.loadLib("recordPageEvents/replayPageEvents");'];
			code.push('driver.loadLib("util");');
			code.push('asyncTest("auto-generated-test", function (){');
			code.push('\tvar test=this;');
			code.push('');
			code.push('\tdriver.storage.ReplayPageEvents.initialize();');
			
			var setAjaxRequestIdCallInd;
			if(recordingOptions.mockServerSide){
				code.push('\tmockAjaxResponses();');
				setAjaxRequestIdCallInd=code.length;
			}
			code.push('');
			if(recordingOptions.recordAjaxData){
//				code.push('\tdriver.bind("beforePageInit", driver.storage.ReplayPageEvents.ajax.attachDocumentListeners);');
				/**
				 * TO-DO: add this line only of there was a "load" event recorded 
				 */
				code.push('\tdriver.targetSiteFrame.load(driver.storage.ReplayPageEvents.ajax.attachDocumentListeners);');
				code.push('');
			}
			for(var i=0; i<recordedEvents.length; i++){
				if(i>0 && recordedEvents[i].evt.type!='pageLoad' && recordedEvents[i].evt.type!='ajaxSend')
					code.push('\twait('+(recordedEvents[i].time.getTime()-recordedEvents[i-1].time.getTime())+');');
				switch(recordedEvents[i].evt.type){
					case 'pageLoad':
							++expectCount;
							code.push('\ttestWaitForEvent("load", driver.targetSiteFrame);');
						break;
					case 'keydown':
					case 'keyup':
					case 'keypress':
							++expectCount;
							code.push('\ttestFireEvent("'+recordedEvents[i].evt.type+'", "'+recordedEvents[i].elementPath+'", '+JSON.stringify(recordedEvents[i].keyInfo)+');');
						break;
//					case 'change':
					case 'click':
					case 'dblclick':
					case 'mousedown':
					case 'mouseup':
					case 'mouseover':
					case 'mouseout':
							++expectCount;
							code.push('\ttestFireEvent("'+recordedEvents[i].evt.type+'", "'+recordedEvents[i].elementPath+'");');
						break;
					case 'ajaxSend':
							if(recordingOptions.mockServerSide){
								code.splice(setAjaxRequestIdCallInd++, 0, '\tsetAjaxRequestId('+recordedEvents[i].ajaxRequestId+');');
							}else
								// find the response that the server returned in the events following
								for(var e=i+1; e<recordedEvents.length; e++)
									if(recordedEvents[e].ajaxRequestId==recordedEvents[i].ajaxRequestId){
										++expectCount;
										code.push('\ttestWaitForEvent("'+recordedEvents[e].evt.type+'", ajaxEventEmitter);');
										recordedEvents.splice(e, 1);
										break;
									}
						break;
					case 'ajaxSuccess':
					case 'ajaxError':
							if(recordingOptions.mockServerSide){
								code.push('\tcompleteAjaxRequest('+JSON.stringify({
									responseType:recordedEvents[i].evt.type,
									status:recordedEvents[i].status,
									statusText:recordedEvents[i].statusText,
									responseText:recordedEvents[i].responseText,
									ajaxRequestId:recordedEvents[i].ajaxRequestId
								})+');');
							}
						break;
					case 'loadUrl':
							++expectCount;
							/**
							 *  TO-DO: remove the "origin" part like "http://site.com:80" 
							 */
							code.push('\ttestUtils.setPath("'+recordedEvents[i].href+'", ok);');
						break;
				}
			}
			code.push('');
			code.push('\texecCb(function (){');
			if(recordingOptions.recordAjaxData){
				code.push('\t\tdriver.storage.ReplayPageEvents.ajax.detachDocumentListeners();');
				code.push('\t\tdriver.targetSiteFrame.unbind("load", driver.storage.ReplayPageEvents.ajax.attachDocumentListeners);');
//				code.push('\t\tdriver.unbind("beforePageInit", driver.storage.ReplayPageEvents.ajax.attachDocumentListeners);');
				code.push('');
			}
			++expectCount;
			code.push('\t\tok(true, "complete");');
			code.push('\t\tstart();');
			code.push('\t});');
			code.push('});');

			code.splice(4, 0, '\texpect('+expectCount+');', '');
			code.push('');

			return code.join('\n');
		},
		destroy:function (){
			if(recording)
				this.stopRecording();
			panel.remove();
			panel=null;
			this.trigger('destroy');
		}
	});
	
}());
