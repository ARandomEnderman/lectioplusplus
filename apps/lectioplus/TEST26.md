# Test 26 – Hjælpemidler, mørkt tema og mere roligt layout

Testpakken bygger videre på Test 25. Manifestversionen er fortsat 0.1.3, og der er ikke pushet til GitHub eller oprettet en release.

## Tema og navn

Navnet er rettet til **Hjælpemidler** i sidebjælken, overskrifter, indstillinger, søgning, søgeindeks og oversættelser. Interne værktøjs-id'er, noter, favoritter og gemte opsætninger er uændrede.

Tabeller havde ikke alle en udtrykkelig baggrunds- og tekstfarve. Derfor kunne Lectios egne generelle regler give hvide celler og sort tekst, selv når LectioPlus+ stod i mørk tilstand. En fælles, afgrænset beskyttelse af Hjælpemidler og værktøjs-sidepanelet styrer nu tabeller, formularfelter, etiketter og foldemenuer. Native vælgere, filknapper, skyderkontroller og afkrydsningsfelter følger lyst/mørkt tema. Farver på atomer, diagrammer og brugerens eget indhold bliver ikke nulstillet.

HTML-forhåndsvisningens faste hvide baggrund er fjernet. Et HTML-eksempel uden egne farver får nu LectioPlus+'s baggrund, tekst og farvetilstand. Hvis brugerens kode selv angiver fx en hvid baggrund, bevares det. Temaskift opdaterer den senest kørte HTML-visning uden at køre nye, endnu ikke kørte kodeændringer. Forhåndsvisningen er fortsat isoleret uden scripts og eksterne ressourcer. Et temaskift kan nulstille felter inde i selve HTML-forhåndsvisningen; editorens kladde bevares.

Kodeeditorens særskilte valg af mørk/lys editor er stadig tilgængeligt. Et bevidst valg af lys kodeeditor kan derfor fortsat give en lys kodeflade i et ellers mørkt LectioPlus+.

## Layout

- Mindre topoverskrift på en åben værktøjsside giver mere plads til arbejdet.
- Fagkort, søgeresultater og genveje har mere ensartet afstand og tekststørrelse.
- På smalle skærme kan fagknapperne rulles vandret.
- Tabeller har en tydelig ramme, overskriftsrække og vandret rulning ved behov.
- Felter har tydeligere etiketter og fokusmarkering.
- Beregn er fremhævet i de udvidede beregningsværktøjer, og et tomt resultatfelt forklarer næste trin.
- Resultater, mellemregninger og egne notekort har mere ensartet afstand.
- Det store kodeværksted fra Test 25 og alle 125 Python-opgaver er bevaret.

## Afprøvning

1. Kopiér hele `extension`-mappen til din eksisterende installationsmappe, og genindlæs både udvidelsen og Lectio-fanen.
2. Åbn Hjælpemidler. Kontrollér navn, fagoversigt, søgning, favoritter og emner.
3. Prøv mørkt og lyst tema i fx Lineær regression, Sammenlign regressioner, Empirisk formel, Importér målinger, Kodeværksted, Tekst fra billeder og noter.
4. Åbn rullemenuer, mellemregninger og indstillinger. Prøv både nye rækker og beregnede tabeller.
5. Indtast egne værdier, skift tema og værktøj, og kontrollér at værdierne er bevaret.
6. I Kodeværksted: kør `<h1>Min side</h1>` som HTML. Skift tema. Prøv derefter egen CSS med en udtrykkelig baggrundsfarve.
7. Prøv en smal browser og fuld vinduesvisning i kodeværkstedet.

`SE_TESTEN.html` viser layoutet med fiktive data. Python/SQL/regex/OCR og tegnsætningsmodellen kræver udvidelsen eller udviklerens lokale webserver, ikke en HTML-fil åbnet med dobbeltklik.

## Kontroller

Alle 126 værktøjsindgange gennemgås automatisk for åbning, indtastningsetiketter og layouttilstand. Beregningsværktøjernes standardeksempler køres. Udvalgte dynamiske tabeller, importer, filfelter, menuvalg og skyderkontroller kontrolleres i både lyst og mørkt tema mod bevidst hvide værtsregler. Testen dækker også korrekt navn, oversættelser, bevarede indtastninger, HTML-tema og fortsat isolation.

Se `tests/TEST26_RESULTATER.txt` i testpakken for den samlede kørsel. Kontrollerne omfatter DOM, CSS-regler og de eksisterende beregnings- og runtimeprøver; de er ikke en visuel livegennemgang af Chrome/Edge eller indlogget Lectio. En bestemt browsers native rullemenuer og filvælgere skal afprøves i browseren.
