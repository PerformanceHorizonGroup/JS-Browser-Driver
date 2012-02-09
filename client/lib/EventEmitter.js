
/**
 * Helps a common JS object (not jQuery one) to register event listeners and fire events to those. Although it works in a very similar way 
 * it does not provide the full functionality of the jQuery event handling system.
 * Code is mostly copied over from the jQuery core source.
 * 
 * @version	1.0.3
 */
(function ($){
	
	/**
	 * TO-DO: refactor to use a simpler (and better) way to add events to a plain JS object using $({})
	 */
	
	/**
	 * @class EventEmitter
	 * @constructor
	 */
	EventEmitter=function (cfg){
		$.extend(this, cfg);
		this.initialConfig=cfg;
		EventEmitter.applyTo(this, this.listeners);
		return this;
	};

	/**
	 * @method bind
	 * 
	 */
	function bind(types, handler){
		// Handle object literals
		if ( typeof types === "object" ) {
			for ( var key in types ) 
				this.bind(key, types[key]);
		} else {
	
			// Handle multiple events separated by a space
			types = types.split(" ");
			
			for(var i=0; i<types.length; i++) {
				var type=types[i];
		
				if ( !handler.guid ) {
					handler.guid = jQuery.guid++;
				}
				// Get the current list of functions bound to this event
				var handlers = this.events[ type ];
		
				// Init the event handler queue
				if ( !handlers ) 
					handlers = this.events[ type ] = [];
		
				// Add the function to the element's handler list
				handlers.push( handler );
			}
		}

		return this;
	}
	
	/**
	 * @method one
	 * 
	 */
	function one(types, handler){
		var proxy=handler.createCallInterceptor(function (fn, args, scope){
			this.unbind(types, fn);
			return fn.apply(scope||this, args);
		}, this);
		if(handler.guid)
			proxy.guid=handler.guid;
		
		this.bind(types, proxy);
		if(!handler.guid)
			handler.guid=proxy.guid;
		
		return this;
	}
	
	/**
	 * @method unbind
	 * 
	 */
	function unbind(types, handler){
		if(types){
			// Handle multiple events separated by a space
			types = types.split(" ");
			
			for(var i=0; i<types.length; i++) {
				var type=types[i], eventType = this.events[ type ];
				if ( !eventType )
					continue;
		
				for ( var j = 0; j < eventType.length; j++ ) {
	
					if ( !handler || handler.guid === eventType[ j ].guid )
						// remove the given handler for the given type
						eventType.splice( j--, 1 );
				}
			
			}
		}else
			this.events={};

		return this;
	}
	
	/**
	 * @method trigger
	 * Notifies all bound listeners. It always sends this as the first parameter.
	 * If a handler returns false the triggered cycle will be interrupted.
	 */
	function trigger(type, args){
		if(!this.eventsSuspended){
			type = this.events[ type ];
			if(type){
				args=(typeof args!='undefined')?[this].concat(args):[this];
				for ( var i = 0; i < type.length; i++ )
					if(type[i].apply(this, args)===false)
						return false;
			}
		}

		return this;
	}
	
	/**
	 * @method suspendEvents
	 * Stops firing event untill resumeEvents() is called. Multiple calls to suspendEvents() are "accumulated" which means
	 * it takes the same number of calls to resumeEvents() to start firing events again.
	 */
	function suspendEvents(){
		++this.eventsSuspended;
	}
	
	/**
	 * @method resumeEvents
	 * Resumes firing event as usual. (Check suspendEvents() for details)
	 */
	function resumeEvents(){
		if(this.eventsSuspended)
			--this.eventsSuspended;
	}
	
	function r(){
		var args=[].slice.call(arguments, 0);
		args[0]=args.splice(args.length-1, 1)[0]; // the first argument was the original firing object. replace it with the last argument which is the type 
		this.trigger.apply(this, args);
	}
	/**
	 * @method relayEvents
	 * 
	 */
	function relayEvents(type, obj){
		obj.bind(type, r.createCallback(this, [type], true));
	}
	
    /**
	 * @method applyTo
     * Adds EventEmitter functionality to the given object effectively making it behave as an instance of EventEmitter.
     * @param {Object} obj The object to which functionality must be added
     * @static
     */
	EventEmitter.applyTo=function (obj, listeners){
		obj.events={};
		obj.eventsSuspended=0;
		obj.bind=bind;
		obj.one=one;
		obj.unbind=unbind;
		obj.trigger=trigger;
		obj.suspendEvents=suspendEvents;
		obj.resumeEvents=resumeEvents;
		obj.relayEvents=relayEvents;
		if(listeners)
			obj.bind(listeners);
	};
}(jQuery));
