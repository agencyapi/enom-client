// Declare a route
module.exports = async function (fastify) {
    fastify.get('/health', async (request, reply) => {
        const apiUser = process.env.ENOM_USER;
        const secretKey = process.env.ENOM_KEY;

        if (apiUser && secretKey) {
            reply
                .code(200)
                .header('Content-Type', 'application/text; charset=utf-8')
                .send("OK")
        } else {
            reply
                .code(500)
                .header('Content-Type', 'application/text; charset=utf-8')
                .send("Service is not configured correctly")
        }
    })
}