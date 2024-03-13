VERSION=0.15.0
DATE=`date -uR`
YEAR=`date +%Y`

all: README.md package-lock.json index.umd.js index.umd.min.js index.min.js

.$(VERSION): Makefile
	touch .$(VERSION)

package.json: .$(VERSION)
	grep version package.json | grep -v "$(VERSION)" > /dev/null && sed -i -e "s/\(\"version\": \"\)[^\"]\+/\1$(VERSION)/" package.json || true

package-lock.json: package.json
	npm install

README.md: .$(VERSION)
	sed -i -e "s/\(npm-\)[^-]\+\(-blue.svg\)/\1$(VERSION)\2/" -e "s/\(2022\)-[0-9]\+/\1-$(YEAR)/" README.md

index.js: .$(VERSION) Makefile
	sed -i -e "s/\(* Wayne .* (v. \)\([^)]\+\)/\1$(VERSION)/" -e "s/\(2022\)-[0-9]\+/\1-$(YEAR)/" index.js

banner.version.js: .$(VERSION) banner.js Makefile
	sed -e "s/{{VER}}/$(VERSION)/" -e "s/\(2022\)-[0-9]\+/\1-$(YEAR)/" -e "s/{{DATE}}/$(DATE)/" banner.js > banner.version.js

index.umd.js: index.js Makefile
	npx browserify -e index.js -s wayne -p esmify -o tmp.js
	cat banner.version.js tmp.js > index.umd.js
	rm tmp.js

index.umd.min.js: banner.version.js index.umd.js Makefile banner.js
	npx uglifyjs < index.umd.js > tmp.js
	cat banner.version.js tmp.js > index.umd.min.js
	rm tmp.js

index.min.js: banner.version.js index.js Makefile
	npx uglifyjs < index.js > tmp.js
	cat banner.version.js tmp.js> index.min.js
	rm tmp.js
