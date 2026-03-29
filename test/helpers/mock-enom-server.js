'use strict'

const http = require('node:http');

function createMockServer() {
    const responses = {};

    const server = http.createServer((req, res) => {
        const urlObj = new URL(req.url, 'http://localhost');
        const command = urlObj.searchParams.get('command');
        const xml = responses[command];

        if (xml) {
            res.writeHead(200, { 'Content-Type': 'text/xml; charset=utf-8' });
            res.end(xml);
        } else {
            res.writeHead(404);
            res.end(`No fixture configured for command: ${command}`);
        }
    });

    return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => {
            server.removeListener('error', reject);
            const { port } = server.address();
            resolve({
                url: `http://127.0.0.1:${port}`,
                setResponse(command, xml) { responses[command] = xml; },
                close() { return new Promise(r => server.close(r)); }
            });
        });
    });
}

module.exports = { createMockServer };
