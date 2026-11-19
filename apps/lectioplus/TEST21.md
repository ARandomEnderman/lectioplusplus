# Test 21 — HjælpeMidler og indhold i skemaet

Testversion oven på 0.1.3. Ingen ny offentlig release.

## HjælpeMidler

- Startsiden viser fem faggrupper og seks genveje. Dine favoritter vises først.
- Alle 54 værktøjer er stadig tilgængelige via faggrupper, søgning og **Vis alle værktøjer**.
- Søgningen bruger også opgaveord, fx `dansk komma`, `oversaet` og `molekylevægt`. Flere søgeord kan kombineres. En søgning uden resultater i et fag kan udvides til alle fag.
- Alle værktøjer har en kort brugsvejledning. De nye vejledninger og navigationstekster følger dansk/engelsk-indstillingen. Den øvrige oversættelsesdækning er fortsat delvis.
- Mellemregninger kan foldes ud. Gemmefunktioner ligger efter beregningsværktøjet og skjules, hvor de ikke er relevante.
- Indtastede værdier bevares ved skift mellem værktøjer i samme åbne side. Eksisterende funktioner til gemning af noter og opsætninger er uændrede.
- Kataloget tilpasser antal kolonner til skærmbredden og bruger det valgte temas farver.

## Skema

Et lille dokumentikon markerer lektioner, hvor kildesiden har Lectios `sms`- eller `bookmark`-ikon. Dagslisten viser også teksten **Indhold**. Hold musen over lektionen eller fokusér den med tastaturet for at se forklaringen. Klik åbner den oprindelige lektion.

Markeringen viser, at der er tilknyttet indhold; den skelner ikke mellem en note, lektier og materiale og betyder ikke, at en opgave er ulæst eller færdig. Tidspunkt, lokale, lærer eller ord i lektionens titel udløser ikke markeringen. Skjulte og ukendte ikonvarianter bruges ikke som bevis på indhold.

Der hentes ingen ekstra lektionssider, og der gemmes ingen skemadata. Markeringen opdateres, når Lectio ændrer ikonernes indhold. Kortene får ikke ekstra højde i ugevisningen. Tider, pauser og ugeskift bevares.

## Prøv testen

1. Pak ZIP-filen ud, og åbn **SE_TESTEN.html** for en demo med fiktive data. Start ved HjælpeMidler, og prøv også Skema. Torsdag indeholder eksempler med og uden markering.
2. Til test på Lectio: Kopiér hele den nye `extension`-mappe ind i den mappe, du allerede har installeret. Behold samme placering og tag eventuelt først en indstillingsbackup.
3. Tryk **Genindlæs** på udvidelsen i `chrome://extensions` eller `edge://extensions`, og genindlæs derefter Lectio-fanen.
4. Ved ny installation: Aktivér Udviklertilstand, vælg **Indlæs udpakket**, og vælg `extension`. Hav kun én udgave aktiveret. En anden installationssti kan give separate indstillinger.

Hele `vendor`-mappen skal med. Den lokale tegnsætningsmodel kan ikke køre i en demo åbnet direkte som `file://`; brug den installerede udvidelse til det. Beregningsmotorerne og sprogmodellen er ikke ændret i denne test.

## Kontroller

`npm ci && npm test` fra `apps/lectioplus/tests`.

Alle **2.066 kontroller i 28 testsuiter** består, heraf 162 i `test21.cjs`. De nye kontroller omfatter ikonvarianter, manglende/skjulte markeringer, opdatering af skemaet, korte lektioner, dagsliste, oprindelige links, søgning, fagfiltre, favoritter, sprog og bevarelse af indtastede værdier. De øvrige tests kontrollerer eksisterende beregninger, navigation, indstillinger, noter og den lokale model.

Kontrollerne bruger fiktive data og simuleret browser-DOM/API. Sprogmodellens eksisterende test kører desuden den faktiske WASM/model. Layoutet og markeringerne er ikke liveverificeret på en indlogget Lectio-side; testen er beregnet til din afprøvning i Chrome/Edge.
