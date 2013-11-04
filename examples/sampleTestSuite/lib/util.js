(typeof registerModule=='function' ? registerModule : function (fn){fn(module, require);}).call(this, function (module, require){
//	var exports=module.exports;

module.exports={
	/**
	 * Sets the url of the frame and calls the callback when the url loads or fails
	 * @method setPath
	 * @param {jQuery} frame The IFRAME to set the url on.
	 * @param {String/Object} url The url to set or an object with more details.
	 * @param {Function} (optional)	cb The function to call when loaded or failed.
	 */
	setPath:function (frame, url, cb){
		var options=null;
		if(typeof url=='object'){
			options=url;
			url=options.url;
		}
		frame.attr('src', url);
		frame.one('load', function (){
			if(this.contentWindow.location.pathname==url){
				if(options && options.html)
					module.exports.setDocumentHTML(this.contentWindow.document, options.html);
				cb && cb(true, 'load '+url);
			}else
				cb && cb(false, 'expected '+url+' but '+this.contentWindow.location.pathname+' was loaded');
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
	},
	setDocumentHTML:function (doc, html){
		doc.open();
		doc.write(html);
		doc.close();
	}
};


}, typeof module=='object'?module:null);
