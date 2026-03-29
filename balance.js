'use strict'

const {createClient} = require("./enom");

module.exports = async function (fastify) {
    fastify.get('/balance', async (request, reply) => {
        const { ENOM_USER, ENOM_KEY } = fastify.config;

        const enomClient = createClient(ENOM_USER, ENOM_KEY)
        console.log("Loading account balance")
        enomClient.balance(function (error, data) {
            if (error) {
                if (typeof error === 'string') {
                    reply
                        .code(500)
                        .type('text/plain; charset=utf-8')
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
                    .send(data)
            }
        });

        return reply;
    })
}
