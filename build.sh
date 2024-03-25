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
pkg -t node18-win-x64 -o ./bin/win32/x64/pt.exe -C GZip index.js
pkg -t node18-win-arm64 -o ./bin/win32/arm64/pt.exe -C GZip index.js
pkg -t node18-macos-arm64 -o ./bin/mac/arm64/pt -C GZip index.js
pkg -t node18-macos-x64 -o ./bin/mac/x64/pt -C GZip index.js

node buildcontrol.js

rm -rf ./upload
mkdir ./upload
cp ./bin/linux/arm64/pt ./upload/release-linux-arm64.bin
cp ./bin/linux/x64/pt ./upload/release-linux-x64.bin
cp ./bin/mac/arm64/pt ./upload/release-darwin-arm64.bin
cp ./bin/mac/x64/pt ./upload/release-darwin-x64.bin
cp ./bin/win32/arm64/pt.exe ./upload/release-win32-arm64.bin
cp ./bin/win32/x64/pt.exe ./upload/release-win32-x64.bin
cp ./build.json ./upload/build.json

rsync --progress ./upload/* dabssi:/pool/web/cdn/powertools/
rm -rf ./upload
