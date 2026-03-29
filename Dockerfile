ARG NODE_VERSION=22.22.2
ARG ALPINE_VERSION=3.23

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS deps
WORKDIR /srv
COPY package*.json ./
RUN npm ci --only=production

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS release
ARG NODE_VERSION
ENV V=${NODE_VERSION}
ENV FILE node-v$V-linux-x64-musl.tar.xz
RUN apk add --no-cache libstdc++ \
&& apk add --no-cache --virtual .deps curl \
&& curl -fsSLO --compressed \
"https://unofficial-builds.nodejs.org/download/release/v$V/$FILE" \
&& tar -xJf $FILE -C /usr/local --strip-components=1 \
&& rm -f $FILE /usr/local/bin/npm /usr/local/bin/npx \
&& rm -rf /usr/local/lib/node_modules \
&& apk del .deps

WORKDIR /srv
COPY --from=deps /srv/node_modules ./node_modules
COPY . .
EXPOSE 4000
ENV HOST 0.0.0.0
ENV PORT 4000
#ENV ENOM_USER ""
#ENV ENOM_KEY ""
CMD [ "node", "server.js" ]