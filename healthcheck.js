'use strict'

module.exports = async function (fastify) {
    fastify.get('/health', async (request, reply) => {
        const {ENOM_USER, ENOM_KEY} = fastify.config;

        if (ENOM_USER && ENOM_KEY) {
            return reply
                .code(200)
                .type('text/plain; charset=utf-8')
                .send("OK")
        } else {
            return reply
                .code(500)
                .type('text/plain; charset=utf-8')
                .send("Service is not configured correctly")
        }
    })
}