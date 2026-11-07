FROM node:22.23.4-alpine3.23 AS deps
WORKDIR /srv
COPY package*.json ./
RUN npm ci --only=production

FROM node:22.23.4-alpine3.23 AS release

WORKDIR /srv
COPY --from=deps /srv/node_modules ./node_modules
COPY . .
EXPOSE 4000
ENV HOST 0.0.0.0
ENV PORT 4000
#ENV ENOM_USER ""
#ENV ENOM_KEY ""
CMD [ "node", "server.js" ]