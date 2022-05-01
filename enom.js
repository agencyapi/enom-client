'use strict'
const axios = require('axios'),
    con = require('./enom.json');

const axiosInstance = axios.create(con.axiosOptions);

function EnomClient(id, pass) {
    this.id = id
    this.pass = pass
    this.url = con.axiosOptions.baseurl + con.axiosOptions.url
    this.axiosOptions = con.axiosOptions
}

const E = EnomClient.prototype;

E.domains = function (callback) {
    axiosInstance
        .get(this.url, {
            params: this.commandParameters(con.routes.domains.list)
        })
        .then(response => {
            const status = response.status
            //TODO: implement status handling
            console.log(`status code ${status}`)
            const data = response.data
            callback(null, data)
        })
        .catch(error => {
            console.log(error)
            callback(error, null)
        })
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