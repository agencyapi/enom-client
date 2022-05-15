'use strict'
const axios = require('axios'),
    xml2js = require('xml2js'),
    con = require('./enom.json');

const axiosInstance = axios.create(con.axiosOptions);

function EnomClient(id, pass) {
    this.id = id
    this.pass = pass
    this.url = con.axiosOptions.baseurl + con.axiosOptions.url
    this.axiosOptions = con.axiosOptions
}

const E = EnomClient.prototype;

E.callApi = function(command, callback) {
    axiosInstance
        .get(this.url, {
            params: this.commandParameters(command)
        })
        .then(response => {
            const status = response.status
            if (status !== 200) {
                console.log(`API HTTP response status code ${status}`)
                let errors = { "error" : "API call failed", "errorCode" : 500}
                callback(errors, null)
                return
            }

            const data = response.data
            const parser = new xml2js.Parser();
            parser.parseString(data, function(err,result){
                if (err) {
                    callback(err, null)
                    return
                }

                //Extract the value from the data element
                const errorCount = parseInt(result['interface-response']['ErrCount']);

                if (errorCount > 0) {
                    const errorData = result['interface-response'].errors[0];
                    const firstError = errorData['Err1'][0];
                    let errors = { "error": firstError }

                    if (firstError === 'Bad User name or Password') {
                        errors['errorCode'] = 403
                    }

                    if (firstError.contains('User not permitted from this IP address')) {
                        errors['errorCode'] = 403
                    }

                    for (let index = 2; index <= errorCount; index++) {
                        errors['error' + index] = errorData['Err' + index][0]
                    }
                    console.log(`API call returned ${errorCount} errors: ${ JSON.stringify(errors) }`)
                    callback(errors, null)
                    return
                }

                const commandResponse = result['interface-response'][command][0];
                callback(null, commandResponse)
            });
        })
        .catch(error => {
            console.log(error)
            callback(error, null)
        })
}

E.domains = function (callback) {
    this.callApi(con.routes.domains.list, callback)
}

E.commandParameters = function (command) {
    let params = new URLSearchParams();
    params.set('uid', this.id)
    params.set('pw', this.pass)
    params.set('command', command)
    params.set('ResponseType', 'XML')
    return params
}


module.exports = {
    EnomClient: EnomClient,
    createClient: function (options) {
        if (arguments.length === 2) {
            var args = Array.prototype.slice.call(arguments)
            options = { id: args[0], pass: args[1] }
        }
        return new EnomClient(options.id, options.pass);
    }
}