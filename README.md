# SideeX WebService Client API for Node.js
SideeX WebService Client API primarily handles the transfer of test suites to a hosted [SideeX WebService](https://hackmd.io/@sideex/webservice) server and returns the test reports.

# Download
Download the [SideeX WebService Client API for Node.js](https://www.npmjs.com/package/sideex-webservice-client)

# The API for Node.js
### `const ProtocalType` 
- Description: ProtocalType is a self-defined object type which specifies the http protocal. `HTTP` stands for http request; `HTTPS_DISABLE` stands for https request without certificate; `HTTPS_ENABLE` stands for https request with certificate.

### `SideeXWebserviceClientAPI(baseURL)`
- Description: The constructor to create a Client API object
-  `baseURL`: Base URL of the SideeX WebService server

### `runTestSuite(file)`
- Description: Uses the API to run test cases
- `file`: The file that contains test cases
- Return:
    ```
    {
        "token": "xxxx"
    }
    ```

### `getState(token)`
- Description: Gets the current test case execution state
- `token`: The token returned from the *sideex-webservice* Web API
    - If the token is invalid, the response will be
        ```
        { 
            "ok": false, 
            "errorMessage": "invalid_token" 
        }
        ```
    - If the token is `valid` and the state is `running`, the response will be
        ```
        {
            "ok": true, 
            "webserviceState": {
                "state": "running"
            }
        }
        ```
    - If the token is `valid` and the state is `complete`, the response will be
        ```
        {
            "ok": true,
            "webserviceState": {
                "state": "complete"
            },
            "reports": {
                "url": "http://{publicURL_in_serviceconfig}/sideex-webservice-reports?token=xxxx",
                "passed": true,
                "summarry": [
                    {
                        "Suites": ["Test_Suite_1"],
                        "SideeXVersion": [3,3,7],
                        "Browser": "chrome 81.0.4044.138",
                        "Platform": "windows",
                        "Language": "(default)",
                        "StartTime": 1589867469846,
                        "EndTime": 1589867472874,
                        "PassedSuite": 1,
                        "TotalSuite": 1,
                        "PassedCase": 1,
                        "TotalPassedCase": 1
                    }
                ]
            },
            "logs": {
                "url": "http://{publicURL_in_serviceconfig}/sideex-webservice-logs?token=xxxx"
            }
        }
        ```
### `download(formData, filePath, option)`
- Description: Download HTML test reports or logs
- `formData`: A JSON object containing
    - `token`: The token returned from the *sideex-webservice* Web API
    - `file`: This parameter is optional. If set `file` to `"reports.zip"`, the API will return a zip file containing  all HTML reports, otherwise, it will return an HTML index webpage.
- `filePath`: Set your download file path. e.g.: "./reports"
- `option`: If option is set to `0`, the API will download reports. If set to `1`, it will download logs.

### `deleteReport(token)`
- Description: Delete the test case and the test reports on SideeX WebService server
- `token`: The token returned from the *sideex-webservice* Web API
    - If success, the response will be
        ```
        { 
            "ok": true, "state": "delete_complete" 
        }
        ```
    - If the token is invalid, the response will be 
        ```
        { 
            "ok": false, "errorMessage": "invalid_token" 
        }
        ```
    - If the test case is running, the response will be
        ```
        { 
            "ok": false, "errorMessage": "testcase_is_running" 
        }
        ```


# How to use

### Send a test case file to a SideeX WebService server 
```js=
//Include the lib of the SideeX WebService Client API
const fs = require('fs');
var { SideeXWebserviceClientAPI: wsclientAPI, ProtocalType } = require('sideex-webservice-client');

//Create a Client API object connecting to a SideeX WebService server
let ws_client = new wsclientAPI("http://127.0.0.1:50000");

//Prepare a test case file
let file = fs.createReadStream('testcase.zip');

//Send the test case file to the server and get a token 
ws_client.runTestSuite(file).then(response => {
    console.log(response) //Show a returned token
})
```

### Get the current test execution state from the server
```js=
//Get the current state
let token = "xxxx";
ws_client.getState(token).then(response => {
    console.log(response);
})
```

### Download the test reports and logs
```js=
//Download the test reports as an HTML index webpage
let formData = {
    token: "xxxx"
}
ws_client.download("./index.html", 0);

//Download the test reports as a zip file
let formData = {
    token: "xxxx",
    file: "reports.zip"
}
ws_client.download(formData, "./reports.zip", 0);

//Download the logs as a zip file
let formData = {
    token: "xxxx"
}
ws_client.download(formData, "./logs.zip", 1);
```

### Delete the test case and the reports from the server
```js=
//Delete the test case and reports
let token = "xxxx";
ws_client.deleteReport(token).then(response => {
    console.log(response);
})
```


An example:
```js=
//Include the Client API lib
const fs = require('fs');
var { SideeXWebserviceClientAPI: wsclientAPI, ProtocalType } = require('sideex-webservice-client');

//Connect to a SideeX WebService server
let ws_client = new wsclientAPI('http://127.0.0.1:50000/', ProtocalType.HTTP);
let file = fs.createReadStream('testcase.zip');
ws_client.runTestSuite(file).then(async(body) => {
    let token = JSON.parse(body).token; // get the token
    let flag = false;

    //Check the execution state every 2 seconds
    while (!flag) {

        //Get the current state
        state = await ws_client.getState(token);
        if (JSON.parse(state).webservice.state != "complete" && JSON.parse(state).webservice.state != "error") {
            console.log(JSON.parse(state).webservice.state);
            await delay(2000);
        }
        //If test is error
        else if(JSON.parse(state).webservice.state == 'error') {
            console.log(JSON.parse(state).webservice.state);
            flag = true;
        }
        //If test is complete
        else {
            console.log(JSON.parse(state).webservice.state);
            let formData = {
                    token: token,
                    file: "reports.zip"
                }
                //Download the test report
            ws_client.download(formData, "./reports.zip", 0);

            formData = {
                    token: token
                }
                //Download the logs
            ws_client.download(formData, "./logs.zip", 1);

            flag = true;

            //Delete the test case and report from the server
            ws_client.deleteReport(token).then(response => {
                console.log(response);
            })
        }
    }

    
})

async function delay(time) {
    await new Promise((resolve) => { setTimeout(resolve, time); });
}
```


