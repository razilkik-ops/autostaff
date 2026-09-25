#!/usr/bin/env bash
set -euo pipefail

app_dir="/srv/sgcb/current"
env_file="${app_dir}/.env"
credentials_file="/root/sgcb-admin-credentials"
admin_email="allstars-import@yandex.ru"

if [[ ! -d "${app_dir}/.git" ]]; then
  echo "Project checkout is missing: ${app_dir}" >&2
  exit 1
fi
if [[ -e "${env_file}" ]]; then
  echo "Application environment already exists; refusing to replace its secrets" >&2
  exit 1
fi

database_password="$(openssl rand -hex 24)"
session_secret="$(openssl rand -hex 32)"
admin_password="$(openssl rand -hex 24)"

if runuser -u postgres -- psql -tAc "SELECT 1 FROM pg_roles WHERE rolname = 'sgcb'" | grep -q 1; then
  runuser -u postgres -- psql -v ON_ERROR_STOP=1 -c "ALTER ROLE sgcb WITH PASSWORD '${database_password}'"
else
  runuser -u postgres -- psql -v ON_ERROR_STOP=1 -c "CREATE ROLE sgcb LOGIN PASSWORD '${database_password}'"
fi

if ! runuser -u postgres -- psql -tAc "SELECT 1 FROM pg_database WHERE datname = 'sgcb_store'" | grep -q 1; then
  runuser -u postgres -- createdb -O sgcb sgcb_store
fi

install -m 600 -o sgcb -g sgcb /dev/null "${env_file}"
printf 'NODE_ENV=production\nHOST=127.0.0.1\nPORT=4174\nAPP_URL=https://159.194.234.145.sslip.io\nDATABASE_URL=postgresql://sgcb:%s@127.0.0.1:5432/sgcb_store?schema=public\nSESSION_SECRET=%s\nTELEGRAM_BOT_TOKEN=\nTELEGRAM_CHAT_ID=\n' \
  "${database_password}" "${session_secret}" > "${env_file}"

umask 077
printf 'ADMIN_EMAIL=%s\nADMIN_PASSWORD=%s\n' "${admin_email}" "${admin_password}" > "${credentials_file}"

cd "${app_dir}"
runuser -u sgcb -- /usr/local/bin/npm ci --no-audit --no-fund
runuser -u sgcb -- /usr/local/bin/npm run build
runuser -u sgcb -- /usr/local/bin/npm run db:migrate

export ADMIN_EMAIL="${admin_email}"
export ADMIN_PASSWORD="${admin_password}"
export ADMIN_NAME="Павел"
runuser -u sgcb -- /usr/local/bin/npm run db:seed
unset ADMIN_EMAIL ADMIN_PASSWORD ADMIN_NAME

echo "Application dependencies, schema, and starter content are ready"
