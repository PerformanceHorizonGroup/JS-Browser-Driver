
/**
 * Helper prototype additions.
 * @version 0.1.0
 */

Function.prototype.scope=function (scopeObj){
	var f=this;	
	return function (){
		return f.apply(scopeObj, arguments);
	};
};
Function.prototype.createCallback=function (scopeObj, params, appendArgs){
	var f=this;	
	return function (){
		var args=params||arguments;
		if(appendArgs === true)
			args=[].slice.call(arguments, 0).concat(args);
		return f.apply(scopeObj||this, args);
	};
};
/**
 * Creates a function which adds an intermediate function which is to receive the result returned by the original and the caller will
 * receive the result returned by the interceptor.
 */
Function.prototype.createResultInterceptor=function (interceptorFn, scopeObj){
	var f=this;	
	return function (){
		return interceptorFn.call(scopeObj||this, f.apply(this, arguments));
	};
};
/**
 * Creates a function which adds an intermediate function which will be called instead of the original. The interceptor will receive
 * the original function, the arguments sent by the caller and the scope object. The result returned by the interceptor will be sent back to the caller. This way
 * the interceptor function has full control over what arguments are passed to the original (or decide to not call it at all) and what gets sent back to the caller.
 */
Function.prototype.createCallInterceptor=function (interceptorFn, scopeObj){
	var f=this;	
	return function (){
		return interceptorFn.call(scopeObj||this, f, [].slice.call(arguments, 0), this);
	};
};
/**
 * This is much like createCallInterceptor but the interceptor is only given a chance to inspect and alter the arguments sent by the caller which are then passed on to the callee.
 */
Function.prototype.createArgumentsInterceptor=function (interceptorFn, scopeObj){
	var f=this;	
	return function (){
		var args=[].slice.call(arguments, 0);
		interceptorFn.call(scopeObj||this, args);
		return f.apply(this, args);
	};
};
/**
 * This is much like createArgumentsInterceptor but the interceptor is not given the chance to alter the arguments sent by the caller. It is simply called
 * after the original and before the result is returned to the caller.
 */
Function.prototype.chain=function (func, scopeObj){
	var f=this;
	return function (){
		var retval = f.apply(this, arguments);
		func.apply(scopeObj||this, arguments);
		return retval;
	};
};
Function.prototype.defer=function (millis, scopeObj, args){
	var f=this;	
	return setTimeout(function (){
		f.apply(scopeObj||window, args||[]);
	}, millis);
};

Date.prototype.clearTime=function (){
	this.setHours(0, 0, 0, 0);
	return this;
};

