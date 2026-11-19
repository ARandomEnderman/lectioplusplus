# LectioPlus+

## Version 0.1.6

- Under **Spil** kan du vælge mellem 20 offlinebaner i **osu! · Rytmecirkler**. Hver bane har sin egen melodi, sværhedsgrad og rekord. **Lys ud** er et nyt puslespil på et 5 × 5-bræt.
- Under **Hjælpemidler → Matematik → Funktioner** kan du undersøge en potensfunktion og bestemme forskriften ud fra to punkter.
- Firefox til computer har fået en separat, usigneret pakke. Hent `lectioplus-firefox.zip` fra udgivelsen, åbn `about:debugging#/runtime/this-firefox`, og vælg ZIP-filen som midlertidig tilføjelse. Det kræver Firefox 154 eller nyere og skal gentages efter genstart.

## Version 0.1.5

Samler ændringerne til og med Test 34: navnesøgning under Elever og Lærere, ti klassiske spil, 125 Python-opgaver med tydeligere vejledning, interaktivt input og terminal samt flere fagværktøjer og egne sidebjælkelinks. Markeringen af det aktuelle klokkeslæt fra 0.1.4 er bevaret.

Opdatér ved at pakke hele `lectioplus-chrome.zip` ud i den eksisterende installationsmappe, genindlæse udvidelsen og derefter Lectio-fanen. Hele `vendor`-mappen skal med. Interaktiv Python kræver en browser med WebAssembly JSPI; kodeværkstedet viser en fejl, hvis browseren mangler denne funktion. Liveverifikation på indloggede Lectio-sider er ikke udført.

Afsnittene om testpakker nedenfor er historiske udviklingsnoter.

## Test 34

**Elever** og **Lærere** har nu et søgefelt, der filtrerer navnene, mens du skriver. Søg på fornavn, efternavn eller dele af navnet. Der er antal resultater, besked ved ingen match og **Ryd søgning**. Søgningen bruger de personer, Lectio allerede har indlæst på siden. Se [TEST34.md](TEST34.md). Alle funktioner fra Test 33 er med. Manifestversion 0.1.3 er bevaret; denne testpakke er ikke udgivet på GitHub.

## Test 33

Det nye faneblad **Spil** har ti klassikere og bonusspillet Grøn eller rød med mad og aktiviteter. Spillene kører lokalt med synlige betjeningsknapper, pause og genstart. Python-opgaverne har fået konkrete situationer, tre deltrin, læsbare eksempler, en stor læsevisning og knappen **Prøv eksemplet** til funktionsopgaver. Eksisterende opgavekode og fremskridt bevares. Se [TEST33.md](TEST33.md). Alle rettelser fra Test 32 er med. Manifestversion 0.1.3 er bevaret; denne test er ikke udgivet på GitHub.

## Version 0.1.3

Denne opdatering samler de afprøvede ændringer til og med Test 20: moderne undersider og tilpasning, 54 skoleværktøjer, privatlivsindstillinger samt lokal dansk tegnsætning med rettet opstart. Strafe Clicker er fra som standard ved ny installation.

Den samlede automatiske suite består af 1.903 kontroller i 27 testsuiter. De 112 afgrænsede tegnsætningseksempler matcher deres referencer. Browserforbindelsen er afprøvet med simuleret browser-API; model/WASM-kørsel er afprøvet direkte. Liveverifikation på indloggede Lectio-sider mangler, og tegnsætningen kan stadig tage fejl.

Ved opdatering skal hele `extension`-mappen, inklusive `vendor`, kopieres. Genindlæs derefter både udvidelsen og Lectio-fanen. Afsnittene om testversioner nedenfor beskriver udviklingsforløbet før denne samlede GitHub-opdatering.


LectioPlus+ er en browserudvidelse til Chrome og Edge med en ny forside, ugeplan, opgaveliste, lektieoversigt, beskedoversigt og hovedmenu på Lectio. Du bruger din eksisterende Lectio-konto og navigerer med den faste sidemenu.

## Prøv den

Åbn [forhåndsvisningen](preview/index.html) i browseren for at prøve layout, navigation, tema og filtrering med eksempeldata.

1. Åbn `chrome://extensions` i Chrome eller `edge://extensions` i Edge.
2. Slå **Udviklertilstand** til, og vælg **Indlæs udpakket**.
3. Vælg mappen `extension` i dette projekt. Den indeholder `manifest.json`.
4. Åbn Lectio som normalt, og genindlæs eventuelle faner, der allerede er åbne. Har du allerede en tidligere version, så vælg **Genindlæs** på LectioPlus+ i udvidelsesoversigten, før du genindlæser Lectio.

## Brug LectioPlus+

- Åbn **Find en side** fra toppen, eller brug **Ctrl+K** (**⌘K** på Mac).
- Skift mellem visningerne i LectioPlus+ uden at genindlæse fanen. Browserens **Tilbage** og **Frem** virker også. Sider og handlinger, der kræver Lectios egne formularer, åbner som normalt.
- Vælg **Uge**, **Dagsliste** eller **I dag** i skemaet. Brug pilene til forrige/næste uge, **Denne uge** til at vende tilbage, eller **Vælg uge → Vis uge** til at springe til en bestemt uge. Ugeplanen har en fælles tidsakse med de faktiske pauser mellem lektionerne. Klik på en ugedag for at åbne den som dagsliste.
- Filtrér opgaver med **Mangler**, **Afleveret** eller fag, og sortér efter frist. Brug **Flere felter** til fx elevtid, eller åbn Lectios liste og beskedmapper fra oversigten. Søg i de lektier og beskeder, Lectio har indlæst på siden.
- **Lectios værktøjer** åbner sidens oprindelige indhold, hvor du kan bruge funktioner som ugevælger, aflevering og beskedskrivning. Vælg **Tilbage til LectioPlus+** for at vende tilbage.
- Vælg mellem ti farvedesigns, lys, mørk eller systemets tema og **Luftig** eller **Kompakt** afstand fra Indstillinger eller udvidelsens browserikon.
- Vælg **Indstillinger → Udseende → Skjul mit profilbillede** for at skjule personbilleder i Lectio, også i kort og elevlister. Lige under findes **Vis mit navn som Anonym**. Valgene påvirker visningen; skrivefelter, kopierede data og filer anonymiseres ikke. Se [Test 13](TEST13.md) for dækning og afgrænsning.
- Hold musen over ikoner og lektioner i ugevisningen for at se en forklaring eller flere lektionsoplysninger. Forklaringerne vises også ved tastaturfokus. Brug **Ryd filtre** for at nulstille søgning og valg.
- På sider som fravær, karakterer, studieplan, dokumenter og profil bruger Lectios egne tabeller og felter samme tema. Når siden har flere afsnit, giver **På siden** genveje til dem.

Forsiden læser oplysninger fra din åbne Lectio-side og kan hente skema og afleveringer fra sidernes egne Lectio-links med dit eksisterende login. De nye visninger bruger datoer, statusser og links fra Lectio. Menuen i LectioPlus+ viser sider med et andet dataformat med Lectios eget indhold. Dine indstillinger, overblikkets layout og egne noter/links gemmes lokalt i browseren. Skoleoplysninger gemmes ikke af denne udvidelse.

## Tilpasning (testversion)

Indstillinger har fanerne **Udseende**, **Skema**, **Menuer**, **Overblik**, **Sider og tabeller** og **Backup**.
- Skema: tre størrelser, uge/dag som standard, fagfarver, lokalevisning i ugeplanen og markering af reelle pauser. Tidsaksen bevarer pauser også uden markering.
- Menuer: skjul Strafe Clicker helt, vælg afstand, skjul og flyt menupunkter, og fastgør favoritter øverst.
- Overblik: vælg én, to eller tre kolonner, overskrift og felter. Træk i et felts navn eller brug pilene for at flytte det. Vælg én kolonne eller en hel række, og skjul/tilføj felter.
- Egne felter: op til 12 noter eller links. Redigér, fjern og fortryd ændringer før Gem layout. Standardlayoutet gendannes uden at slette egne felter; de bliver tilgængelige under Tilføj felt.
- Udseende og sider: skrifttype, bredde, fanens navn/ikon, færre animationer, tabelafstand og afsnitsgenveje.

Previewen indeholder 46 fiktive hoved- og undermenuer, herunder beskedtråde, afleveringsdetaljer, fraværsårsager, dokumentmapper og spørgeskemaer. Formularer i demoen sender ikke data. Den er ikke en erstatning for at afprøve de rigtige sider i Lectio. Login-, logout- og eksamenssider ændres ikke.

## Automatiske kontroller

Kør `npm ci` og `npm test` i `tests/` med Node.js 20 eller nyere. Kontrollerne bruger jsdom og fiktive data; de kontrollerer funktion og bevarelse af DOM, ikke pixel-layout eller et rigtigt Lectio-login.

## Test 7: visuel editor og detaljesider

I **Indstillinger → Overblik** ligger felterne i en liste til venstre. Træk dem ind foran et felt eller ned i slipområdet for at tilføje nederst. Allerede viste felter flyttes uden at blive duplikeret. Plusknapper og flyttepile fungerer også uden træk. Canvas bruger nu samme renderere og indhold som overblikket (fiktive data i demoen); Computer/Mobil ændrer kun forhåndsvisningen.

Aktivitets- og materialesider bruger nu mindre filoverskrifter, tydelig indholdsoversigt og fleksibel læsebredde. Formularer og oprindelige filhandlinger bevares. Undermenuer, beskedtråde og tabeller er finpudset på tværs af siderne. Native dropdown-valg får eksplicit temaets overflade og tekstfarve samt lys/mørk farveindstilling på selve kontrollerne.

## Test 8: tydelig til/fra-status

Alle udvidelsens til/fra-indstillinger bruger en kontakt med flytbar knap, temafarve og teksten Til/Fra. Klik på hele indstillingsrækken eller brug tastaturet. Indstillinger, browser-popup og skjul profilbillede bruger samme kontakt. Feltlisten markerer Vist/Skjult, og statusfeltet bekræfter den konkrete ændring.

## Test 9: kladder, menu og backup

- Overblik-editoren bruger de samme kort og data som overblikket. Åbnes editoren på en anden side, hentes forsiden via dens eksisterende Lectio-link. Indholdet bliver i hukommelsen; links og formularhandlinger er inaktive i forhåndsvisningen.
- Layoutændringer ligger i en kladde indtil **Gem layout**. **Annullér ændringer** gendanner det gemte layout; **Fortryd/Gentag** omfatter flytning, størrelse, titel og egne felter. Lukning advarer om kladden. Ved lagringsfejl bevares kladden, og en ændring fra en anden fane må ikke overskrives stiltiende.
- **Menuer** giver synlighed, favoritter, træk og flyttepile. En ændret rækkefølge samler menupunkterne under Menuer; favoritter vises øverst. Gendan standardmenu bringer de oprindelige grupper tilbage.
- **Backup** eksporterer validerede indstillinger og egne noter/links som JSON. Skoledata, login og aktiveringstilstand eksporteres ikke. Import kræver gennemgang og et klik på Importér og kan fortrydes. Ugyldige filer afvises før ændringer; maksimum er nu 4 MB, så alle tilladte noter og flashcards kan være med.
- Tema, menu og øvrige valg gemmes straks. Kun layouteditoren bruger Gem/Annullér.

Test 9 er en lokal testpakke; manifestversionen er ikke hævet. De automatiske kontroller bruger fiktive data. Den offentlige Lectio-hovedmenu er besøgt, men loginbeskyttede sider kræver stadig brugerens login. Derfor er den gennemgang ikke afsluttet, og der er ikke påstået visuel godkendelse af de private sider eller editoren.

## HjælpeMiddler: 38 lokale værktøjer

Matematik, kemi, fysik, tekst og studieteknik har søgning, favoritter og indstillinger for decimaler, vinkler, mellemregninger, illustrationer, grafgitter, tæthed og fokustider. Den klassiske lommeregner har knapper og tastatur; den videnskabelige beregner understøtter udtryk. Dansk er standard; engelsk og blandede værktøjsnavne er tilgængelige, men oversættelsen er fortsat delvis. Egne noter og flashcards følger med indstillingsbackup.

AI-panelet, klienten og den tilhørende server er fjernet efter brugerens ønske. Værktøjerne beregner lokalt og kræver ingen API-nøgle.

`school-math.js` indeholder udtryksparser, lommeregnermodel og beregninger. `school-elements.js` bruger CIAAWs afrundede 2024-atomvægte; manglende standardatomvægte forbliver tomme. `school-chemistry.js` håndterer formler, 50 referencekontrollerede forbindelser og afstemning. `school-catalog.js`, `school-special.js` og `school-tools.js` definerer værktøjer, visninger og navigation. `school-visuals.js` bygger figurer ud fra de validerede beregningsdata.

## Test 10: roligere indlæsning (ikke udgivet)

Opstartsgardinet fjernes, når den nye side er klar. Den gamle 1,4-sekunders frist kunne vise originalt Lectio under langsom HTML-indlæsning. Fejlsikringen regnes nu fra færdig DOM med en ekstra absolut frist, så fejl ikke efterlader siden skjult permanent. Den korte indlæsningsvisning bruger temaets baggrund. Skolevælgeren og understøttede Lectio-frames får nu samme tidlige beskyttelse. Login, logout, eksamen og uvedkommende sider er undtaget.

Nye native menuer farvetilpasses i deres DOM-opdatering før næste visning. Shellens ændringer samles pr. billedramme i stedet for at vente 80 ms. Hvis en tabel midlertidigt fjernes under opdatering, bevares den eksisterende moderne visning i op til 750 ms med aria-busy. En varigt utilgængelig visning falder derefter tilbage til de oprindelige, tematilpassede formularer. Der tilføjes ingen overgangsanimationer eller ændringer af formularernes handlinger.

`tests/transitions.cjs` kontrollerer langsom indlæsning, normal afslutning, frister, deaktivering, undtagne sider, native popupfarver før næste frame, indlejrede felter, skolevælgerens fejltilfælde og midlertidig/permanent fjernelse af skemaets kildetabel. Disse er DOM- og timingtests, ikke visuel browserverifikation på en indlogget Lectio-session.

## Test 11: visuelle værktøjer, ugeskift og stabil genopbygning

Klassisk lommeregner, felter der følger beregningstypen, eksempler og tydeligere resultater. Inputændringer rydder forældede beregninger. Nettokraft og kontakttryk er separate beregninger. R² vises som udefineret ved konstante y-data; ligningers nuldeterminant afgøres med eksakte decimalkoefficienter. Grafer validerer hele udtrykket før evaluering og bevarer f/g-navnene. Noter og flashcards beskytter igangværende indtastning under gemning; timeren genoptages korrekt efter sidecache.

De 118 atomvægtsposter sammenlignes med en CIAAW-reference. For de 50 ionforbindelser sammenlignes atomsammensætning med PubChem, og oxidationstrin/udvalgte danske navne testes separat. Alle øvrige kombinationer afvises; en neutral sum af ladninger dokumenterer ikke i sig selv et eksisterende stof. Beregninger og kendte begrænsninger er beskrevet i [tests/TOOL_AUDIT.md](tests/TOOL_AUDIT.md).

Ionværktøjet viser formelforhold, ladninger og stofmængder ved en valgfri prøvemasse. **Find ioner i en formel** slår op i de samme 50 forbindelser. **Vektorer i planen** viser sum, differens, længder, prikprodukt og vinkel; nulvektorens vinkel angives som udefineret. Retvinklede trekanter kan beregnes ud fra to kateter, hypotenuse og katete eller vinkel og modstående katete.

Beregninger vises i et todelt layout med relevante felter ved siden af resultaterne. Figurer viser blandt andet ionforhold, massebidrag, vektorer, geometri, regression, pH og fortynding. Skematiske illustrationer er mærket med deres afgrænsning og kan slås fra i værktøjsindstillingerne.

Skemaets ugeskift bruger Lectios ugeparameter og bevarer identiteten fra det aktuelle skemalink. Forrige/næste, direkte ugevalg og Denne uge håndterer ISO-årsskift og tomme uger. Demoen gentager fiktive aktiviteter på de valgte datoer; den henter ikke et rigtigt skema.

Indhold der oprettes sent eller erstattes af Lectio, får nu genforbundet den eksisterende brugerflade. Menukald aktiverer ikke permanent originalvisning. Oprindelige dialoger vises, mens de er åbne. En fastlåst indstillingslæsning blokerer ikke opstart; en senere indstilling om deaktivering respekteres stadig. Ved renderfejl er en genindlæsningsknap tilgængelig.

Den øvrige gennemgang retter import af ældre indstillingsbackup, kapacitetsgrænsen for egne noter/kort, skolevælgerens sene indlæsning og synlige fejl ved gemning. Fanenavn og ikon følger også udskiftet sidehoved. Udskrift bruger den aktuelt viste moderne side frem for en gammel kildeside efter ugeskift.

1.169 automatiske kontroller i 13 testsuiter er bestået. De omfatter beregninger, de 38 værktøjsruter, diagrammernes data, navigation, formularbevarelse, indstillinger, backup og opstart. CSS og JavaScript kontrolleres også. Dette er DOM- og beregningstests, ikke visuel browserverifikation.

Testpakken er til afprøvning. Ingen versionsforhøjelse, push eller release. Automatiske tests bruger fiktive data; alle private Lectio-sider er ikke testet i en indlogget browser.

## Test 12: opstart, lektier, lommeregner og atommodel

Hvis sidens HTML-temamarkeringer eller body-klasser bliver overskrevet efter opstart, genoprettes de valgte farver og den aktuelle visning i samme mutationsrunde. Genopretningen ændrer kun udvidelsens egne markeringer; Lectios klasser, formularer og brugerens input bevares. Udvidelsen forbliver slået fra, når brugeren har deaktiveret den, og et bevidst valg af Lectios værktøjer bevares. En vellykket genkørsel efter renderfejl genopretter også temaet, før menuen vises.

Lektier har et særskilt layout med fag, dato og aktivitet adskilt fra lektieteksten. Afsnit, punktlister og materialelinks bevares. Dato og fag, der deles mellem tabelrækker, arves af alle de tilhørende lektier. Søgning omfatter disse felter, og listen kan sorteres efter dato. Indlejrede billeder og interaktivt indhold åbnes via en tydelig knap til originalvisningen. Kilde-HTML genindsættes ikke som aktiv HTML.

`tests/startup-recovery.cjs` kører den faktiske scriptrækkefølge fra manifestet med fiktiv forside. Den nye kontrol fejler mod Test 11, når sidens markeringer fjernes, og består med rettelsen. `tests/homework.cjs` kontrollerer tekststruktur, links, grupperede tabelrækker, filtrering og sortering. Den præcise årsag i brugerens browser er ikke bekræftet; kontrollen reproducerer den manglende genopretning. Visuel og indlogget afprøvning mangler fortsat.

Den klassiske lommeregner har nu et foldbart panel med kvadratrod, kvadrat, reciprok værdi, potens, absolut værdi, π, seneste svar og CE. Der er hukommelse (MS/MR/M+/M−/MC), historik med genbrug af de seneste 20 beregninger og kopiering af resultatet. C rydder beregningen, CE rydder den aktuelle indtastning; historik og hukommelse ryddes særskilt og gemmes kun, mens værktøjet er åbent. Regneren er fortsat sekventiel. Den videnskabelige beregner følger regnearternes rækkefølge.

Under Kemi → Periodisk system vises en skalmodel og en forstørret atomkerne for det valgte grundstof. Rød betyder proton (+1), grøn neutron (0), og blå elektron (−1). Forklaringer, partikelantal og skaltal står også som tekst. Isotopvælgeren ændrer neutronantallet, mens protoner og elektroner bevares for det neutrale atom. Der bruges 354 referenceisotoper på tværs af alle 118 grundstoffer; neutronantal beregnes ud fra isotopens massetal, aldrig ved at afrunde standardatomvægten.

Elektronkonfigurationer kommer fra PubChem, med lawrencium opdateret efter NIST; isotopudvalget kommer fra NIST. Kilder og dateret reference findes i `tests/atom-reference.json`. Skallerne og kernens placering af partikler er skematiske og ikke i målestok. Tunge grundstoffers forudsagte elektronfordelinger er mærket. Isotopudvalget er ikke en komplet oversigt og angiver ikke stabilitet. Slås illustrationer fra, bevares tal og farveforklaringer.

Test 12 består 1.264 automatiske kontroller i 17 testsuiter. Installér mappen `extension`, og sørg for kun at have én LectioPlus+-udvidelse aktiveret. HTML-demoen ændrer ikke Lectio-fanen. Pakken er til test og er ikke pushet eller udgivet på GitHub.

## Test 13: alle idéer, fagnoter, skrivehjælp og oversættelse

Alle 18 forslag fra `IDEER.md` er implementeret, med omfang og placering dokumenteret i [TEST13.md](TEST13.md). HjælpeMiddler har 54 værktøjer, heraf 53 lokale. Nyt omfatter værktøjspanel, reparationsknap, ion-/atomsammenligning, interaktive figurer, reaktionsmængder, molekyler i 3D, kredsløb, usikkerhed, simulationer, formelsamling og ordliste. Beregningsark, forsøgsrapport, personlig opgavetavle, fagnoter, profiler, presets og flashcard-gentagelse gemmes lokalt og indgår i backup.

Komma-/punktumhjælpen bruger fra Test 18 en lokal dansk sprogmodel som standard; den tidligere regelmotor kan vælges særskilt. Resultatet skal fortsat gennemlæses. Oversætteren bruger MyMemory uden konto eller nøgle; kun en eksplicit Oversæt-handling sender feltets tekst og sprogvalget. `translation-worker.js` begrænser netværkskald til tjenestens faste HTTPS-endpoint, validerer afsender/input, sender ingen credentials og håndterer timeout/kvote. `translation.js` deles med demoen. Manifestet tilføjer alene hostadgang til `api.mymemory.translated.net` og en service worker.

Strafe Clicker er fra som standard; tidligere gemt `true` bevares. Backupgrænsen er hævet til 8 MB, og eksport af en fil, som ikke kan importeres på grund af størrelsen, afvises tydeligt. AI-assistenten er fortsat fjernet. `tests/lab.cjs` og `tests/translation.cjs` supplerer de eksisterende tests. Udvidelsen er ikke pushet eller udgivet; visuel og indlogget browserverifikation mangler fortsat.

Test 13 består 1.450 automatiske kontroller i 20 testsuiter.

## Test 14: stabilitet i Anonym, noter og oversættelse

[Test 14](TEST14.md) retter navnemasker ved dynamiske ændringer, undgår overlappende notehandlinger og forbedrer oversættelsens linjeskift, tegntæller og håndtering af markeret tekst. Alle funktioner fra Test 13 følger med. Den nye pakke er til afprøvning før offentlig udgivelse.

## Test 15: automatisk tegnsætning og molekylebygger

**Komma og punktum → Ret komma og punktum** giver nu en rettet, redigerbar version med ét klik. Originalen bevares, og resultatet kan kopieres eller indsættes med fortryd. Nye startkommaer og store begyndelsesbogstaver kan vælges til/fra. Reglerne er lokale og begrænsede; gennemlæs resultatet.

**Molekyler i 3D → Visning → Byg selv** har atompalette, træk, bindinger, dybde, fortryd og navngivne gemte strukturer. 15 molekyler identificeres ud fra deres bindingsnetværk. Ukendte eller ufærdige strukturer får ingen gættede navne. Se [Test 15](TEST15.md) for vejledning, kilder og modelafgrænsning.

## Test 16: ikonnavne i lektier

Ikonernes interne tekst, fx `smsbookmark`, filtreres fra ved udtrækning af lektionsnavne og materialelinks. Almindelige ord i brugerens lektietekst bevares. Se [Test 16](TEST16.md).

## Test 17: tydelige molekylnavne og flere tegnsætningsrettelser

Molekylebyggeren har et felt med **Molekylets navn** direkte over byggefeltet. Den danske skrivehjælp håndterer flere ledsætninger, hv-led og fælles grundled og undgår de dokumenterede fejlagtige punktummer. Prøv med originalteksten; tidligere indsatte forkerte tegn fjernes ikke generelt. Se [Test 17](TEST17.md) for testdækning og fortsatte begrænsninger.

## Test 18: lokal dansk sprogmodel

**Komma og punktum** vurderer nu teksten med en medfølgende dansk sprogmodel. Den kan også foreslå at fjerne/flytte gamle kommaer og punktummer. Intet login, ingen API-nøgle og ingen tekst til en ekstern tjeneste. Stopknap, synlige ændringer, usikre forslag, kopiér og fortryd er med.

Modellen er stadig fejlbarlig. Den bruger overvejende startkomma, og uden-startkomma-valget gælder kun den gamle regelmotor. Se [TEST18.md](TEST18.md) for konkrete resterende fejl, måling og tekniske grænser. Den nye model prøves i den installerede udvidelse eller via en localhost-server; en dobbeltklikket HTML-demo kan kun vise designet og køre de enkle regler.

## Test 19: punktum og sætningsgrænser

Den lokale tegnsætning holder nu det fejlramte afsnit med `træt efter en lang weekend, hvor …` samlet og kan fjerne det tidligere forkerte punktum før `Efter`. Et enkelt linjeskift bliver heller ikke længere automatisk behandlet som slutningen på et afsnit. Selvstændige helsætninger afprøves som kontraster, så rettelsen ikke generelt fjerner punktummer før `Efter`.

Alle 112 afgrænsede teksteksempler og den samlede suite på 1.873 kontroller består. Det er ikke en garanti for vilkårlig dansk tekst; gennemlæs stadig resultatet. Se [TEST19.md](TEST19.md) for rettelser, testdækning og begrænsninger. Testpakken er ikke pushet eller udgivet.

## Test 20: opstart af den lokale sprogmodel

Den installerede udvidelse bruger nu browserens egen beskedkanal til modelvinduet. Status viser indlæsningstrin og sekunder, og blokeret opstart, manglende filer samt afbrudt forbindelse giver tydelige fejl med mulighed for at prøve igen. Kopiér hele `extension`-mappen, og genindlæs både udvidelsen og Lectio-fanen. Se [TEST20.md](TEST20.md) for testdækning og begrænsninger.

## Test 21: overblik over værktøjer og indhold i skemaet

HjælpeMidler starter med fem faggrupper og seks genveje med favoritter først. Alle 54 værktøjer har en brugsvejledning og kan findes via fag, opgaveord eller den samlede oversigt. Mellemregninger er foldbare, og gemmefunktionerne står efter værktøjet. Skemaet viser et lille indholdsikon, når Lectios oprindelige markering findes på lektionen. Se [TEST21.md](TEST21.md) for afprøvning, 2.066 beståede kontroller og kendte begrænsninger. Ingen ny release i denne test.

## Test 22: indtastning, personlige layouts og atomnavne

Talrækker og målepar kan indtastes i tabeller. Reaktionsmængder har navngivne felter for hvert stof, og kredsløb har et felt for hver modstand. Værktøjernes felter, hjælpetekster og resultatvisning kan tilpasses fælles eller pr. værktøj. Atombyggeren viser grundstoffets navn, fx Kulstof (karbon), både ved et enkelt atom og ved valg af et atom i et molekyle. Alle 2.121 kontroller i 29 testsuiter består. Se [TEST22.md](TEST22.md) for muligheder og begrænsninger. Dette er stadig en testpakke uden ny release.

## Test 23: indstillinger ved favoritter

Tilpasning af værktøjets layout åbnes nu med en lille indstillingsknap ved siden af **Føj til favoritter**. Panelet er skjult, indtil knappen bruges. Se [TEST23.md](TEST23.md).
