module.exports = {
    log: function(level, message, params) {
        if (params) {
            console.log(`[${level}] ${message}: ${JSON.stringify(params)}`)
        } else {
            console.log(`[${level}] ${message}`)
        }
    }
}