
/**
 * copy all properties from passed source(s) to the target. If the target is a Function then
 * copy to it's prototype. If a source object is a Function then copy from it's prototype.
 */
exports.extend=function (){
	var target = typeof arguments[0] == 'function' ? arguments[0].prototype : arguments[0]; 
	if(arguments.length>1){
		for(var i=1; i<arguments.length; ++i){
			var source =  typeof arguments[i] == 'function' ? arguments[i].prototype : arguments[i]; 
			for(var n in source)
				target[n]=source[n];
		}
	}
	return target;
};

exports.extend(Function, {
	scope:function (scopeObj){
		var f=this;	
		return function (){
			return f.apply(scopeObj, arguments);
		};
	},
	chain:function (func, scopeObj){
		var f=this;
		return function (){
			var r=f.apply(this, arguments);
			func.call(scopeObj||this);
			return r;
		};
	},	
	createCallback:function (scopeObj, params, appendArgs){
		var f=this;	
		return function (){
			var args=params||arguments;
			if(appendArgs === true)
				args=Array.prototype.slice.call(arguments, 0).concat(args);
			return f.apply(scopeObj||this, args);
		};
	}
});

exports.extend(Date, {
	format:function (fmt){
		if(fmt=='hh:mm'){
			var ts='';
			var t=this.getHours();
			ts=(t<10)?'0'+t:t;
			t=this.getMinutes();
			ts+=':'+((t<10)?'0'+t:t);
			return ts;
		}else if(fmt=='hh:mm:ss'){
			var ts=this.format('hh:mm');
			var t=this.getSeconds();
			ts+=':'+((t<10)?'0'+t:t);
			return ts;
		}else if(fmt=='MM/dd hh:mm:ss'){
			var ts=this.format('hh:mm:ss');
			var t=this.getDate();
			ts=((t<10)?'0'+t:t)+' '+ts;
			t=this.getMonth()+1;
			ts=((t<10)?'0'+t:t)+'/'+ts;
			return ts;
		}else
			return this.toString();
	},
	clearTime:function (){
		this.setHours(0, 0, 0, 0);
		return this;
	}
});

exports.extend(exports, {
	/**
	 * @return	{Boolean}	isEmpty	If there are any enumerable properties the return falue is true, otherwise false.
	 */
	isEmptyObject:function (obj){
		for(var prop in obj)
			return true;
		return false;
	},
	/**
	 * Returns the property value and deletes the property from the object. (Similar to the Array.splice() method)
	 * @param	(String)	prop	property name to find in the object
	 * @param	(Object)	obj	the object to check
	 * @param	(Mixed)	prop	(optional)	the value to return if the property was not found (defaults to undefined)
	 * @return	{Mixed}	val
	 */
	spliceProp:function (prop, obj, nfVal){
		var val=nfVal;
		if(prop in obj){
			val=obj[prop];
			delete obj[prop];
		}
		return val;
	},	
	/**
	 * @return	val	(Mixed)	The value of the first enumerated property of the object
	 */
	getOnePropValue:function (obj){
		for(var prop in obj)
			return obj[prop];
	},
	getPropValue:function (obj){
		var res=obj, args=arguments;
		if(arguments[1] instanceof Array)
			args=[arguments[0]].concat(arguments[1]);
		for(var i=1; i<args.length; ++i){
			if(args[i] in res)
				res=res[args[i]];
			else{
				res[args[i]]={};
				res=res[args[i]];
			}
		}
		return res;
	},
	/**
	 * @return	count	(Integer)	The number of enumerable properties in this object
	 */
	getPropCount:function (obj){
		var count=0;
		for(var prop in obj)
			++count;
		return count;
	},
	safeStringify:function (obj, levels, cb){
		--levels;
		var str='';
		switch(typeof obj){
			case 'function':
					str='"[object Function]"';
				break;
			case 'boolean':
					str=obj?'true':'false';
				break;
			case 'string':
					str='"'+obj.replace(/"/g, '\\"')+'"';
				break;
			case 'number':
					str= isFinite(obj) ? String(obj) : 'null';
				break;
			case 'object':
					if(obj===null)
						str='null';
					else if(levels>0){
						if(Object.prototype.toString.apply(obj) === '[object Array]'){
							str='[';
							var arrValues=[];
							for(var i=0; i<obj.length; ++i){
								arrValues.push(exports.safeStringify(obj[i], levels, cb));
							}
							str+=arrValues.join()+']';
						}else{
							str='{';
							var props=[];
							for(var p in obj){
								if(cb)
									props.push('"'+p+'":'+cb(p, obj[p], levels));
								else
									props.push('"'+p+'":'+exports.safeStringify(obj[p], levels, cb));
							}
							str+=props.join()+'}';
						}
					}else
						str='"'+obj.toString()+'"';
				break;
			default:
					str='"'+obj.toString()+'"';
				break;
		}
		return str;
	},
	emptyFn:function (){}
});
