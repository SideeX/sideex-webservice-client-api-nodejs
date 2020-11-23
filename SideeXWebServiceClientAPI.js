const fs = require('fs');
const fetch = require('node-fetch');
const http = require('http');
const https = require('https');
const FormData = require('form-data');

const ProtocolType = {
    HTTP: 0,
    HTTPS_DISABLE: 1,
    HTTPS_ENABLE: 2
}

class SideeXWebserviceClientAPI {
    constructor(baseURL, protocolType = ProtocolType.HTTP, caFilePath = null) {
        this.baseURL = baseURL;
        this.protocolType = protocolType;
        this.caFilePath = caFilePath;
        this.keepAliveAgent = new http.Agent();
        if (this.baseURL.charAt(this.baseURL.length - 1) != '/') {
            this.baseURL = this.baseURL + "/";
        }

        if (this.protocolType == ProtocolType.HTTPS_DISABLE) {
            this.keepAliveAgent = new https.Agent();
            process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
        } else if (this.protocolType == ProtocolType.HTTPS_ENABLE) {
            this.keepAliveAgent = new https.Agent({
                ca: fs.readFileSync(this.caFilePath),
            });
        }
    }

    async echo() {
        let response = await fetch(`${this.baseURL}sideex-webservice/echo`, {
            method: 'GET',
            agent: this.keepAliveAgent
        })
        // console.log(response.text())
        return await  response.text();
    }

    async runTestSuite(file) {
        try {
            fs.accessSync(file.path, fs.constants.F_OK | fs.constants.R_OK);
            let formData = new FormData();
            formData.append('file', file, {
                contentType: 'application/zip',
                filename: file.path,
                knownLength: file.length
            });
            let response = await fetch(this.baseURL + "sideex-webservice/runTestSuites", {
                method: 'POST',
                body: formData,
                agent: this.keepAliveAgent
            })
            return await response.text();
        } catch (e) {
            throw e;
        }
    }

    async getState(token) {
        let response = await fetch(`${this.baseURL}sideex-webservice/getState?token=${token}`, {
            method: 'GET',
            agent: this.keepAliveAgent
        })
        return await response.text();
    }

    async download(formData, filePath, option) {
        let tempBaseURL = this.baseURL;
        if (option == 0) {
            tempBaseURL = tempBaseURL + "sideex-webservice/downloadReports";
        } else {
            tempBaseURL = tempBaseURL + "sideex-webservice/downloadLogs";
        }

        let response = await fetch(`${tempBaseURL}?token=${formData.token}&file=${formData.file}`, {
            method: 'GET',
            agent: this.keepAliveAgent
        })
        await response.body.pipe(fs.createWriteStream(filePath));
    }

    async deleteJob(token) {
        let response = await fetch(`${this.baseURL}sideex-webservice/deleteJob?token=${token}`, {
            method: 'POST',
            agent: this.keepAliveAgent
        })
        return await response.text();
    }
}

module.exports = {
    SideeXWebserviceClientAPI,
    ProtocolType: ProtocolType
}