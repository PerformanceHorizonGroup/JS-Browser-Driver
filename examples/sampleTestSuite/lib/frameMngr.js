/**
 * Manages an IFRAME instance and provides helper functions for it.
 * (it is supposed to run only in a browser)
 */
/**
 * TO-DO: add the option to overlay the IFRAME so the user will not be able to click and interfere
 */
registerModule(function (module, require){
	var exports=module.exports;
	
	var cbs=[],
		EventEmitter;
	__adaptor__.requireLib('events', function (exports){
		EventEmitter=exports.EventEmitter;
		while(cbs.length)
			cbs.shift()();
		cbs=null;
	});

	var Frame=function (cfg){
		$.extend(true, this, cfg); //		EventEmitter.call(this, arguments);
		this.initialize();
	};
	$.extend(Frame.prototype, {
		initialize:function (){
			this.el=$(document.createElement('iframe')).appendTo(document.body);
		},
		load:function (url){
			$(this.el).attr('src', url);
		}
	});
	
	exports.createFrame=function (cb){
		var obj;
		if(EventEmitter){
			obj=new Frame();
			cb&&setTimeout(function (){
				cb(obj);
			}, 15);
			return obj;
		}else if(cb)
			cbs.push(function (){
				cb(new Frame());
			});
	}

});
