module('test tests', {
	setup:function (){
		console.log('module setup for '+this.__testInst.name);
		var env=this;
		this.__testInst.requireCustomLib('util', function (exports){
			env.testUtils=exports;
		});
	},
	teardown:function (){
		console.log('module teardown for '+this.__testInst.name);
	}
});
test('test ...', 1, function (){
	ok(true, 'test has testUtils');
	if(this.testUtils){
		expect(3);
		ok(this.testUtils.setPath, 'testUtils has setPath');
		ok(this.testUtils.ensurePath, 'test has ensurePath');
		console.dir(this.testUtils)
	}else
		ok(false, 'test has testUtils');
});
asyncTest('async test ...', 1, function (){
	setTimeout(function(){
		ok(true, 'successfull asyncTest');
		start();
	}, 15);
});
