all: index.umd.js index.umd.min.js index.min.js

index.umd.js: index.js Makefile
	npx browserify -e index.js -s wayne -p esmify -o index.umd.js

index.umd.min.js: index.umd.js Makefile banner.js
	npx uglifyjs < index.umd.js > tmp.js
	cat banner.js tmp.js > index.umd.min.js
	rm tmp.js

index.min.js: index.js Makefile banner.js
	npx uglifyjs < index.js > tmp.js
	cat banner.js tmp.js > index.min.js
	rm tmp.js
