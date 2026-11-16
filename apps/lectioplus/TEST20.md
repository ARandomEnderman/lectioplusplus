# LectioPlus+ – Test 20

## Indlæsningen af sprogmodellen

Den rapporterede besked, “Indlæser den lokale sprogmodel… Din tekst sendes
ikke til en server”, blev vist før forbindelsen til modellen var klar.
Den kunne derfor ikke fortælle, om fejlen lå i forbindelsen, indlæsningen
af filer eller opstarten af beregningsmotoren.

I den installerede udvidelse bruger forbindelsen nu browserens
`chrome.runtime.connect` mellem Lectio-scriptet og udvidelsens lokale
modelvindue. Den er ikke længere afhængig af `window.postMessage` mellem
disse to forskellige scriptmiljøer. Et tilfældigt forbindelses-id kobler
anmodningen til det rigtige vindue; browserens afsenderoplysninger
kontrolleres. Dette kræver ingen nye tilladelser eller server.

Den gamle lokale webdemo bruger stadig en MessageChannel, begrænset til
samme localhost-oprindelse. En dobbeltklikket HTML-fil kan fortsat ikke
køre sprogmodellen.

## Synlig fremdrift og fejl

- Status viser forbindelse, worker-opstart, orddeling, modelfil og
  beregningsmotor som særskilte trin. Antal sekunder opdateres undervejs.
- Forbindelse og worker-opstart har hver en grænse på 15 sekunder.
  Indlæsning har en samlet grænse på 60 sekunder fra workerens første
  indlæsningsbesked. Tekstbehandlingen har derefter en grænse på 120 sekunder.
- Afbrudt forbindelse, manglende modelfiler og fejl i beregningsmotoren
  giver forskellige fejlbeskeder. Gentagne statusbeskeder kan ikke
  forlænge indlæsningen uendeligt.
- Stop og timeout lukker forbindelsen og modelvinduet. Arbejdet kan
  prøves igen uden at miste originalteksten. En fejl skifter ikke
  automatisk til den gamle regelmotor.
- Modelfilen læses eksplicit som lokale bytes før motoren starter,
  så en manglende fil kan skelnes fra fejl i selve motoren.

## Afprøvning

Den samlede suite består: **1.903 kontroller i 27 testsuiter**. De 112
afgrænsede teksteksempler fra Test 19 matcher fortsat deres referencer.

`tests/punctuation-startup.cjs` kører de faktiske klient- og framescripts
sammen med en simuleret browser-API. Den kontrollerer bl.a. den nye
kanal, forkert afsender, samtidige anmodninger, timeout, Stop, afbrudt
forbindelse og nyt forsøg efter fejl.

`tests/punctuation-transport.cjs` kører den faktiske worker og
WASM-model. Manglende tokenizer- og modelfiler afprøves også, uden at
ændre de medfølgende filer. UI-testen kontrollerer status, sekundtæller,
synlig fejl og genaktivering af knapperne.

Dette er ikke liveverifikation i brugerens Chrome/Edge eller på en
indlogget Lectio-side. Den præcise årsag i brugerens browser er ikke
bekræftet. Rettelsen fjerner den tidligere forbindelse mellem
scriptmiljøerne og gør eventuelle resterende startfejl synlige.

Tegnsætningsrettelserne fra Test 19 følger med. Modellen er fortsat
fejlbarlig; læs [TEST19.md](TEST19.md) og [TEST18.md](TEST18.md).

## Installation

Kopiér alle filer fra testens `extension`-mappe ind i den mappe, der
allerede er installeret. Tag hele `vendor`-mappen med. Tryk derefter
**Genindlæs** for LectioPlus+ på `chrome://extensions` eller
`edge://extensions`, og genindlæs også **Lectio-fanen**. Begge trin er
nødvendige, så klienten og modelvinduet bruger samme udgave.

Prøv **HjælpeMiddler → Komma og punktum → Dansk sprogmodel · lokal**.
Hvis den stadig fejler, er den nye besked og det sidste indlæsningstrin
relevante for fejlsøgningen. Originalteksten behøver ikke deles.

Testpakken blev først leveret uden push eller release. Ændringerne er
derefter klargjort til GitHub som del af v0.1.3 efter brugerens anmodning.

Teknisk reference:
[Chrome runtime.connect](https://developer.chrome.com/docs/extensions/reference/api/runtime#method-connect),
[beskedkanaler](https://developer.chrome.com/docs/extensions/develop/concepts/messaging)
og [postMessage i udvidelser](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage#using_window.postmessage_in_extensions).
