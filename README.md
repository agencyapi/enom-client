# enom-client
A simple proxy for Enom Reseller API

## Configuration

Setup ENOM_USER and ENOM_KEY as environment variables.

ENOM_USER is your user id

ENOM_KEY is an API token that you can obtain via [Enom API Token Manager](https://cp.enom.com/apitokens/default.aspx)

Also you must enable your public IP for access to live API via [API Live Environment Setup](https://cp.enom.com/resellers/reseller-account.aspx)

## How to use the application

Run `npm install` to install Node modules such as Axios and Fastify

Run `npm start` to star the server

## Endpoints

### Domains

Query http://localhost:4000/domains to get the list of domains registered with Enom under your reseller account 

