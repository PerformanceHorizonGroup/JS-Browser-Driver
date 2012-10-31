(typeof registerModule=='function' ? registerModule : function (fn){fn(module, require);}).call(this, function (module, require){
//	var exports=module.exports;
		

module.exports={
	setPath:function (pathName, cb){
		driver.targetSiteFrame.attr('src', pathName);
		driver.targetSiteFrame.one('load', function (){
			if(this.contentWindow.location.pathname==pathName){
				cb && cb(true);
			}else
				cb && cb(false, 'expected '+pathName+' but '+this.contentWindow.location.pathname+' was loaded');
		});
	},
	ensurePath:function (pathName, cb){
		if(driver.targetSiteFrame.get(0).contentWindow && driver.targetSiteFrame.get(0).contentWindow.location.pathname==pathName){
			cb && cb(true);
		}else{
			testUtils.setPath(pathName, cb);
		}
	},
	$:function (selector){
		return (driver.targetSiteFrame.get(0).contentWindow.$ || $)(selector, driver.targetSiteFrame.get(0).contentWindow.document);
	}
};


}, typeof module=='object'?module:null);
