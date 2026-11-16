# LectioPlus+ – Test 18

## En anden motor til dansk tegnsætning

Den tidligere hjælp byggede på korte ordlister og sætningsmønstre. Den kunne
rette udvalgte eksempler, men stadig sætte punktum midt i en ledsætning eller
overse indskud, sammenligninger og nye ord.

**Dansk sprogmodel · lokal** er nu standard. Den medfølgende model vurderer
ordene i sammenhæng. Supplerende kommaregler hjælper ved tvivlsomme beslutninger,
når både sætningsmønstret og modellens sandsynligheder støtter et komma.
Regelmotorens gættede punktummer bruges ikke af denne kombination.
Der er ingen AI-chat, ekstern behandling, konto eller
API-nøgle. Modellen fylder cirka 22 MB; runtime og tokenizer følger også med.
Hele pakken er derfor større end de tidligere tests.

- **Ret komma og punktum** giver en redigerbar version med ét klik.
- **Eksisterende tegn** kan vurderes på ny eller bevares. Standard er at
  vurdere kommaer og punktummer på ny, så tidligere fejl kan fjernes.
- Originalen bliver stående. Visningen kan kopieres, indsættes og fortrydes.
- **Se og vælg ændringer** viser før/efter. Svagere modelbeslutninger markeres
  med **Tjek ekstra**. Det er ikke en markering af alle mulige fejl: modellen
  kan også overse et manglende tegn eller være sikker på et forkert forslag.
- Stop eller ændring af teksten afbryder arbejdet. Et forsinket svar må ikke
  erstatte ny tekst. Modelfejl vises; den gamle motor overtager ikke automatisk.
- **Enkle regler · begrænset** er et særskilt valg. Her findes det tidligere
  med/uden-startkomma-valg. Sprogmodellen bruger overvejende startkomma og
  tilbyder ikke en pålidelig omsætning til konsekvent kommatering uden det.

## Konkrete rettelser

Testene kontrollerer bl.a. allerede fejlrettede tekster som:

- `vi talte om hvad. Vi havde lavet` → `Vi talte om, hvad vi havde lavet.`
- `historien handlede, om en dreng. Der rejste ud i verden` →
  `Historien handlede om en dreng, der rejste ud i verden.`
- `jeg købte mere end. Jeg havde brug for` →
  `Jeg købte mere, end jeg havde brug for.`
- `jo længere. Vi kom ind i skoven desto mørkere blev der` →
  `Jo længere vi kom ind i skoven, desto mørkere blev der.`

## Stadig ikke fejlfrit

Alle **98 håndskrevne teksteksempler** matcher nu deres referencebesvarelser:

- 25 længere tekster: model alene matchede 23, kombinationen matcher 25.
  Den gamle regelmotor matchede 8 på samme 25 eksempler.
- 39 tidligere regressionseksempler: alle matcher også den nye motor.
- 34 kontrasteksempler: fx komma i `hurtigere, end jeg gjorde`, men intet
  komma i `højere end sin bror`; komma i `inden vi går`, men ikke `inden fredag`.

De to mangler før `end` og `inden` er rettet. Derudover vælges tegn nu ud fra
modellens samlede sandsynligheder for tegnene, uafhængigt af store/små
bogstaver. Modellen får derfor ikke lov at vælge komma alene på grund af
usikker kapitalisering. Stort bogstav rettes ved sætningsstart; der gættes
ikke på nye store bogstaver i egennavne og tekniske udtryk midt i teksten.

Dette er en afgrænset testsamling, delvist brugt under udviklingen. Resultatet er
ikke et uafhængigt kvalitetsmål for vilkårlig dansk tekst. Modellen kan bl.a.
vælge forkerte sætningsgrænser, overse kommaer, sætte et forkert spørgsmålstegn
eller kapitalisere forkert. **Gennemlæs altid resultatet.** Der udføres ikke
stavekontrol eller fuld grammatikkontrol, og der loves ikke 100 % korrekthed.

Ord tilføjes/fjernes ikke. Maksimum er 12.000 tegn. Afsnit og linjeskift
bevares. Talnotation, kendte forkortelser, links, mailadresser, filnavne,
afgrænsede citater og kode i backticks beskyttes. Beskyttede passager rettes
derfor heller ikke indvendigt. Spørgsmålstegn, udråbstegn, kolon, semikolon
og parenteser, der allerede står i teksten, bevares. Modelgrænser og
bevarelse af tegn kan stadig give uheldig tegnsætning omkring disse passager.

## Installation og demo

Kopiér **hele** den nye `extension`-mappe til din eksisterende installationssti,
inklusive `vendor`-mappen. Genindlæs udvidelsen i Chrome/Edge og derefter
Lectio-fanen. Se `START_HER.txt`. Der kræves intet internet til tegnsætningen.

`SE_TESTEN.html` viser de øvrige funktioner og den nye brugerflade, men en
dobbeltklikket fil kan ikke indlæse modellens worker. Den forklarer derfor,
at modellen skal prøves i udvidelsen. Udviklere kan alternativt køre
`python3 -m http.server 8765` fra pakkens rod og åbne
`http://localhost:8765/preview/index.html#lxp-tools/punctuation`.

Alle rettelser og funktioner fra Test 17 er bevaret, inklusive molekylnavne,
fagnoter, lektieikoner, indstillinger og de øvrige 54 værktøjer.

## Teknisk kontrol og kilder

**1.855 automatiske kontroller i 26 testsuiter er bestået.** De 98
tekstregressioner indgår i modelkontrollen; de er ikke en garanti for alle tekster.

De nye tests kører de faktiske modelvægte med den medfølgende WASM-runtime,
og den faktiske worker testes i Node med lokal filadgang. De kontrollerer
også tokenizer mod 232 referencekodninger, lange tekster og overlappende
vinduer, tegnbeskyttelse, gentagen rettelse, tidsgrænser, afbrydelse,
afsenderkontrol, private kanaler, output efter tekstændring og kopiér/fortryd.
Ord, inputrækkefølge og linjeskift må ikke gå tabt.

Hele testloggen følger med som `tests/TESTRESULTATER.txt`. Fremtidige sproglige
afvigelser udskrives som `REVIEW` og får den pågældende regressionstest til at fejle.
DOM-tests og
Node/WASM-test er ikke en visuel Chrome/Edge-test eller en indlogget
Lectio-test. Browserens udvidelsesindlæsning/CSP er endnu ikke afprøvet live.

- Model: [syvai/danish-pnc](https://huggingface.co/syvai/danish-pnc), fast
  revision `ac67b2ffcab409b069e759de8389e93ca25bdb14`, CC BY 4.0.
- Runtime: [ONNX Runtime Web](https://github.com/microsoft/onnxruntime/tree/v1.22.0), 1.22.0, MIT.
- Kildeangivelser, licenser og filhashes: `extension/vendor/punctuation/`.
- Reference for kommatering: [Sproget.dk](https://sproget.dk/typiske-problemer/komma/)
  og [Retskrivningsordbogen § 50](https://ro.dsn.dk/?paragraf=50&type=rulesearch).

Ingen GitHub-push, release eller ændring af manifestets udgivelsesversion.
