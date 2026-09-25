FROM node:24.11.1
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY src ./src
COPY drizzle ./drizzle
COPY drizzle.config.ts tsconfig.json ./
CMD ["npm", "run", "start:container"]
