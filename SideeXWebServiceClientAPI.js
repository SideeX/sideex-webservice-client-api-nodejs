const fs = require('fs');
const fetch = require('node-fetch');
const http = require('http');
const https = require('https');
const FormData = require('form-data');

const ProtocalType = {
    HTTP: 0,
    HTTPS_DISABLE: 1,
    HTTPS_ENABLE: 2
}

class SideeXWebserviceClientAPI {
    constructor(baseURL, protocalType = ProtocalType.HTTP, caFilePath = null) {
        this.baseURL = baseURL;
        this.protocalType = protocalType;
        this.caFilePath = caFilePath;
        this.keepAliveAgent = new http.Agent();
        if (this.baseURL.charAt(this.baseURL.length - 1) != '/') {
            this.baseURL = this.baseURL + "/";
        }

        if (this.protocalType == ProtocalType.HTTPS_DISABLE) {
            this.keepAliveAgent = new https.Agent();
            process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
        } else if (this.protocalType == ProtocalType.HTTPS_ENABLE) {
            this.keepAliveAgent = new https.Agent({
                ca: fs.readFileSync(this.caFilePath),
            });
        }
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
            let response = await fetch(this.baseURL + "sideex-webservice", {
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
        let response = await fetch(`${this.baseURL}sideex-webservice-state?token=${token}`, {
            method: 'GET',
            agent: this.keepAliveAgent
        })
        return await response.text();
    }

    async download(formData, filePath, option) {
        let tempBaseURL = this.baseURL;
        if (option == 0) {
            tempBaseURL = tempBaseURL + "sideex-webservice-reports";
        } else {
            tempBaseURL = tempBaseURL + "sideex-webservice-logs";
        }

        let response = await fetch(`${tempBaseURL}?token=${formData.token}&file=${formData.file}`, {
            method: 'GET',
            agent: this.keepAliveAgent
        })
        await response.body.pipe(fs.createWriteStream(filePath));
    }

    async deleteReport(token) {
        let response = await fetch(`${this.baseURL}sideex-webservice-delete?token=${token}`, {
            method: 'POST',
            agent: this.keepAliveAgent
        })
        return await response.text();
    }
}

module.exports = {
    SideeXWebserviceClientAPI,
    ProtocalType
}