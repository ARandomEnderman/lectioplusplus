# Test 33 – Spil og mere konkrete Python-opgaver

## Spil i sidebjælken

Det nye faneblad **Spil** indeholder ti klassikere:

| Spil | Betjening og mål |
| --- | --- |
| Dinohop | Hop med mellemrum, ↑ eller knappen. Undgå kaktusser. |
| Snake | Piletaster, WASD eller knapper. Spis frugter og undgå vægge og din egen krop. |
| Tetris · Blokfald | Flyt, drej og sænk brikker. Mellemrum slipper brikken. Hele rækker bliver ryddet; næste brik og landingsposition vises. |
| Pong | Styr venstre bat med ↑/↓, W/S, markør eller hold-knapper. Først til 7 mod computeren. |
| Breakout | Styr battet med ←/→, A/D, markør eller hold-knapper. Send bolden med mellemrum. Ryd 40 mursten med tre liv. |
| 2048 | Flyt alle fliser med piletaster, WASD eller knapper. Saml ens tal og nå 2048. |
| Minestryger | Åbn sikre felter på et 9×9-bræt med 10 miner. Højreklik eller brug Flag-knappen. Første åbning og dens nabofelter er sikre. |
| Vendespil | Find otte par blandt 16 kort. Antal forsøg og tid vises. |
| Kryds og bolle | To personer på samme skærm. X starter; tre på stribe vinder. |
| Fire på stribe | To personer på samme skærm. Rød starter; fire på stribe vinder. |

**Grøn eller rød** er et bonusspil med 24 valg om mad, aktiviteter og spil. Grøn betyder ja tak, rød betyder spring over. Rundens valg vises til sidst og gemmes ikke. Spillet indeholder ingen elev-/lærerprofiler eller personbilleder.

Alle spillene er lokale implementeringer uden annoncer, login eller eksterne spilsider. Der er ikke tilføjet netværksadgang eller udvidelsestilladelser.

## Betjening, pause og indstillinger

- Vælg et spil fra kortene, eller find det via sidens søgning. Filtrér på Arkade, Hjernevridere, For to eller Bonus.
- Arkadespil har tre tempi: Roligt, Normalt og Hurtigt. Skift af tempo starter en ny runde.
- Pause/Fortsæt og Start forfra er synlige over banen. P og Escape pauser, når fokus er i spillet.
- Spillet pauser ved navigation væk, skjult browserfane, tab af vinduesfokus eller fokus uden for spilområdet. Det starter ikke automatisk igen.
- Rekorder fra afsluttede runder gemmes på enheden for Dinohop, Snake, Blokfald, Pong, Breakout og 2048. Arkadespillenes rekorder er adskilt efter tempo. De andre spil viser deres relevante tur-/rundestatistik.
- Spillebaner, menuer og kontroller følger LectioPlus+-temaet. Tal, symboler og tekst supplerer farver i brætspillene.
- Fanen kan flyttes, fastgøres eller skjules i Indstillinger → Menuer på samme måde som andre faner.

Det er en testversion af enkle klassikere. Blokfald er en egen implementering med syv-briks-poser og enkle vægkorrektioner, ikke en fuld implementering af alle officielle Tetris-regler. Brætspillene for to er lokale, ikke online multiplayer. Aktuelle runder bevares ved en pause og ved tilbagevenden til samme spil; skift til et andet spil eller genindlæsning starter en ny runde.

## Python-opgaverne

Alle 125 opgaver har nu en konkret sammenhæng, eksempelvis en kiosk, en træningsapp, en kalender eller et spil. De tidlige opgaver beskriver hverdagsproblemer med tal, variabler, input og output. Senere niveauer bruger mere krævende datastrukturer og algoritmer i forklarede situationer.

Hver opgave indeholder:

1. En kort situation, så formålet er tydeligt.
2. Den præcise opgave og tre trin: læs data, behandl dem, og vis eller returnér svaret.
3. Et konkret eksempel med læsbare inputfelter og forventet output eller returværdi.
4. Hints og en forklaring af testen, som kan foldes ud.

**Læs opgaven stort** åbner teksten i en større læsevisning. **Prøv eksemplet** vises ved funktionsopgaver og kører elevens aktuelle funktion med det første eksempels argumenter, så returværdien bliver vist i terminalen. Knappen ændrer ikke den kode, der står i editoren. **Test min løsning** afprøver fortsat alle tre testcases.

Opgave-id'er, startkode, referencekode og forventede svar er uændrede. Eksisterende kode og beståede opgaver bevares. Det er en præsentationsændring, ikke en udskiftning af de 125 opgaver. Opgavebeskrivelserne er originale; det indsendte undervisningsmateriale er ikke kopieret ind i udvidelsen eller testpakken.

## Test og afgrænsning

- `test33-games-core.cjs`: 141 kontroller af spilregler, væg-/batkollisioner, Tetris-rækker og rotation, Snake-hale, 2048-sammenlægning, sikre minefelter, kortpar, sejre, nederlag og tilfældige forløb med faste seeds.
- `test33-ui.cjs`: spilnavigation, kategorier, knapper, pause, genstart, tab af fokus, rekordlagring, indstillingsmigrering, backup og alle 125 opgavevisninger. Eksempelknappens faktiske payload køres også i den medfølgende Python-runtime for tal, CSV, matricer, grafer og None.
- Den eksisterende Test 32 gennemgår fortsat alle 125 opgavers tre testcases både ved bedømmelse og almindelig Python-kørsel: 750 opgavekørsler, herunder 114 interaktive svar.
- Hele den eksisterende testpakke køres med `npm test --prefix apps/lectioplus/tests`. Resultatet følger med i `tests/TEST33_RESULTATER.txt`.

Den samlede kørsel bestod alle 6.090 kontroller i 47 testsuiter. Kontrollerne bruger Node, JSDOM, simuleret canvas og faktisk Python via Node VM. De er ikke en visuel eller indlogget liveprøve i Chrome/Edge. Afprøv især bevægelse, berøring, størrelser og farver i browseren før en release.

## Prøv og installér

Åbn **SE_TESTEN.html** fra den udpakkede ZIP for at prøve spillene og se designet med fiktive skoledata. Spillene virker i HTML-demoen. Python kræver den installerede udvidelse.

1. Pak hele ZIP-filen ud.
2. Kopiér alt i `extension` til den eksisterende installationsmappe, inklusive `vendor` og de nye `games-*`-filer.
3. Genindlæs udvidelsen på `chrome://extensions` eller `edge://extensions`.
4. Genindlæs Lectio-fanen.

Manifestversionen er stadig 0.1.3. Pakken er ikke pushet til GitHub eller udgivet som release.
