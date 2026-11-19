# Test 25 – større kodeeditor og terminal

Testpakken bygger videre på Test 24. Manifestversionen er fortsat 0.1.3. Ingen GitHub-push, tag eller release er foretaget.

## Ændringer

Kodeværksted, SQLite og regex har fået et selvstændigt editorlayout. Koden ligger i midten med filnavn og linje/kolonne i statuslinjen. Arbejdsform, opgaver, filer og indstillinger findes i et sidepanel, der kan skjules. Farvemarkering, tema og linjenumre er bevaret.

Arbejdsområdet starter i 820 px højde. Træk nederst for at ændre højden, i terminalens øverste kant for at ændre terminalhøjden og i sidepanelets kant for at ændre bredden. Størrelserne gemmes på denne enhed. En skyder under Editorindstillinger giver samme højdekontrol. Skriftstørrelsen kan vælges fra 12 til 24 px. »Udvid til hele vinduet« giver editoren hele browserens indholdsområde; Escape gendanner layoutet uden at ændre koden.

Terminalen viser programoutput løbende, fejl og opgavetests med Bestået/Fejlet, forventet svar og faktisk svar. Stop bevarer den udskrift, der allerede er kommet. Ryd terminal og Kopiér output er tilføjet. Separate faner samler input, HTML/SQL/regex-resultater og optagede Python-variabler. Sprog og opgavevalg låses under kørsel, så en test ikke bliver gemt på en anden opgave.

| Genvej | Handling |
|---|---|
| Ctrl+Enter / F5 | Kør |
| Ctrl+Shift+Enter | Test opgaven |
| Shift+F5 | Stop |
| Ctrl+S | Gem koden |
| Ctrl+B | Vis/skjul sidepanel |
| Ctrl+J | Vis/skjul terminalpanel |
| Escape | Gendan fra fuld vinduesvisning |

Genvejene gælder, når fokus er inde i kodeværkstedet. På Mac kan Cmd bruges i stedet for Ctrl. Skillelinjerne kan også betjenes med Tab og piletaster samt Home/End. Terminalfanerne har piletastnavigation. Den enkle teksteditor er fortsat reserve, hvis CodeMirror ikke kan starte.

## Afprøvning

1. Kopiér hele testpakkens `extension`-mappe til den eksisterende installationsmappe. Genindlæs både udvidelsen og Lectio-fanen.
2. Åbn HjælpeMiddler → Programmering → Kodeværksted.
3. Afprøv størrelserne og fuld vinduesvisning. Skift side og tilbage; kontrollér at kladden er bevaret.
4. Skriv `print("Hej fra terminalen")`, og tryk Ctrl+Enter.
5. Tilføj `print(mangler)`: den første udskrift og fejlen skal begge kunne ses.
6. Prøv et program med `input()`: udfyld svar i Input-fanen før kørsel.
7. Vælg en Python-opgave, prøv en forkert og en rigtig løsning, og se rapporten i Terminal.
8. Start en uendelig løkke, og vælg Stop. Kør derefter et almindeligt program igen.
9. Prøv HTML/CSS, SQLite og optagelse af Python-variabler. De vises under Resultat eller Variable.

`SE_TESTEN.html` viser layoutet med fiktive data. Python/SQL/regex/OCR-kørsel kræver den installerede udvidelse eller udviklerens lokale webserver; en dobbeltklikket HTML-fil kan ikke starte disse motorer.

## Afgrænsning og kontroller

Dette er en editor inspireret af VS Code, ikke hele VS Code. Terminalen viser browserprogrammets output og testresultater; den er ikke PowerShell eller en kommandoprompt. Python-input skrives før kørsel i Input-fanen. Python-standardbiblioteket følger med, men der er ingen pip, netværk eller desktopvinduer. Tidligere grænser er bevaret: 10 sekunders programkørsel, 100.000 tegn kode/output og højst 300 variabeltrin.

Testene dækker DOM-integration, træk/tastaturstørrelser, gemning, genveje, fuld vinduesvisning, skift af sprog/opgaver, løbende output, Stop, fejl, HTML-isolation, backup fra Test 24 og outputgrænser. Den rigtige JavaScript-workergren testes direkte, og de 375 opgavereferencer køres fortsat i den medfølgende Python-WASM. Outputbeskeder kan ikke forlænge kørselsfristen.

Se `tests/TEST25_RESULTATER.txt` i ZIP-pakken for den samlede testkørsel. DOM-testene er ikke en visuel browsergennemgang. Chrome/Edge og indlogget Lectio er ikke liveverificeret i denne levering.
