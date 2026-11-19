# Test 27 – Python-output i terminalen

Bygger på Test 26. Manifestversionen er fortsat 0.1.3; denne pakke udløser ikke en release.

## Rettelse

Python-starten sendte de medfølgende WASM-bytes til Emscriptens fabriksfunktion, men Pyodide 314.0.8 opretter allerede før dette sit eget `instantiateWasm`-forløb. Det hentede `pyodide.asm.wasm` fra den ugyldige `indexURL`. Derfor kunne opstarten gå i stå, før brugerens program blev kørt. De tidligere runtimeprøver brugte en gyldig filsti i Node og opdagede ikke denne forskel.

Python-workerens indlæser besvarer nu præcis denne interne WASM-forespørgsel med de bytes, som følger med udvidelsen. Adressen er virtuel: ingen netværksforespørgsel udføres. Standardbiblioteket og modulerne indlæses stadig fra lokale blobs. Øvrige netværksadresser afvises. Sandbox, tidsgrænser og udvidelsens tilladelser er bevaret; leverandørfilerne er ikke ændret.

Terminalen viser en startbesked med det samme. Tom kode giver en fejl i terminalen, og et program uden udskrift forklarer, at man kan bruge `print(...)` eller `console.log(...)`. Opstartsfejl fra oprettelse af worker og overførsel af programmet sendes nu videre, og terminalfanen åbnes ved en fejl.

Python-output bruger desuden byte-strømme med UTF-8-afkodning. Det bevarer danske tegn, inputspørgsmål og `print(..., end="")` uden at indsætte ekstra linjeskift. Delvise linjer tømmes også ved normal afslutning og Python-fejl.

## Prøv i den installerede udvidelse

1. Pak hele ZIP-filen ud, og kopiér hele `extension`-mappen til den mappe, din eksisterende installation bruger.
2. Genindlæs udvidelsen på `chrome://extensions` eller `edge://extensions`, og genindlæs derefter Lectio-fanen.
3. Åbn Hjælpemidler → Kodeværksted, vælg Python og Fri kode, og kør:

```python
print("Hej fra terminalen!")
print(2 + 3)
```

Terminalen skal vise hilsenen og `5`. Prøv derefter et program med `input()`. Svar skrives stadig på forhånd i fanen Input, ét svar pr. linje. Der er ikke tilføjet interaktiv indtastning direkte i terminalen.

`SE_TESTEN.html` viser designet. Python kræver den installerede udvidelse eller en lokal udviklerserver; det kan ikke køres i en HTML-fil åbnet med dobbeltklik.

## Kontroller

- Den konkrete fejl blev genskabt: browsergrenen forsøgte at hente `https://invalid.local/pyodide.asm.wasm`, selv om WASM-bytes var medsendt.
- `workbench-bootstrap.cjs` kører den faktiske worker og uændrede Pyodide-moduler i en Node-VM uden Node-globale variable. Den rammer runtimeens browsergren og tillader kun læsning af lokale test-blobs. Prøverne dækker opstart, udskrift, Unicode, delvise linjer, stderr, input, traceback, ingen udskrift, opgavetest, JavaScript, SQLite og fejl i sandboxens workerstart.
- `test27.cjs` sender resultatet fra en rigtig Python-kørsel i samme VM frem til JSDOM-terminalen og kontrollerer startbesked, fejl, gentagelse og tom udskrift.
- Hele den eksisterende testsamling køres også. Se `tests/TEST27_RESULTATER.txt` i ZIP-filen.

Disse kontroller er ikke en liveverifikation af extension-CSP, installation eller visuel visning i Chrome/Edge. Afprøv testpakken i browseren inden release.

Teknisk reference: [Pyodides JavaScript-API](https://pyodide.org/en/stable/usage/api/js-api.html) og [standardstrømme](https://pyodide.org/en/stable/usage/streams.html). Den medfølgende versions kildekode er grundlaget for indlæsningsrettelsen.
