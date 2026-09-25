#!/usr/bin/env bash
set -euo pipefail

version="v22.23.3"
archive="node-${version}-linux-x64.tar.xz"
destination="/opt/node-${version}"
download_dir="$(mktemp -d)"

if [[ "$(uname -m)" != "x86_64" ]]; then
  echo "This installer expects an x86_64 Linux server" >&2
  exit 1
fi

curl -fsSLo "${download_dir}/${archive}" "https://nodejs.org/dist/${version}/${archive}"
curl -fsSLo "${download_dir}/SHASUMS256.txt" "https://nodejs.org/dist/${version}/SHASUMS256.txt"
cd "${download_dir}"
awk -v archive="${archive}" '$2 == archive { print }' SHASUMS256.txt | sha256sum --check --status

install -d -m 755 "${destination}"
tar -xJf "${archive}" -C "${destination}" --strip-components=1
ln -sfn "${destination}/bin/node" /usr/local/bin/node
ln -sfn "${destination}/bin/npm" /usr/local/bin/npm
ln -sfn "${destination}/bin/npx" /usr/local/bin/npx

/usr/local/bin/node --version
/usr/local/bin/npm --version
