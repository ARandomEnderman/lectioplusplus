# Test 30 – Klassisk worker i kodeværkstedet

Efter Test 29 nåede opstarten forbi det isolerede vindue og gav i stedet: `Kodeværkstedet kunne ikke starte: Browseren kunne ikke indlæse programprocessen. [LXP28-WORKER]`.

Beskeden kommer fra sandboxens asynkrone worker-fejlhændelse, hvor browseren ikke har givet en nærmere fejltekst. Sandboxens script kører altså nu. En dokumenteret Chromium-fejl rammer netop den tidligere kombination: `new Worker(blobURL, {type: 'module'})` i et vindue med opaque origin. Web-platform-tests har en regressionstest for denne browseradfærd. Det er en stærk forklaring på symptomet, men den konkrete installation er ikke liveverificeret her.

## Rettelse

- Kodeværkstedets proces starter som en klassisk worker. Indgangsfilen har ingen statiske modulimporter; Python-modulerne indlæses fortsat med dynamisk `import()` efter opstarten.
- Indgangsfilen har eksplicit strict mode, så skiftet fra modul til script bevarer denne del af JavaScripts opførsel.
- De præcise CSP-hashes i HTML og manifest er opdateret til startscriptets nye indhold. Isolationen, netværksbegrænsningen, worker-tidsgrænserne og de medfølgende vendor-filer er bevaret.
- Worker-fejl fra den nye sandbox har koden `LXP30-WORKER`. De øvrige trin beholder deres tidligere koder.

## Installation

1. Pak hele ZIP-filen ud, og kopiér hele `extension`-mappen til den mappe, som den eksisterende installation bruger. Tag især `manifest.json`, `workbench-sandbox.html`, `workbench-sandbox.js` og `workbench-worker.js` med.
2. Genindlæs LectioPlus+ på `chrome://extensions` eller `edge://extensions`.
3. Genindlæs derefter Lectio-fanen. Hav kun én udgave af LectioPlus+ aktiveret.
4. Åbn Hjælpemidler → Kodeværksted → Python → Fri kode, og kør:

```python
print("Hej fra Python!")
print(2 + 3)
```

Prøv også en anden kørsel og JavaScript med `console.log(2 + 3)`. Terminalen skal vise resultatet. Svar til `input()` skrives stadig i fanen Input før kørsel.

Hvis noget stopper, send terminalens fejlkode og fejltekst. `SE_TESTEN.html` er fortsat en designprøve; Python kræver den installerede udvidelse.

## Kontroller og begrænsninger

Den nye regressionstest modellerer, at browseren accepterer Worker-konstruktøren, men senere udsender en tom fejlhændelse for modul-workers. Den faktiske indgangsfil parses og startes som et klassisk script. Python, JavaScript, SQLite og regex køres med den eksisterende VM-hjælper og de medfølgende runtimes. Den kontrollerer også output, anmodnings-id, oprydning og bevarede begrænsninger. Hele den eksisterende suite køres desuden.

Dette er automatiske kontroller i Node/VM, ikke en liveprøve af Chrome/Edge eller Lectio. Browserens oprindelses- og CSP-håndhævelse er ikke genskabt af testen. Testen skal derfor stadig prøves i installationen før release.

Manifestversionen er fortsat `0.1.3`. Ingen GitHub-push eller release.

## Kilder

- [Web-platform-tests: module workers fra blob-URL'er i isolerede iframes](https://github.com/web-platform-tests/wpt/pull/64316).
- [Primær fejlrapport med sammenligning af klassiske workers og modul-workers](https://github.com/maplibre/maplibre-gl-js/issues/8909).
- [Web-platform-tests: dynamiske importer fra klassiske workers](https://chromium.googlesource.com/external/github.com/web-platform-tests/wpt/+/refs/tags/merge_pr_53505/workers/modules/dedicated-worker-options-credentials.html).
