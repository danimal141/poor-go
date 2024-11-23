FROM denoland/deno:debian-2.1.0

WORKDIR /app

# Copy configuration files
COPY deno.json .
COPY main.ts .

EXPOSE 8000

CMD ["deno", "task", "dev"]
