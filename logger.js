module.exports = {
    log: function(level, message, params) {
        console.log(`[${level}] ${message}: ${JSON.stringify(params)}`)
    }
}