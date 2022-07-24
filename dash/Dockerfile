FROM node:latest
WORKDIR /app
ADD package.json .
ADD package-lock.json .
RUN npm i
ADD prisma .
RUN npx prisma generate
ADD . .
RUN npm run build