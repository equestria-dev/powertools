rm -rf ./bin

node buildgen.js

mkdir -p ./bin
mkdir -p ./bin/linux/glibc/x64
mkdir -p ./bin/linux/glibc/arm64
mkdir -p ./bin/linux/musl/arm64
mkdir -p ./bin/linux/musl/x64
mkdir -p ./bin/linux/static/x64
mkdir -p ./bin/linux/static/arm64
mkdir -p ./bin/mac/arm64
mkdir -p ./bin/mac/x64
mkdir -p ./bin/win32/x64
mkdir -p ./bin/win32/arm64

pkg -t node18-linux-arm64 -o ./bin/linux/glibc/arm64/pt -C GZip index.js
pkg -t node18-linux-x64 -o ./bin/linux/glibc/x64/pt -C GZip index.js
pkg -t node18-linuxstatic-arm64 -o ./bin/linux/static/arm64/pt -C GZip index.js
pkg -t node18-linuxstatic-x64 -o ./bin/linux/static/x64/pt -C GZip index.js
pkg -t node18-alpine-arm64 -o ./bin/linux/musl/arm64/pt -C GZip index.js
pkg -t node18-alpine-x64 -o ./bin/linux/musl/x64/pt -C GZip index.js
pkg -t node18-win-arm64 -o ./bin/win32/arm64/pt -C GZip index.js
pkg -t node18-win-x64 -o ./bin/win32/x64/pt -C GZip index.js
pkg -t node18-macos-arm64 -o ./bin/mac/arm64/pt -C GZip index.js
pkg -t node18-mac-x64 -o ./bin/mac/x64/pt -C GZip index.js