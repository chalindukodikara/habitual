#!/bin/sh
set -eu

: "${API_URL:?missing API_URL}"

envsubst '$API_URL' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'
