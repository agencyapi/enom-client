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

function extractErrors(errorData, errorCount) {
    const firstError = errorData['Err1'][0];
    let errors = { "error": firstError }

    if (firstError === 'Bad User name or Password') {
        errors['errorCode'] = 403
    }

    if (firstError.startsWith('User not permitted from this IP address')) {
        errors['errorCode'] = 403
    }

    for (let index = 2; index <= errorCount; index++) {
        errors['error' + index] = errorData['Err' + index][0]
    }
    return errors
}

E.callApi = function(command, extractor, callback) {
    if (typeof extractor === 'function' && callback === undefined) {
        // callApi(command, callback) — no extractor provided; default to command-named wrapper
        callback = extractor
        extractor = function(ir) { return ir[command][0] }
    }
    if (typeof callback !== 'function') {
        throw new TypeError('callApi: callback must be a function')
    }
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
                    const errors = extractErrors(errorData, errorCount)
                    console.log(`API call returned ${errorCount} errors: ${ JSON.stringify(errors) }`)
                    callback(errors, null)
                    return
                }

                callback(null, extractor(result['interface-response']))
            });
        })
        .catch(error => {
            console.log(`API call failed: ${error.message}`, { status: error.response?.status })
            callback(error, null)
        })
}

E.domains = function (callback) {
    this.callApi(con.routes.domains.list, callback)
}

E.balance = function (callback) {
    this.callApi(con.routes.balance.get, function(ir) {
        return {
            balance: parseFloat(ir['Balance'][0]),
            availableBalance: parseFloat(ir['AvailableBalance'][0])
        }
    }, callback)
}

E.prices = function (callback) {
    this.callApi(con.routes.prices.list, callback)
}

E.checkLogin = function (callback) {
    this.callApi(con.routes.login.check, function(ir) { return true }, callback)
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