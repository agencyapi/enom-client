'use strict'

const { createMockServer } = require('./helpers/mock-enom-server');
const fixtures = require('./helpers/fixtures');

let mockServer;
let app;

beforeAll(async () => {
    process.env.ENOM_USER = 'testuser';
    process.env.ENOM_KEY = 'testkey';

    mockServer = await createMockServer();
    process.env.ENOM_BASE_URL = mockServer.url;

    app = require('../server');
    await app.ready();
});

afterAll(async () => {
    await app.close();
    await mockServer.close();
    delete process.env.ENOM_BASE_URL;
});

test('GET /balance returns numeric balance fields', async () => {
    mockServer.setResponse('GetBalance', fixtures.getBalance);

    const response = await app.inject({ method: 'GET', url: '/balance' });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.balance).toBe(100.50);
    expect(body.availableBalance).toBe(95.25);
});

test('GET /balance returns 403 on bad credentials', async () => {
    mockServer.setResponse('GetBalance', fixtures.errorBadCredentials);

    const response = await app.inject({ method: 'GET', url: '/balance' });

    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Bad User name or Password');
});
