# Kilder og medfølgende komponenter – Test 24

Implementationen bruger skolemodeller med eksplicitte betingelser. Tekster, UI, opgaver og referencebesvarelser er skrevet til projektet; modellerne følger standardligningerne nedenfor. Ingen private undervisningsfiler er distribueret.

## Faglige referencer

- OpenStax, *Chemistry 2e*, syre/base-ligevægte: https://openstax.org/books/chemistry-2e/pages/14-3-relative-strengths-of-acids-and-bases
- Buffere: https://openstax.org/books/chemistry-2e/pages/14-6-buffers
- Titrering: https://openstax.org/books/chemistry-2e/pages/14-7-acid-base-titrations
- Fældning/opløselighed: https://openstax.org/books/chemistry-2e/pages/15-1-precipitation-and-dissolution
- OpenStax, *Biology 2e*, arvelighed: https://openstax.org/books/biology-2e/pages/12-3-laws-of-inheritance
- Standard genetisk kode og translation: https://openstax.org/books/biology-2e/pages/15-5-ribosomes-and-protein-synthesis
- Matematikmodeller: potensreglen, polynomiers stamfunktion, sinus-/cosinusrelation, mindste kvadrater og normalfordeling. Den numeriske absolutte integralværdi er en tilnærmelse, og den logaritmiske regression minimerer fejl i log-værdier.
- Fysikmodeller: Newtons 2. lov, konstant acceleration, energibevarelse, lineær superposition, tynd linse/paraksialt spejl, Q=mcΔT, smeltevarme, Ohms lov og RC-eksponentialforløb.

## Runtime og editor

| Komponent | Version | Kilde |
|---|---|---|
| Pyodide | 314.0.8; CPython 3.14.2 | https://github.com/pyodide/pyodide/tree/314.0.8 |
| CodeMirror 5 | 5.65.20 | https://github.com/codemirror/codemirror5/tree/5.65.20 |
| sql.js | 1.16.0 | https://github.com/sql-js/sql.js |
| Tesseract.js / core | 7.0.0 / 7.0.0 | https://github.com/naptha/tesseract.js |
| Tesseract fast sprogdata | dan + eng, hashfastlåst | https://github.com/tesseract-ocr/tessdata_fast |

Filerne ligger i `extension/vendor/workbench/` med licenser og `PROVENANCE.json`, der indeholder npm-integritet, konkrete kilde-URL'er og SHA-256 for alle distribuerede filer. Pyodide/CPython-distributionen er uændret; tilhørende kildekode findes hos ovenstående projekter. Bibliotekerne bruges lokalt uden CDN under kørsel. Eksisterende vendor/punctuation er uændret.

Teknisk dokumentation:

- Pyodide JS API: https://pyodide.org/en/stable/usage/api/js-api.html
- Chrome extension-sandbox: https://developer.chrome.com/docs/extensions/reference/manifest/sandbox
- SQLite-syntaks: https://www.sqlite.org/lang.html
- Tesseract.js: https://tesseract.projectnaptha.com/

Testene verificerer de dokumenterede afgrænsninger og konkrete eksempler. Referencerne betyder ikke, at værktøjerne dækker alle tilfælde i bøgerne.
