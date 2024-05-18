rm -rf ./bin

version=$(node buildgen.js)

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

curl -v --header "PRIVATE-TOKEN: $(cat ~/.deploy.txt)" --header "Content-Type: multipart/form-data" --upload-file ./bin/linux/arm64/pt https://source.equestria.dev/api/v4/projects/91/packages/generic/powertools/$version/pt-linux-arm64
curl -v --header "PRIVATE-TOKEN: $(cat ~/.deploy.txt)" --header "Content-Type: multipart/form-data" --upload-file ./bin/linux/x64/pt https://source.equestria.dev/api/v4/projects/91/packages/generic/powertools/$version/pt-linux-x64
curl -v --header "PRIVATE-TOKEN: $(cat ~/.deploy.txt)" --header "Content-Type: multipart/form-data" --upload-file ./bin/mac/arm64/pt https://source.equestria.dev/api/v4/projects/91/packages/generic/powertools/$version/pt-darwin-arm64
curl -v --header "PRIVATE-TOKEN: $(cat ~/.deploy.txt)" --header "Content-Type: multipart/form-data" --upload-file ./bin/mac/x64/pt https://source.equestria.dev/api/v4/projects/91/packages/generic/powertools/$version/pt-darwin-x64
curl -v --header "PRIVATE-TOKEN: $(cat ~/.deploy.txt)" --header "Content-Type: multipart/form-data" --upload-file ./bin/win32/arm64/pt.exe https://source.equestria.dev/api/v4/projects/91/packages/generic/powertools/$version/pt-win32-arm64.exe
curl -v --header "PRIVATE-TOKEN: $(cat ~/.deploy.txt)" --header "Content-Type: multipart/form-data" --upload-file ./bin/win32/x64/pt.exe https://source.equestria.dev/api/v4/projects/91/packages/generic/powertools/$version/pt-win32-x64.exe
