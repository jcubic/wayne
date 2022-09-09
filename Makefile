all: index.umd.js index.umd.min.js index.min.js

index.umd.js: index.js Makefile
	npx browserify -e index.js -s wayne -p esmify -o index.umd.js

index.umd.min.js: index.umd.js
	npx uglifyjs < index.umd.js > index.umd.min.js

index.min.js: index.js Makefile
	npx uglifyjs < index.js > index.min.js
