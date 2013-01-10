# JS Browser Driver
The JS Browser Driver is a Node.JS project originally aiming to simplify writing and running automated UI tests in JS but with the latest development it is now able do much more - it can also run tests inside node.js and in fact is able to manage the execution of code for arbitrary purposes.

_(more info can be found in the [Wiki](https://github.com/PerformanceHorizonGroup/JS-Browser-Driver/wiki) pages)_

## Installation

    npm install browser-driver
    
Note, if the above command growls at you, you probably don't have npm installed. Go grab that at http://npmjs.org/ or simply run:

    curl http://npmjs.org/install.sh | sh

## How to use
Test files are organized in suites and for each suite there needs to be a [configuration file](https://github.com/PerformanceHorizonGroup/JS-Browser-Driver/wiki/Configuration-file) written so the server will know how to prepare the resources that tests will need.

If you have installed the npm package globally (with `-g`) then you can do:

    browser-driver configFileName="path/to/xxx.conf.json"
    
or if not then go to the package directory and start it with node like:

    node server/server.js configFileName="path/to/xxx.conf.json"

### Setting up the slaves
Within the conf.json config file, you need to provide an absolute link to each browser. Predictably, this isn't particularly easy as there can be various conflicts with browser windows that are already open. We have gone through this pain many times, so here's a guide for the major browsers:

- **Chrome**

    Thankfully Chrome is relatively straightforward, you just need to direct the user data to temp. 
    
    - **OS X**, simply point the user data dir to /tmp
        
            {
                "name":"Chrome",
                "app":"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
                "args":["--user-data-dir=/tmp"]
            }
        
    - **Windows**
    
            {
                "name":"Chrome",
                "app":"C:\\Program Files (x86)\\GoogleChromePortable\\GoogleChromePortable.exe",
                "args":[]
            }


- **Firefox**

    
    - **OS X**
        
        With Firefox, you unfortunately need to create a new profile first, via their Profile Manager. You can do this through the settings, or from the command line you pass the `-ProfileManager` switch to the executable. Lets assume that the profile name you allocate is something really original like "test":
    
            {
                "name":"Firefox",
                "app":"/Applications/Firefox.app/Contents/MacOS/firefox",
                "args":["-P test"]
            }
        
    - **Windows**
    
            {
                "name":"Firefox",
                "app":"C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe",
                "args":[]
            }


- **IE**

    
    - **OS X**, what you talkin' bout Willis! Fire up your favourite VM image and follow the naitive example :-)
        
    - **Windows**
    
            {
                "name":"IE",
                "app":"C:\\Program Files (x86)\\Internet Explorer\\IEXPLORE.EXE",
                "args":[]
            }

- **node.js (any OS)**
    
        A node.js istance can act as a slave too provided that it runs the slave instance code:
    
            {
                "name":"Node.js",
                "app":"%CLIENT_ROOT%/node.js/node-slave.js",
                "args":[]
            }

## Examples
Ok, so enough with all the waffle, lets run some pre-baked tests included in the project! Depending on how your `npm` is set up, you need to direct the browser driver to the location of the example tests config file. Before you try to action this, please ensure that you have set up at least 1 browser inside that config file - see above for the gory details. 

Ok, so in this example, we will fire up the BrowserDriver on OS X, by pointing to the example tests config:

    browser-driver configFileName="/usr/local/lib/node_modules/browser-driver/examples/sampleTestSuite/testing.conf.json"
    
If all is well, you should see the BrowserDriver start up:

    starting server
    reading configuration file /usr/local/lib/node_modules/browser-driver/examples/sampleTestSuite/testing.conf.json
    Server listening on port 8090 at localhost
    Go to http://localhost:8090/manager/manager.html to manage and run tests

Time to go to the location it tells you in the above message, `http://localhost:8090/manager/manager.html`, and see the shiny manager page. From here, you can select the browser(s) that you set up and connect to, pick the tests you want to run, and you will see the feedback in real-time in the console. 

## License
The MIT License, because it rules.
