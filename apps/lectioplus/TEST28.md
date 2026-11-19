# Test 28 – Kodeværkstedets opstart

Test 27 rettede en konkret fejl i Python-indlæserens WASM-adresse. Den efterfølgende melding om en timeout på 60 sekunder viser, at det ikke var tilstrækkeligt i brugerens browser. Den gamle timeout oplyste ikke, hvilket opstartstrin der var stoppet; den beviste ikke, at der manglede filer.

Denne test ændrer opstarten og gør fejlene sporbare. Manifestversionen er fortsat 0.1.3. Ingen push eller release.

## Ændringer

- Det isolerede vindue har nu startscriptet indbygget. Det behøver ikke hente et ekstra script gennem en `script-src 'self'`-regel i det isolerede miljø. Begge CSP-politikker tillader kun det præcise scripts SHA-256-hash samt lokale blobs og den allerede tilladte evaluering inde i sandboxen. Udvidelsens almindelige CSP, netværksbegrænsning og isolation er bevaret.
- Host, sandbox og worker bruger en klar-besked. Programmet sendes først, når modtageren er klar. Forskellige protokolversioner giver en synlig fejl med det samme.
- Manglende filer, en blokeret sandbox, en worker der ikke starter og en runtime der hænger har særskilte tidsgrænser og fejlkoder. Gentagne statusbeskeder forlænger ikke tidsgrænserne.
- Python kontrollerer WASM-filen før indlæsningen. En fejl under WASM-instansiering sendes tilbage, selv om Pyodides interne indlæser ellers opsnapper fejlen og efterlader et uafsluttet løfte.
- Terminal og statuslinje viser opstartstrinene. Den generelle besked, som uden bevis bad brugeren kontrollere vendor-mappen, er erstattet af den konkrete fejl eller det sidste kendte trin.
- Afbrudte filhentninger annulleres. Et forsinket svar fra en tidligere kørsel kan ikke rydde den nye kørsel ved et nyt forsøg.

## Afprøvning

1. Pak hele ZIP-filen ud, og kopiér hele `extension`-mappen til den mappe, som din eksisterende installation bruger. Både `manifest.json`, HTML-filer, JavaScript og `vendor` skal med.
2. Genindlæs udvidelsen på `chrome://extensions` eller `edge://extensions`, og genindlæs derefter Lectio-fanen. Hav kun én udgave aktiveret.
3. Åbn Hjælpemidler → Kodeværksted → Python → Fri kode. Kør `print("Hej")`.
4. Hvis det stadig fejler, kopiér terminalens fejl, inklusive koden `LXP28-...`. Den viser, hvor fejlen skal undersøges.

| Fejlkode | Betydning |
| --- | --- |
| `LXP28-VERSION` | Opstartsfilerne bruger forskellige protokolversioner |
| `LXP28-FIL` / `LXP28-FILER` | En konkret fil mangler, eller en filhentning hænger |
| `LXP28-SANDBOX` | Det isolerede vindues script melder ikke klar |
| `LXP28-WORKER` | Programprocessen kunne ikke starte eller melde klar |
| `LXP28-KANAL` / `LXP28-OVERFØRSEL` | Beskeder mellem processerne kunne ikke overføres |
| `LXP28-RUNTIME` | Python/SQLite kunne ikke færdiggøre sin opstart; detaljen er med |
| `LXP28-FORBINDELSE` / `LXP28-TIMEOUT` | Forbindelsen til kodeværkstedet svarer ikke; sidste trin er med |

Python skal prøves i den installerede udvidelse. `SE_TESTEN.html` er en designprøve og kan ikke køre Python ved dobbeltklik. Svar til `input()` skrives stadig før kørsel i fanen Input.

## Kontroller og begrænsninger

`test28.cjs` kontrollerer det indbyggede script og begge CSP-hashes, klar-beskeder, blandede versioner, præcise tidsgrænser, manglende filer, annullering, forældede svar og fejl under WASM-kompilering og instansiering. Python og JavaScript køres gennem hostens og sandboxens faktiske kode med simulerede browserkanaler og den medfølgende runtime i Node-VM. De eksisterende runtime-, terminal- og øvrige funktionstests er også med.

Dette er ikke en test af Chromes/Edges faktiske CSP-håndhævelse eller en liveinstallation på Lectio. Den præcise årsag til den rapporterede timeout er ikke fastslået i brugerens browser. Den indbyggede bootstrap fjerner en mulig blokering, mens fejlkoderne gør eventuelle resterende fejl konkrete.

Ved ændring af `extension/workbench-sandbox.js`: kør `node tests/sync-workbench-sandbox.cjs` fra `apps/lectioplus` og medtag den opdaterede HTML og manifest. Begge genererede filer ligger i pakken, så brugeren ikke skal bygge noget.

Referencer: [Chrome: sandbox](https://developer.chrome.com/docs/extensions/reference/manifest/sandbox) og [CSP: hashes og kildebegrænsninger](https://www.w3.org/TR/CSP3/). Referencerne beskriver mekanismen; de er ikke dokumentation for, hvilken fejl brugerens browser oplevede.
