# Test 24 – kodeværksted, flere fagværktøjer og egne faner

Dette er en testpakke baseret på Test 23. Manifestversion 0.1.3 er bevaret; ingen push, tag eller release er foretaget.

## Kodeværksted

HjælpeMiddler → Programmering → Kodeværksted indeholder lokal CPython 3.14 via Pyodide, JavaScript, HTML/CSS-forhåndsvisning og SQLite. Python er standardsprog. Kør, Stop, fejl med linjenummer, gem/download, indlæs `.py` og kodeceller fra `.ipynb`, valgfrie kodefarver, linjenumre, skriftstørrelse, mørk/lys editor og linjeombrydning er med. Notebook-output og markdown importeres ikke, og importeret kode køres aldrig automatisk.

`input()` læser svar fra feltet »Svar til input()«: ét svar pr. linje inden kørsel. Det er ikke en interaktiv terminal, hvor man skriver undervejs. Python-standardbiblioteket følger med. Der er ingen pip-installation, eksterne pakker, netværk, desktopvinduer eller adgang til computerens almindelige filer. Koden kører som et program i browseren; der bygges ikke en Windows-EXE.

Fri kode og opgaver er separate. Fem niveauer har hver 25 originale opgaver:

| Niveau | Indhold |
|---|---|
| 1 | Tal, variabler, input, konvertering, strenge, f-strings, booleans og None |
| 2 | Betingelser, løkker, simple listeopgaver og validering |
| 3 | Funktioner, dictionaries, lister, CSV, JSON og tekst |
| 4 | Små algoritmer, robuste input, matricer, søgning og en klasse |
| 5 | Rekursion, dynamisk programmering, grafer, træer og afgrænset parsing |

Hver opgave har startkode, eksempel, hints og tre testtilfælde. Bestået status gemmes lokalt. Testtilfælde kontrollerer konkrete resultater; de er ikke et bevis for alle input og kontrollerer ikke, at en bestemt algoritme eller kodestil er anvendt. Introduktionsniveauet følger de gennemgåede undervisningsemner; private undervisningsfiler og elevløsninger er ikke med i pakken.

Variabelvisningen optager op til 300 linjetrin med et begrænset udvalg af lokale værdier. Den er en afspilning efter kørsel, ikke en fuld debugger med breakpoints.

## Fagværktøjer

Kataloget har 126 indgange: alle 54 tidligere værktøjer plus 72 nye. Fag har underkategorier. De tidligere 60 idéer er dækket af følgende indgange; nogle idéer er samlet, og molarmasseområdet er udvidet yderligere.

| Område | Nye muligheder |
|---|---|
| Matematik | Lineære ligninger og uligheder, omstilling af udvalgte formler, polynomiers afledte/integraler, SSS/SAS/ASA-trekanter, 3D-vektorer, tre regressionstyper med residualer, normalfordeling og sandsynlighedstræ |
| Kemi | Atombygger med grundstofnavn, Lewis-bogføring for seks molekyler, orbitaler H–Ca, oxidationstal, katalogbaseret redoxbalance, enprotonede syrer/baser/buffere, titrering, A+B⇌C-ligevægt, fældning og ti organiske stofgruppeeksempler |
| Molarmasse og opløsninger | Elementernes masseprocent, empirisk formel, molekylformel fra molarmasse, hydrat, densitet/masseprocent, blanding, molalitet/molbrøk, ppm/ppb, gasmasse/-volumen, udbytte/renhed og C/H/O-forbrændingsanalyse |
| Fysik | Kræfter, skråt kast, bevægelsesgrafer, energifordeling, interferens, linser/spejle, opvarmning/smeltning, RC-kredsløb og sammensatte serie-/parallelgrupper |
| Biologi | Étgens-arvelighedsskema, DNA/RNA/protein, enkeltbasemutationer, celleoversigt, Michaelis–Menten og eksponentiel/logistisk vækst |
| Sprog og opgaver | Enkel kildehenvisningsbygger, flytbare opgaveafsnit, citatbank, fire danskfaglige analyseskabeloner, syv engelske tider, bestemt artikel i tysk kasus, egne gloser og tekstdiff |
| Programmering | Kodeværksted, flytbart flowchart, logik/sandhedstabel, bitmodel, regex og SQLite-øvelser |
| Studieteknik | Afleveringstjek, egne eksamensspørgsmål, fremlæggelsestimer, emneoverblik, fejlbog, mindmap, tidslinje, OCR, CSV-import, overførsel mellem beregninger, fagnoter og værktøjsvælger |

Faglige modeller har afgrænsninger i visningen. Eksempelvis er formelomskriveren ikke en generel CAS, integralværktøjet tager polynomier, redoxværktøjet afstemmer valgte halvreaktioner uden at forudsige spontanitet, og fældningsværktøjet kræver Ksp fra brugerens tabel. Ved skift af salt ryddes Ksp, så en konstant fra et andet stof ikke genbruges. Fælles antagelser om idealitet, temperatur og enheder vises med resultaterne.

Atombyggeren navngiver grundstoffet ud fra protonerne. Ringene er en skematisk partikeloversigt, ikke elektronernes fysiske baner eller en korrekt skalfordeling. Orbitalværktøjet er den separate visning af grundtilstandsfordeling for H–Ca. Celler, stråler og kredsløbsgrupper er undervisningsskitser. Engelsk/tysk er afgrænsede øvelsesoversigter, ikke en fuld grammatikmotor. Referencer bruger en enkel form, ikke en komplet APA-/Harvard-processor. Fagnoter understøtter overskrifter, tabelrækker, almindelig formeltekst og indsatte beregningsark; der er ikke en LaTeX-editor.

OCR bruger lokal Tesseract med dansk og engelsk. Maks. 10 MB/16 megapixel. Trykt tekst er målgruppen; håndskrift, formler og tabeller kræver manuel kontrol. Kun det eksisterende oversættelsesværktøj sender sin indtastede tekst til oversættelsestjenesten.

## Egne faner

Indstillinger → Menuer → Mine egne faner: op til 20 navne, http(s)-links og ikoner fra ikonlisten eller eget emoji. Redigér, slet, flyt med pile/drag og vælg samme eller ny browserfane. De vises i gruppen Mine links og følger med i backup. Links med brugernavn/adgangskode eller andre URL-protokoller afvises. Dette er genveje til sider, ikke en indbygget browser med universel iframe-understøttelse.

## Lagring og kørsel

Brugerens egne kladder og indstillinger gemmes i udvidelsens lokale lager. Gem-knapper er eksplicitte. Der indsamles ikke Lectio-data til kodeværkstedet. Arbejdsområder er begrænset til 100.000 tegn hver og 2.500.000 tegn samlet; en for stor ny lagring afvises med besked, så den åbne kladde kan eksporteres. Backup kan indeholde brugerens egne noter og kode.

Installeret programkørsel bruger en tokenbeskyttet extension-port til en lokal vært og en separat sandbox uden samme origin. Kode kører i en worker; Stop fjerner dens ejer, og en kørsel afbrydes efter 10 sekunder. Opstart har separate tidsgrænser. Sandboxens CSP blokerer netværk. Python/SQL/regex har ingen adgang til Lectio-DOM eller extension-API. HTML/CSS-visningen blokerer scripts og eksterne ressourcer. Eksisterende tegnsætningsfiler og model er uændrede.

## Prøv pakken

1. Pak hele ZIP-filen ud. `SE_TESTEN.html` viser layout med fiktive data og starter i kodeværkstedet.
2. For rigtig Python/OCR/SQLite/regex-kørsel: kopiér hele `extension` til den eksisterende udvidelsesmappe; behold stien, så indstillingerne bevares. Genindlæs udvidelsen og Lectio-fanen. Ved ny installation vælges **Indlæs udpakket** i browserens udvidelser.
3. Åbn Python → Fri kode, udfyld inputfeltet, og kør eksemplet. Prøv derefter opgaver, fejl, Stop og import af egen `.py`.
4. Prøv Kemi → Byg et atom, skift protoner og kontrollér grundstofnavnet. Prøv flere beregningsmodeller med egne tal/enheder.
5. Tilføj, redigér og flyt en genvej under Indstillinger → Menuer. Tag en backup og kontrollér genvejen ved import.

En direkte file://-demo kan ikke starte runtime-værktøjerne. Alternativt kan udviklere servere pakken over localhost. Installeret Chrome/Edge, sandbox-CSP, mobil-layout og indlogget Lectio er ikke liveverificeret i denne arbejdsgang. De skal kontrolleres i brugerens browser før release.

## Automatiske kontroller

`cd apps/lectioplus/tests && npm ci && npm test` omfatter eksisterende regressionskontroller samt:

- Alle 72 nye paneler og 125 opgavevalg i JSDOM, CodeMirror-initialisering, gemning og sidebjælke-redigering.
- Uafhængige regneeksempler, domænefejl, masse-/ladningsbalance for redoxkombinationerne, Lewis-elektrontal, DNA-kode, logik og CSV.
- Rigtig lokal Python-WASM: alle 375 referencecases, fejl, input, variabelspor og afvisning af forkerte svar. Lokal SQLite-WASM er også kørt.
- Simuleret transport: afbrydelse, opstartstidsgrænse, timeout, samtidige kald, afvisning af forkerte afsendere og asset-hashes.

Supplerende lokal OCR-smoketest læste et genereret dansk/engelsk testbillede med de medfølgende sprogdata. Dette er ikke en test af browserens worker/CSP. Testresultater er teknisk kontrol, ikke en garanti for fuld faglig eller sproglig korrekthed.

Se `tests/TEST24_RESULTATER.txt` i testpakken for det komplette kørselsresultat og `SOURCES_TEST24.md` for kilder og tredjepartsfiler.
