node buildgen.js

rm -rf ./bin
mkdir -p ./bin
mkdir -p ./bin/mac/arm64

pkg -t node18-macos-arm64 -o ./bin/mac/arm64/pt -C GZip index.js
cp ./bin/mac/arm64/pt ~/bin