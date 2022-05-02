'use strict'
const {createClient} = require("./enom");
const server = require('fastify')()

// Require library to exit fastify process, gracefully (if possible)
const closeWithGrace = require('close-with-grace')

const HOST = process.env.HOST || '127.0.0.1';
const PORT = process.env.PORT || 4000;

console.log(`Starting as pid=${process.pid}`);
console.log(`Enom API user=${process.env.ENOM_USER}`)

const domainService = require('./domains.js')
const healthCheckService = require('./healthcheck.js')
server.register(domainService)
server.register(healthCheckService)

// delay is the number of milliseconds for the graceful close to finish
const closeListeners = closeWithGrace({ delay: 500 }, async function ({ signal, err, manual }) {
    if (err) {
        server.log.error(err)
    }
    await server.close()
})

server.addHook('onClose', async (instance, done) => {
    closeListeners.uninstall()
    done()
})

// Run the server!
const start = async () => {
    try {
        await server.listen(PORT, HOST, () => {
            console.log(`Listing at http://${HOST}:${PORT}`);
        })
    } catch (err) {
        server.log.error(err)
        process.exit(1)
    }
}
start()