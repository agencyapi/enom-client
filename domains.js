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
                reply
                    .code(500)
                    .header('Content-Type', 'application/text; charset=utf-8')
                    .send(error)
            } else {
                reply
                    .code(200)
                    .header('Content-Type', 'application/xml; charset=utf-8')
                    .send(data)
            }
        })
    })
}