rm -rf ./bin

node buildgen.js

mkdir -p ./bin
mkdir -p ./bin/linux/x64
mkdir -p ./bin/linux/arm64
mkdir -p ./bin/mac/arm64
mkdir -p ./bin/mac/x64
mkdir -p ./bin/win32/x64
mkdir -p ./bin/win32/arm64

pkg -t node18-linuxstatic-arm64 -o ./bin/linux/arm64/pt -C GZip index.js
pkg -t node18-linuxstatic-x64 -o ./bin/linux/x64/pt -C GZip index.js
pkg -t node18-win-x64 -o ./bin/win32/x64/pt -C GZip index.js
pkg -t node18-macos-arm64 -o ./bin/mac/arm64/pt -C GZip index.js

node buildcontrol.js

scp ./bin/linux/arm64/pt zephyrheights:/pool/web/cdn/powertools/release-linux-arm64.bin
scp ./bin/linux/x64/pt zephyrheights:/pool/web/cdn/powertools/release-linux-x64.bin
scp ./bin/mac/arm64/pt zephyrheights:/pool/web/cdn/powertools/release-darwin-arm64.bin
scp ./build.json zephyrheights:/pool/web/cdn/powertools/build.json