'use strict'

const {createClient} = require("./enom");

module.exports = async function (fastify) {
    fastify.get('/balance', {
        schema: {
            description: 'Returns the current Enom reseller account balance',
            tags: ['account'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        balance: { type: 'number', description: 'Total account balance' },
                        availableBalance: { type: 'number', description: 'Available (spendable) balance' }
                    }
                },
                403: { type: 'string', description: 'Forbidden' },
                500: { type: 'string', description: 'Internal server error' }
            }
        }
    }, async (request, reply) => {
        const { ENOM_USER, ENOM_KEY } = fastify.config;

        const enomClient = createClient(ENOM_USER, ENOM_KEY)
        console.log("Loading account balance")
        enomClient.balance(function (error, data) {
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
                    .send(data)
            }
        });

        return reply;
    })
}
