0.2.? / 2012-??-??
==================
	* various bug fixes
	* test execution is managed by a Test object which handles module lifecycle calls and provides methods to include required resources
	* added test module lifecycle handling - setup/teardown
	* testing instances in the browser create their own IFRAME elements as needed
	* running tests do not use or expect a global driver object 
	* the module loader is now compatible with node's require()
	* slaves can also be node.js instances and will run the tests in the exact same way as browsers
	* the config file can now specify variables to be expanded
	* tests details from source files are extracted by the server and sent to clients
	* the driver was broken down into more specialized modules so some can be used by both the server and the client
	* using module loading system instead of adding adaptors and other needed libraries in HTML (the configuration file specifies which modules shall be loaded by the slaves)
	* changed the configuration file format
	* updated the QUnit library to v1.11.0pre
	* the test manager part was separated from the slave manager to make each piece more general 
	* added the "fork" option as an alternative to "app"
	* moved the web server configuration options out of the Socket.IO config object

0.1.3 / 2012-02-15
==================
	* First release


