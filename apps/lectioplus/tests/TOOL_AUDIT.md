# Kontrol af HjælpeMiddler – Test 11

Kontrolleret 16. november 2026. Beregninger, inputgrænser og brugerforløb testes med fiktive data. Tabellen beskriver den faktiske dækning; den er ikke en garanti for fejlfrihed ved alle tænkelige input.

## Matematik

| Værktøj | Kontrolleret eksempel/adfærd | Afgrænsning |
|---|---|---|
| Klassisk lommeregner | 2+3×4=20; 200+10%=220; 200×10%=20; gentaget =, fortegn, ryd, division med nul, tastatur | Regner sekventielt, viser op til 15 betydende cifre. |
| Lommeregner | Regnearternes rækkefølge, parenteser, negative potenser, grader/radianer, fakultet, komma | Reelle tal. % betyder /100. x hører til graftegneren. |
| Ligninger | To rødder, dobbeltrod, komplekse rødder, lineær ligning, nulkoefficienter, store/små skalaer | Ingen symbolsk omskrivning. Ekstreme tal kan afvises. |
| To ligninger | (x,y)=(4,2); proportionale decimalkoefficienter; ingen/uendeligt mange løsninger | Koefficienter fortolkes som de indlæste decimaltal. |
| Brøker | 100/−250 = −2/5 = −0,4; fortegn og forkortning | Heltal inden for JavaScripts sikre heltalsområde. |
| Procent | 12,5% af 240=30; fald til 210; 80→100 giver 25% | Procentvis ændring kræver positiv førværdi. |
| Vækst og rente | 200 med 10% i 2 perioder = 242; 0 perioder bevarer startværdi | Fast procent, ingen indbetalinger/gebyrer. |
| Statistik | Median, kvartiler, population/stikprøve, konstant datasæt, små/store tal | Median-af-halvdele; andre programmer kan have anden kvartildefinition. |
| Lineær regression | Kendt ret linje; ikke-perfekt linje med R²=0,75; konstant y | R² er udefineret ved konstant y, ikke 1. Ingen årsagsvurdering. |
| Binomialfordeling | n=3, k=2, p=0,5 giver 37,5% og kumuleret 87,5%; randværdier | Uafhængige forsøg, samme p; n≤500. For små sandsynligheder afvises. |
| Geometri | Cirkel, rektangel, trekant, cylinder og kugle | Fælles længdeenhed; kun de relevante felter vises. |
| Retvinklet trekant | 3–4–5; areal 6; vinkler ca. 36,87° og 53,13°; alle tre indtastningstyper | To kateter, hypotenuse+katete eller vinkel+modstående katete. Vinkel mellem 0° og 90°. |
| Vektorer i planen | (3,4) og (−4,3): længder 5, prikprodukt 0, vinkel 90°; sum/differens; nulvektor | 2D; nulvektorens vinkel er udefineret. Pile bruger samme målestok. |
| Graftegner | 1/x brydes ved singularitet; g alene mærkes g; ugyldig syntaks afvises | 601 prøver pr. graf, ikke symbolsk analyse. Smalle udsving/asymptoter kan overses. |

## Kemi

| Værktøj | Kontrolleret eksempel/adfærd | Afgrænsning |
|---|---|---|
| Periodisk system | Alle 118 z/symbol/atomvægtsposter sammenlignet med CIAAW; placering uden overlap; søgning | Afrundede standardatomvægte, ikke individuelle isotopmasser. Ukendt standardvægt forbliver tom. |
| Molarmasse og ioner | H₂O, Ca(OH)₂, Al₂(SO₄)₃, CuSO₄·5H₂O; SO₄²⁻ har 50 elektroner | Parseren kontrollerer syntaks og sammensætning, ikke stoffets eksistens. Elektronmasse korrigeres ikke. |
| Byg en ionforbindelse | 50 formler kontrolleret mod PubChem; ladningsbalance; danske navne og oxidationstrin; valgfri prøvemasse og stofmængde; alle øvrige ionpar afvises | Begrænset referenceudvalg. Formler uden krystalvand; formelle ionmængder, ingen forudsigelse af reaktioner, opløselighed eller stabilitet i vand. |
| Find ioner i en formel | Atomvis opslag i de 50 referenceforbindelser, ionforhold, ladningssum og kildelink | Ukendte og ikke-minimale formler afvises; ingen automatisk navngivning af vilkårlige stoffer. |
| Afstem reaktion | Forbrænding, metal/oxid, syre/base, phosphatreaktion; atombevarelse og mindste hele koefficienter | Kun uladede formler, entydig positiv løsning. Kontrollerer ikke, om reaktionen finder sted. |
| Masse og stofmængde | 36,03 g vand = 2 mol = 1,204428152×10²⁴ formelenheder | Standardatomvægte; brugerens prøve antages at svare til formlen. |
| Koncentration | 5,844 g NaCl i 2 L opløsning giver 0,05 mol/L | Volumen er hele opløsningen; opløselighed vurderes ikke. |
| Fortynding | 12,5 mL af 2 mol/L fyldes op til 250 mL for 0,1 mol/L | Fyld op til slutvolumen. Volumener er ikke altid additive. |
| pH/pOH | Syre/base ved 0,001 mol/L; rent vand pH=7; vandets bidrag ved lav c | Idealiseret fuld dissociation ved 25°C; stærk enprotonet syre eller én OH⁻ pr. formelenhed; c≤0,1 mol/L. Ikke aktivitetstilpasset. |

## Fysik

| Værktøj | Kontrolleret eksempel/adfærd | Afgrænsning |
|---|---|---|
| Enhedsomregner | Alle ni kategorier; absolut nul i °C/K/°F; valgændringer rydder gamle resultater | Temperaturer under absolut nul afvises. |
| Bevægelse | v₀=10, a=−2, t=5 giver v=0, forskydning 25 | Konstant acceleration; forskydning er ikke total strækning. |
| Kraft og tryk | 4 kg × −3 m/s² = −12 N; 100 N / 0,2 m² = 500 Pa | Nettokraft og vinkelret kontaktkraft beregnes separat. |
| Energi | m=2, v=3, h=5, g=10 giver 9 J + 100 J | Konstant g og fælles nulniveau. |
| Elektricitet | 230 V / 46 Ω = 5 A; 1150 W i 2 timer = 2,3 kWh | Ohmsk modstand og konstante værdier. |
| Bølger | 340 m/s og 170 Hz giver 2 m | v=fλ og T=1/f; positive v og f. |
| Idealgasloven | 1 mol, 0°C, ca. 22,41397 L giver 101325 Pa | Idealgas, ikke en realgasmodel. |
| Halveringstid | 80 enheder efter tre halveringstider giver 10, dvs. 12,5% | Samme tidsenhed og eksponentiel model. |

## Sprog og studieteknik

| Værktøj | Kontrolleret adfærd | Afgrænsning |
|---|---|---|
| Tekstværktøj | Ord med tegnsætning/gentagelser, tegntælling, positiv læsehastighed | Vejledende ord/læsetid; tegn tælles som Unicode-kodepunkter. Ingen grammatikvurdering. |
| Kildekritik | Svar samles bogstaveligt; ændringer rydder gammel kladde | Skabelon med egne svar, ingen faktatjekfunktion. |
| Argumentation | Svar samles bogstaveligt; ændringer rydder gammel kladde | Ingen automatisk vurdering af sandhed/gyldighed. |
| Flashcards | Tilføj, vend, fjern, fortryd, backup; dobbeltklik giver ét kort | Højst 100 egne kort. |
| Mine noter | Gem, backup, sprogskift, konfliktværn, indtastning mens gemning pågår | Kun gemte noter overlever genindlæsning. |
| Studietimer | Indstillinger, værktøjsskift, tilbagevenden fra sidecache efter udløb | Ingen lyd/systemnotifikation. Genindlæsning nulstiller timer. |
| Læseplan | Jævn heltalsfordeling, flere dage end sider, invalidering efter ændringer | 1–100.000 enheder, 1–365 dage; ingen Lectio-kalenderændringer. |

## Kilder og reproduktion

Alle 38 værktøjsruter indgår i UI-kontrollen. Den samlede kørsel består af 1.169 beståede kontroller fordelt på 13 testsuiter. Figurer kontrolleres for sammenhæng med beregningsdata, endelige koordinater, mærkning og til/fra-indstilling. Tegninger kan være skematiske, og kurver er numerisk samplede; figuren erstatter ikke resultatets tal og modelafgrænsning.

- [CIAAW: Abridged Standard Atomic Weights 2024](https://ciaaw.org/abridged-atomic-weights.htm). Numerisk snapshot: `atomic-weight-reference.json`.
- [NIH PubChem](https://pubchem.ncbi.nlm.nih.gov/): hvert understøttet stof har et CID, et kildeopslag i `compound-reference.json` og et link i resultatvisningen. Formelopslag blev sammenlignet atom for atom, da PubChem kan bruge en anden formelrækkefølge.
- [Kemisk Forenings Nomenklaturudvalg: tabel 17](https://kemisknomenklatur.dk/kap_tab/tabeller/tabel_17.pdf) og [engelsk–dansk uorganisk nomenklatur](https://kemisknomenklatur.dk/pdf/Eng-da_uorg.pdf).
- [OpenStax Chemistry 2e: Chemical Nomenclature](https://openstax.org/books/chemistry-2e/pages/2-7-chemical-nomenclature).
- [NIST: SI-konstanter](https://www.nist.gov/si-redefinition/meet-constants). Nₐ=6,02214076×10²³ mol⁻¹; R=8,31446261815324 J/(mol·K).

Kør `npm ci` og `npm test` fra denne testmappe. Ingen beregner kalder disse kilder på brugerens vegne; referencekontrollen er en udviklingskontrol, og værktøjerne virker offline.

Alle beregninger bruger flydende tal og afrundes i visningen. De kan ikke erstatte faglig vurdering af modelvalg, kemisk realiserbarhed eller måleusikkerhed. Engelske oversættelser er delvise.

Indlæsning testes med sen/opdateret indholdsblok, fjernet app-ramme, fastlåst indstillingslæsning, sen deaktivering, udskiftet body, native dialoger og menukald. Dette er automatiske DOM-tests, ikke en visuel gennemgang af alle private Lectio-sider. De sidste skal fortsat prøves i en rigtig indlogget Chrome/Edge-session.

Skemaets ugeskift testes med forrige/næste, bestemt uge, Denne uge, tomme uger og overgang mellem uge 53 og uge 1. Lectios formular kan ligge uden for indholdsblokken. Desuden kontrolleres ældre backup, fuld tilladt mængde noter/kort, sen skoleliste, fejl ved gemning, udskiftet sidehoved og udskriftsregler for den aktuelt viste uge. Udskriftens pixel-layout er ikke verificeret.

## Tilføjelser i Test 12

17 kontroller dækker frisk opstart i manifestets scriptrækkefølge og genopretning af tema/visning, når sidens markeringer ændres. Kontrollen af manglende genopretning fejler mod Test 11 og består efter rettelsen. Valgt originalvisning og deaktivering respekteres; formularer og tekst bevares. Det beviser rettelsen af denne kodefejl, men identificerer ikke sikkert årsagen i brugerens browser.

19 kontroller dækker det særskilte lektielayout, afsnit og punktlister, materialelinks, klik på originale filmenuer, beskyttelse mod kopierede scripts/ugyldige adresser, delte dato-/fagceller, søgning og datosortering. Eksemplerne er fiktive. Udseendet af brugerens konkrete lektieside er ikke visuelt verificeret.

35 kontroller dækker den udvidede klassiske lommeregner: kvadratrod, kvadrat, reciprok værdi, potens, absolut værdi, π, seneste svar, CE, hukommelse, historik og kopiering. De kontrollerer også negative rødder, division med nul, over-/underløb, gentaget lighedstegn, genbrug af svar som operand, uændret procentadfærd og tastaturbetjening. Kopiering viser en manuel vejledning, hvis browseren ikke tillader udklipsholderen.

24 kontroller dækker atommodellen. De omfatter et samlet opslag af alle 118 referenceposter, kendte undtagelser i elektronfordelingen (bl.a. Cr, Cu, Pd og Lr), bevarelse af massetal og neutral ladning for alle 354 isotopvalg samt optælling af alle tegnede protoner, neutroner og elektroner for alle 118 standardvisninger. Der kontrolleres også isotopskift, farveforklaringer, præference for illustrationer og mærkning af modellens begrænsninger. Disse antal angiver testgrupper; de interne løkker er ikke talt som separate kontroller.

Eksempler: H-1 har 1 proton, 0 neutroner og 1 elektron. C-12 har 6/6/6; C-14 har 6/8/6. Chlor-35 har 17 protoner, 18 neutroner og elektroner fordelt 2, 8, 7. Neutronantal udledes af den valgte isotop og ikke af standardatomvægten.

Atomreferencer hentet 16. november 2026:

- [PubChem: periodiske data og elektronkonfigurationer](https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON).
- [NIST: udvalgte isotoper og naturlige hyppigheder](https://physics.nist.gov/cgi-bin/Compositions/stand_alone.pl?ele=&all=all&ascii=ascii2&isotype=some).
- [NIST: lawrencium, opdateret 7p-konfiguration](https://physics.nist.gov/cgi-bin/Elements/elInfo.pl?element=103&context=frames).

Standardvalget er isotopen med størst oplyst naturlig hyppighed, ellers den første oplyste isotop. Det er ikke en påstand om stabilitet eller levetid. Skaller er afledt af elektronkonfigurationen i grundtilstanden for et neutralt atom. Tunge grundstoffers forudsagte konfigurationer markeres. Kuglernes størrelse, afstande og placering i kernen er illustrative; cirklerne er ikke faktiske elektronbaner. Standardatomvægtene fra CIAAW er bevaret som en særskilt oplysning.

Samlet resultat for Test 12: 1.264 beståede kontroller i 17 testsuiter. Resultatet omfatter de 1.169 kontroller fra Test 11 og 95 nye. Det dokumenterer beregninger og DOM-adfærd; det er ikke en visuel eller indlogget browsergennemgang.

## Test 13

Samlet resultat: **1.450 beståede kontroller i 20 testsuiter**. De eksisterende kontroller er opdateret til 54 værktøjer, syv indstillingskategorier og Strafe Clicker fra som standard. Alle nye ruter indgår i den eksisterende DOM-gennemgang. `lab.cjs` tilføjer 83 kontroller, og `translation.cjs` tilføjer 25.

De nye beregninger kontrolleres med kendte cases og bevarelseslove: 10 enkeltatomige ioners ladning og skaller; H₂/O₂ og CH₄/O₂ med begrænsende reaktant, restmængder og produkter; spændingssum i serie og strømsum i parallel; fire regnearters standardusikkerhed; decimalafrunding af bl.a. 1,005 og −1,005; simulation med kontrolleret tilfældig sekvens; vandmodellens 104,5° vinkel og alle molekylbindingers atomreferencer. Meget små stofmængder testes særskilt mod falsk klassifikation af begrænsende reaktanter.

DOM-kontroller omfatter ion- og isotopskift, skydere og figurer, kredsløb med direkte strøm-/spændingslabels, tilføjelse af modstand, gemt beregningsark med rekonstruktion af figur, navngivne grafopsætninger, drejning af molekyle, gentagne simulationer, gemt forsøgsrapport og overførsel af målinger, opgavetavle og delmål, fagnoter og beskyttelse af kladder, valg/fortrydelse af tegnsætningsforslag, profiler og fortrydelse, flashcard-gentagelse, backup, værktøjspanel ved siden af lektier og genopbygning af manglende moderne indhold uden ændring af præferencer. Gemte figurer må ikke indføre scripts, eksterne billeder eller URL-fyld.

Oversættelsestestene kontrollerer UTF-8-segmentering uden tab af tegn, tjenestens bytegrænse, input- og sprogvalidering, fast HTTPS-endpoint, fravær af credentials/API-nøgle/referrer, lokal håndtering af samme sprog, kvote/ugyldigt svar/timeout, service-workerens afsenderkontrol, snæver hosttilladelse, ingen netværkskald ved indtastning, beskyttelse mod dobbeltafsendelse og gamle svar samt sikker tekstvisning af et HTML-lignende API-svar. Automatiske tests bruger en simuleret API; et separat direkte opslag med “Hello world”, en→da, returnerede API-status 200 og “Hej verden”.

Kilder og præcise forudsætninger findes i `../TEST13.md`. De 18 forslag har afgrænsede første implementeringer: bl.a. tre molekyler, ti ioner, 14 formler og 12 ordlisteopslag. Tegnsætningshjælpen er ikke en fuld grammatikkontrol. Den eksterne oversætter har kvote og kan være utilgængelig; ingen login/nøgle kræves. Visuel afprøvning, udskrift og alle rigtige loginbeskyttede Lectio-sider er fortsat ikke verificeret her.

### Visningsprivatliv i Test 13

55 kontroller i `privacy.cjs`: eget fulde navn identificeres fra personlig Forside, andre elevers navne bevares, opdelt navnetekst håndteres, fanetitler og værktøjstip anonymiseres, dynamiske kort og rammer dækkes, personfotos skjules, illustrationer bevares, toggles og kopierede kort kan gendannes. Formularværdier, redigerbar tekst og scripts bevares. Identitetsopslag fejler uden at gætte, og indstillinger gemmer ikke navne/foto-ID'er. Samspil med tema/fanebranding testes for mutationsløkker. CSS-regler og DOM-adfærd er kontrolleret; dette er ikke en visuel test af alle indloggede sider.

## Test 14

1.489 kontroller i 21 testsuiter. `test14.cjs` tilføjer 39 kontroller af ændrede/opdelte navne, længere navne med bindestreg, idempotente privatlivsopdateringer, forsinkede notehandlinger, observerede ændringer fra andre faner, kapacitetsgrænser, oversættelsens whitespace, lange markeringer, Unicode-tegntæller, gamle svar og samlede tids-/segmentgrænser. Oversætterens netværkssvar er kontrollerede testdata; der er ikke foretaget en ny live-vurdering af oversættelseskvaliteten.

## Test 15

1.640 kontroller i 22 testsuiter, heraf 151 i `test15.cjs`. Tegnsætning testes med faste positive/negative eksempler, idempotens, beskyttet notation, startkomma, ændringsintervaller og redigerings-/kopieringsflow. Molekylegrafer testes mod kendte formler/CIDs, omnummerering, ændret placering, manglende bindinger, valensgrænser, isomerer og ukendte strukturer. DOM-testene dækker træk med synligt atom, afbrudt træk, tastatur, H-udfyldning, dybde, gemte strukturer og beregningsark.

Den fulde suite blev kørt, hvorefter Test 15-suiten blev kørt igen efter tilføjelsen af det synlige atom under træk. Den pakkede demo kontrolleres særskilt. Der er ikke foretaget visuel eller indlogget browserverifikation. Kilder og modellernes begrænsninger findes i `../TEST15.md`.

## Test 16

1.658 kontroller i 22 testsuiter. 18 nye regressionskontroller i `homework.cjs` dækker ikonnavne i titler, materialelinks og indhold, bevarelse af rigtige ord, uændret kildemarkup og dynamiske opdateringer. Den nye regression fejler mod Test 15 ved den forventede kontrol af ikonnavne i aktivitetstitlen. Hele den opdaterede suite består.

## Test 17

1.769 kontroller i 23 testsuiter. `test17.cjs` tilføjer 111 kontroller af 39 tegnsætningseksempler, idempotens, startkomma, ændringsintervaller og den tydelige navnevisning ved molekylebyggefeltet. 26 af de 39 udvalgte teksteksempler fejler med Test 16-motoren; alle 39 består med Test 17. Det er en afgrænset regressionstest, ikke en generel sproglig kvalitetsmåling. Lang eller tvetydig tekst kan stadig kræve manuel rettelse.
