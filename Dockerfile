FROM node:22-slim

WORKDIR /app

# Dependencias
COPY package*.json ./
RUN npm install

# Código
COPY . .

# Build
RUN npm run build

# Entorno
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start
CMD ["npm", "start"]
