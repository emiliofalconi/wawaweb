# ==============================================================================
# Dockerfile Multi-Stage para WawaWeb (Salud Digital COIL 202715)
# Despliegue en la Web (Render, Railway, Fly.io, AWS, Google Cloud Run)
# ==============================================================================

# 1. Etapa de Compilación
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Instalar certificados CA necesarios para dependencias seguras
RUN apk add --no-cache ca-certificates tzdata git

# Copiar manifiesto de dependencias Go
COPY go.mod go.sum ./
RUN go mod download

# Copiar el código fuente completo
COPY . .

# Compilar binario estático sin CGO (usando modernc.org/sqlite en pure Go)
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o wawaweb-server .

# 2. Etapa de Producción Ultraligera (Alpine)
FROM alpine:3.20

WORKDIR /app

# Certificados y zona horaria
RUN apk --no-cache add ca-certificates tzdata
ENV TZ=America/Caracas

# Crear directorio de datos persistente para la base de datos SQLite
RUN mkdir -p /app/data && chmod 777 /app/data

# Copiar el binario compilado desde la etapa anterior
COPY --from=builder /app/wawaweb-server /app/wawaweb-server

# Variables de entorno por defecto (compatibles con Render, Railway, Fly.io)
ENV PORT=8080
ENV HOST=0.0.0.0
ENV DATABASE_PATH=/app/data/wawaweb.db
ENV JWT_SECRET=wawaweb-production-secret-coil-202715
ENV NO_BROWSER=1

# Exponer el puerto web
EXPOSE 8080

# Volumen para persistencia de la base de datos SQLite
VOLUME ["/app/data"]

# Ejecución del servidor
CMD ["/app/wawaweb-server"]

