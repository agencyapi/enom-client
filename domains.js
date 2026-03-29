'use strict'

const {createClient} = require("./enom");

const { DateTime } = require("luxon");

module.exports = async function (fastify) {
    fastify.get('/domains', async (request, reply) => {
        const { ENOM_USER, ENOM_KEY } = fastify.config;

        const enomClient = createClient(ENOM_USER, ENOM_KEY)
        console.log("Loading the list of registered domains")
        enomClient.domains(function (error, data) {
            if (error) {
                if (typeof error === 'string') {
                    reply
                        .code(500)
                        .header('Content-Type', 'application/text; charset=utf-8')
                        .send(error)
                } else {
                    let errorCode = error.errorCode ?? 500;
                    reply
                        .code(errorCode)
                        .type('application/json; charset=utf-8')
                        .send(error)
                }
            } else {
                reply
                    .code(200)
                    .type('application/json; charset=utf-8')
                    .send(convertDomains(data))
            }
        });

        return reply;
    })
}

const convertDomains = function (data) {
    let domains = {}

    data['DomainDetail'].forEach(function (item) {
        const name = item['DomainName'][0]
        const enomId = item['DomainNameID'][0]
        const expiryDate = item['expiration-date'][0]
        const expiry = DateTime.fromFormat(expiryDate, 'M/d/yyyy h:mm:ss a', { zone: "America/Los_Angeles" }) // same as Seattle, Washington State
        const lockStatus = item['lockstatus'][0]
        const autoRenew = item['AutoRenew'][0]

        domains[name] = {
            "name" : name,
            "enomId" : enomId,
            "expiryDate" : expiry,
            "lockStatus" : lockStatus,
            "autoRenew" : autoRenew
        }
    })

    return { "domains" : domains }
}