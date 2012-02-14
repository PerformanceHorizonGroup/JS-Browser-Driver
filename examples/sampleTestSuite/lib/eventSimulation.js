(function (){
	driver.storage.fireEvent=function (eventType, target, eventInfo){
	    /**
	     * TO-DO: createEvent may need to have priority before createEventObject because it is the DOM standard
	     */
		if (document.createEventObject){
		    // dispatch for IE
		    if(eventType=='click' && target.tagName=='A'){
		    	target.click();
		    }else{
			    switch(eventType){
			    	case 'click':
			    	case 'dblclick':
			    	case 'mousedown':
			    	case 'mouseup':
					case 'mouseover':
					case 'mouseout':
						    var evt = target.ownerDocument.createEventObject();
						    return target.fireEvent('on'+eventType, evt);
			    		break;
	//		    	case 'change':
			    	case 'keydown':
			    	case 'keyup':
			    	case 'keypress':
						    var evt = target.ownerDocument.createEventObject(); //target, eventInfo.ctrlKey, eventInfo.altKey,  eventInfo.shiftKey,  eventInfo.metaKey);
						    $.extend(evt, eventInfo);
						    return target.fireEvent('on'+eventType, evt);
			    		break;
			    }
		    }
	    }else{
		    // dispatch for firefox + others
		    switch(eventType){
		    	case 'click':
		    	case 'dblclick':
		    	case 'mousedown':
		    	case 'mouseup':
				case 'mouseover':
				case 'mouseout':
					    var evt = document.createEvent("MouseEvent");
					    evt.initMouseEvent(eventType, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, /*eventInfo.ctrlKey, eventInfo.altKey,  eventInfo.shiftKey,  eventInfo.metaKey,*/ 0, null ); // type, bubbles, cancelable, windowObject, detail, screenX, screenY, clientX, clientY, ctrlKey, altKey, shiftKey, metaKey, button, relatedTarget
					    return !target.dispatchEvent(evt);
		    		break;
//		    	case 'change':
		    	case 'keydown':
		    	case 'keyup':
		    	case 'keypress':
					    var evt = document.createEvent("KeyboardEvent");
					    /**
					     * TO-DO: initKeyboardEvent may need to have priority before initKeyEvent because it is the DOM3 standard
					     */
					    if(evt.initKeyEvent)
					    	evt.initKeyEvent(eventType, true, true, window, eventInfo.ctrlKey, eventInfo.altKey, eventInfo.shiftKey, eventInfo.metaKey, eventInfo.keyCode, eventInfo.charCode ); // type, bubbles, cancelable, viewArg, ctrlKeyArg, altKeyArg, shiftKeyArg, metaKeyArg, keyCodeArg, charCodeArg
					    else
					    	evt.initKeyboardEvent(eventType, true, true, window, eventInfo.ctrlKey, eventInfo.altKey, eventInfo.shiftKey, eventInfo.metaKey, eventInfo.keyCode, eventInfo.charCode ); // type, bubbles, cancelable, viewArg, ctrlKeyArg, altKeyArg, shiftKeyArg, metaKeyArg, keyCodeArg, charCodeArg
					    return !target.dispatchEvent(evt);
		    		break;
		    }
	    }
	};
}());
