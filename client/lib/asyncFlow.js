// if registerModule is defined then we must be in the browser so call that. if not then this has
// been loaded as a node.js module and the code can execute right away.
(typeof registerModule=='function' ? registerModule : function (fn){fn(module);}).call(this, function (module){
	var exports=module.exports,
		require=module.require;
		
	/**
	 * Provides helper objects to assit with hanling asynchronous operations.
	 */
	
	var extend = typeof jQuery=='function' ? jQuery.extend : require('jquery.extend'),
		isArray =  typeof jQuery=='function' ? jQuery.isArray : require('util').isArray;
	
	exports.serial=function (cfg){
		/**
		 * TO-DO: add the option to either send a specific set of parameters to the functions or the result of the previous call (the default) 
		 */
		extend(true, this, {
			fns:[],
			data:{}
		}, cfg);
	};
	extend(true, exports.serial.prototype, {
		/**
		 * @param	{Function/Array}	(optional)	fn	A function or array of functions to add and start executing the queue
		 * @param	{Function/Array}	(optional)	etc...	More functions or arrays of functions to add
		 */
		run:function (){
			this.add.apply(this, arguments);
			this.runNextFn();
			return this;
		},
		/**
		 * @param	{Function/Array}	(optional)	fn	A function or array of functions to add and start executing the queue
		 * @param	{Function/Array}	(optional)	etc...	More functions or arrays of functions to add
		 */
		add:function (){
			for(var i=0; i<arguments.length; i++)
				if(isArray(arguments[i]))
					this.add.apply(this, arguments[i]);
				else if(typeof arguments[i]=='function')
					this.fns.push(arguments[i]);
			return this;
		},
		/**
		 * 
		 */
		runNextFn:function (){
			if(this.fns.length){
				/**
				 * TO-DO: capture exceptions
				 */
				var mngr=this,
					fn=this.fns.shift();
				this.currentFn=fn;
				var res=fn.apply(this, [].slice.call(arguments, 0).concat(function (){
						mngr.runNextFn.apply(mngr, arguments);
					}));
				if(typeof res!='undefined') // if the function returned something assume the callback will not get called and we shall use the returned value
					this.runNextFn(null, res);
				/**
				 * TO-DO: fire complete event if there are no more functions to call
				 */
			}
		},
		/**
		 * Re-insert the current function and run
		 */
		repeatCurrentFn:function (){
			this.fns.unshift(this.currentFn);
			this.runNextFn.apply(this, arguments);
		}
	});
});

