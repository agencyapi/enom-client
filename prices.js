'use strict'

const {createClient} = require("./enom");

module.exports = async function (fastify) {
    fastify.get('/prices', async (request, reply) => {
        const { ENOM_USER, ENOM_KEY } = fastify.config;

        const enomClient = createClient(ENOM_USER, ENOM_KEY)
        console.log("Loading retail pricing")
        enomClient.prices(function (error, data) {
            if (error) {
                const errorCode = error.errorCode ?? 500;
                reply
                    .code(errorCode)
                    .type('text/plain; charset=utf-8')
                    .send(errorCode === 403 ? "Forbidden" : "Internal server error")
            } else {
                reply
                    .code(200)
                    .type('application/json; charset=utf-8')
                    .send(convertPrices(data))
            }
        });

        return reply;
    })
}

const convertPrices = function (data) {
    let prices = {}

    data['tld'].forEach(function (item) {
        const tld = item['tld'][0]
        prices[tld] = {
            "tld": tld,
            "registrationPrice": item['registerprice'][0],
            "renewalPrice": item['renewprice'][0],
            "transferPrice": item['transferprice'][0]
        }
    })

    return { "prices": prices }
}
