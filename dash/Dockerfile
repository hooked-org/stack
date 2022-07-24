FROM node:latest
WORKDIR /app
ADD package.json .
ADD package-lock.json .
RUN npm i
ADD prisma .
ENV DATABASE_URL $DATABASE_URL
RUN npx prisma generate
ADD . .
RUN npm run build