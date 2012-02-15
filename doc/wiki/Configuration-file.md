It needs to be in JSON format and can be named anything though ending the name with .conf.json is usually most informative. Every option has a default value that the server can use and can be omitted so the file needs to only specify those which need to be customized.

## Accepted configuration options (in version 0.1.3)

* server
    * SocketIO
        * <a name="server.SocketIO.protocol">protocol</a> _String_ (default: 'http') - if set to "https" the server will run using TLS/SSL _[not inplemented yet]_
        * <a name="server.SocketIO.host">host</a> _String_ / _null_ (default: 'localhost') - the host to bind the server to. If set to **null** the server will listen on all available adapters.
        * <a name="server.SocketIO.port">port</a> _Number_ (default: 80) - the port to bind to.
        * <a name="server.SocketIO.logLevel">logLevel</a> _Number_ (default: 0) - the logging level that Socket.IO will use.
    * <a name="server.browserDriverUrl">browserDriverUrl</a> _String_ (default:'localhost/BrowserDriver.html') - the location of the BrowserDriver.html file ( for where to put the file check the [slaves](Slaves) page )
    * <a name="server.testsUrl">testsUrl</a> _String_ (default:'/manager/tests/sources') - where to map [testsPath](#testsPath). _[this value is currently hard-coded in BrowserDriver.Driver]_
    * <a name="server.userLibsUrl">userLibsUrl</a> _String_ (default:'/manager/tests/lib') - where to map [userLibsPath](#userLibsPath). _[this value is currently hard-coded in BrowserDriver.Driver]_
    * <a name="server.otherUrlMappings">otherUrlMappings</a> _Object_ (default:{}) - mappings for other paths on the server in the form "relative_fs_path_to_the_config_file":"url_on_the_server". For example:
```js
{
    "html":"/manager/tests/html", // maps the "html" folder in the same folder as the configuration file to the "/manager/tests/html" url
    "html/img":"/manager/tests/images" // and the "img" folder inside "html" to "/manager/tests/images"
}
```
* <a name="browsers">browsers</a> _Array_ (default:[]) - a list of browsers which the server will manage. Each item in the array is an object like:
```js
{
    "name":"Chrome.16", // the name to identify the browser. can be any string
    "app":"chromium-browser", // the shell command which starts the browser
    "args":[], // additional arguments to send to the application. the browserDriverUrl with additional url parameters will be appended to this list
}
```
* <a name="interactiveMode">interactiveMode</a> _Boolean_ (default:false) - when **false** the server will load tests from [autoRunTests](#autoRunTests) and run them in all browsers launching those specified in [autoRunBrowsers](#autoRunBrowsers).
* <a name="autoRunTests">autoRunTests</a> _Array_ (default:[]) - a list of tests to be run automatically if [interactiveMode](#interactiveMode) is **false**. Each item in the array is a string in the form `'filename.js'.'moduleName'.'testName'`
* <a name="autoRunBrowsers">autoRunBrowsers</a> _Array_ (default:[]) - a list of browser names (as configured in [browsers](#browsers) to launch automatically if [interactiveMode](#interactiveMode) is **false**.
* <a name="testsPath">testsPath</a> _String_ (default:'tests') - path to be searched for *.js files which should have the tests. must be relative to the config file path.
* <a name="userLibsPath">userLibsPath</a> _String_ (default:'lib') - path to be mapped to [userLibsUrl](#server.userLibsUrl). must be relative to the config file path.
* <a name="timeout">timeout</a> _Number_ (default:0) - timeout in seconds to wait before shutting down the server. This may be useful when running tests automatically to terminate the server if some tests may take too long to complete or just hang.

## Example configuration <a name="example-configuration" />

The package includes an example in the "examples/sampleTestSuite" folder. This is a test suite which contains all needed resources. The configuration file is named _testing.conf.json_ and here are the options that it sets:
```js
{
	"server":{
		"SocketIO":{
			"port":8090
		},
```
The above option directs the server to bind to port 8090. Since the "host" option is not specified the server will default to "localhost" so the _BrowserDriver.html_ that can be used will be available at
```js
 		"browserDriverUrl":"http://localhost:8090/BrowserDriver.html",
```
The tests need some HTML pages to be loaded and those are located in "public_html" so the folder is mapped as
```js
 		"otherUrlMappings":{
 			"public_html":"/public_html"
 		}
```
and it will be accessible as http://localhost:8090/public_html . Tests need to be executed in two browsers which will be named "Firefox" and "Chrome" so two entries are added to the "browsers" list:
```js
 	},
 	"browsers":[{
 		"name":"Firefox",
 		"app":"firefox", // in Ubuntu Firefox is started with this command
 		"args":[]  // no other options are needed
 	},{
 		"name":"Chrome",
 		"app":"chromium-browser", // in Ubuntu Chrome is started with this command
 		"args":[]  // no other options are needed
 	}],
```
And finally the server is told to start in interactive mode which means it will not do anything on start up and will just wait for commands from the manager application:
```js
	"interactiveMode":true
}
```
