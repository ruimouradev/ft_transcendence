


FROM nginx:alpine

RUN apk add --no-cache openssl

RUN mkdir -p /etc/nginx/ssl

RUN openssl req -x509 -nodes -days 365 \
    -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/transcendence.key \
    -out /etc/nginx/ssl/transcendence.crt \
    -subj "/C=PT/L=Lisbon/O=42Lisbon/OU=ft_transcendence/CN=localhost"

COPY /dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443