//Include the Client API lib
const { rejects } = require('assert');
const fs = require('fs');
const { resolve } = require('path');
var { SideeXWebserviceClientAPI: wsclientAPI, ProtocolType: ProtocolType } = require('./SideeXWebServiceClientAPI');

//Gets SideeX WebService server status
let ws_client = new wsclientAPI('http://127.0.0.1:50000/', ProtocolType.HTTP);

ws_client.echo().then((body)=> {
    console.log(body);
})

let file = fs.createReadStream('D:/workspace/sideex-webservice-client-api-java/testcase.zip');
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
            await ws_client.download(formData, "./reports.zip", 0);

            flag = true;

            //Delete the test case and report from the server
            await ws_client.deleteJob(token).then(response => {
                console.log(response);
            });
        }
    }
})
async function delay(time) {
    await new Promise((resolve) => { setTimeout(resolve, time); });
}