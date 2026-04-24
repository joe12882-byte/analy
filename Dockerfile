# Dockerfile para Anali en Zeabur
FROM node:22-slim

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar código y compilar frontend
COPY . .
RUN npm run build

# Exponer el puerto asignado por Zeabur (usualmente usa la env PORT)
EXPOSE 3000

# Iniciar el servidor de producción
CMD ["npm", "start"]
