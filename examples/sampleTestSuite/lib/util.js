(typeof registerModule=='function' ? registerModule : function (fn){fn(module, require);}).call(this, function (module, require){
//	var exports=module.exports;

module.exports={
	setPath:function (frame, pathName, cb){
		frame.attr('src', pathName);
		frame.one('load', function (){
			if(this.contentWindow.location.pathname==pathName){
				cb && cb(true);
			}else
				cb && cb(false, 'expected '+pathName+' but '+this.contentWindow.location.pathname+' was loaded');
		});
	},
	ensurePath:function (frame, pathName, cb){
		if(frame.get(0).contentWindow && frame.get(0).contentWindow.location.pathname==pathName){
			cb && cb(true);
		}else{
			testUtils.setPath(pathName, cb);
		}
	},
	$:function (frame, selector){
		return (frame.get(0).contentWindow.$ || $)(selector, frame.get(0).contentWindow.document);
	}
};


}, typeof module=='object'?module:null);
