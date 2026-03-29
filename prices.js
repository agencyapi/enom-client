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

    data['ProductPrice'].forEach(function (item) {
        const tld = item['Producttld'][0]
        const productType = item['ProductType'][0].toLowerCase()
        const price = item['Price'][0]

        if (!prices[tld]) {
            prices[tld] = { "tld": tld }
        }

        if (productType === 'registration') {
            prices[tld]['registrationPrice'] = price
        } else if (productType === 'renewal') {
            prices[tld]['renewalPrice'] = price
        } else if (productType === 'transfer') {
            prices[tld]['transferPrice'] = price
        }
    })

    return { "prices": prices }
}
