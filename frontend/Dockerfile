FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
# 使用淘宝/腾讯 npm 镜像加速
RUN npm config set registry https://registry.npmmirror.com
RUN npm install
COPY . .
RUN npm run build
