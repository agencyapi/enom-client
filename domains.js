// Declare a route
const {createClient} = require("./enom");

module.exports = async function (fastify) {
    fastify.get('/domains', async (request, reply) => {
        const apiUser = process.env.ENOM_USER;
        const secretKey = process.env.ENOM_KEY;

        const enomClient = createClient(apiUser, secretKey)
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
                        .header('Content-Type', 'application/json; charset=utf-8')
                        .send(JSON.stringify(error))
                }
            } else {
                reply
                    .code(200)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(JSON.stringify(data))
            }
        })
    })
}