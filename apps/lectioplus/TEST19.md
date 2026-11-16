# LectioPlus+ – Test 19

## Punktum midt i en sammenhængende sætning

Test 18 kunne skrive følgende i det lange morgenafsnit:

> … fordi jeg stadig var meget træt. Efter en lang weekend, hvor jeg havde været sammen med mine venner og lavet en masse forskellige ting.

Test 19 giver i samme afsnit:

> … fordi jeg stadig var meget træt efter en lang weekend, hvor jeg havde været sammen med mine venner og lavet en masse forskellige ting.

Den efterfølgende del er her et præpositionsled med en relativsætning,
ikke en selvstændig helsætning. En afgrænset kontrol kan nu tilsidesætte
modellens usikre punktumforslag i denne type tilfælde. Den retter også det
allerede indsatte `træt. Efter` til `træt efter`, når eksisterende tegn må
vurderes på ny, og store begyndelsesbogstaver må rettes.

Kontrollen er ikke en fuld grammatisk analyse: den undlader at ændre
grænsen, hvis den finder tegn på en ny helsætning, beskyttet indhold eller
et punktumforslag med modelsandsynlighed på mindst 0,9. Sandsynligheden er
modellens vurdering, ikke et bevis på korrekthed. Eksempelvis bevares:

> Jeg var træt. Efter en lang weekend var jeg nødt til at stå tidligt op.

## Linjeskift og sammenligninger

Et enkelt linjeskift deler ikke længere teksten i to uafhængige
modelkørsler. `jeg tror\nat du kommer` bliver dermed
`Jeg tror,\nat du kommer.` Linjeskiftet bevares, og tomme linjer deler
fortsat teksten i afsnit. Modellen kan stadig foreslå en reel
sætningsgrænse ved et linjeskift ud fra indholdet.

Den særskilte metode **Enkle regler · begrænset** genkender nu også `end`
som ledsætningsindleder i sammenligninger. Det modvirker fejlen
`mere end. Jeg havde regnet med`. Den lokale sprogmodel håndterede allerede
det testede sammenligningsafsnit korrekt.

## Afprøvning og grænser

- 1.873 automatiske kontroller fordelt på 26 testsuiter består.
- De tidligere 98 teksteksempler og 14 nye eksempler matcher deres
  manuelt gennemgåede referencebesvarelser. De nye eksempler omfatter
  hele fejlramte afsnit, allerede forkert tegnsætning, korrekte
  sætningsgrænser samt enkelte og dobbelte linjeskift.
- Den faktiske lokale worker med WASM og model er kørt, også på det lange
  afsnit. Der kontrolleres desuden gentagen rettelse og bevarede linjeskift.
- Testsamlingen er delvist brugt under udvikling og måler ikke kvaliteten
  på vilkårlig dansk tekst. Andre forkert placerede eller manglende tegn
  kan stadig forekomme. Gennemlæs resultatet.
- Der er ikke udført visuel browserkontrol eller test på en indlogget
  Lectio-side i denne omgang.

Modellens vægte er uændrede. Teksten behandles stadig lokalt uden konto,
API-nøgle eller ekstern tegnsætningstjeneste. Se [TEST18.md](TEST18.md)
for modellens licens, beskyttede teksttyper og øvrige begrænsninger.

## Installation

Følg `START_HER.txt` i testpakken. Kopiér hele `extension`-mappen, inklusive
`vendor`, til den eksisterende installationsmappe. Genindlæs udvidelsen og
Lectio-fanen. Vælg **HjælpeMiddler → Komma og punktum → Dansk sprogmodel · lokal**.
Lad **Vurder kommaer og punktummer på ny** være valgt for at fjerne et
allerede forkert punktum. HTML-demoen kan kun køre de enkle regler;
den nye model kræver udvidelsen eller en lokal webserver.

Pakken er til test. Ingen versionsforhøjelse, GitHub-push eller release.

Grammatisk baggrund:
[Punktum](https://sproget.dk/typiske-problemer/punktum/) og
[Kommagrammatik](https://sproget.dk/typiske-problemer/komma/kommagrammatik/)
hos sproget.dk.
