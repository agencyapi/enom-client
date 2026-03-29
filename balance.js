'use strict'

const {createClient} = require("./enom");

module.exports = async function (fastify) {
    fastify.get('/balance', async (request, reply) => {
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
