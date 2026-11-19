# Test 34 – Søg efter elev- og lærernavne

Under **Hovedmenu → Elever/Lærere** er der nu et felt til navnesøgning.

- Listen filtreres straks, når du skriver, uden at genindlæse siden.
- Fornavne, efternavne og dele af navne virker. Store/små bogstaver og ekstra mellemrum ignoreres.
- Flere søgeord skal alle findes i navnet/rækken, men kan skrives i vilkårlig rækkefølge.
- Danske bogstaver understøttes. Du kan fx også skrive `soren` for `Søren`.
- Der vises antal resultater og en tydelig besked, hvis intet matcher.
- **Ryd søgning** eller Escape viser listen igen og beholder fokus i søgefeltet.
- Enter i søgefeltet sender ikke Lectios formular.

Søgningen gælder navnene på den aktuelle side. Hvis Lectio begrænser listen med et klassevalg, et bogstav eller sideskift, er det kun de indlæste personer, der søges i. Der hentes ikke automatisk andre elev-/lærerlister. Søgningen gemmes ikke på disk og kræver ingen nye tilladelser.

Personernes eksisterende links og hændelser bevares. Tabeller, punktlister, kolonner med flere lister og direkte skemalinks understøttes. Dynamisk tilføjede personer filtreres med den aktuelle søgning. Filtreringen fjernes igen ved deaktivering eller navigation væk.

## Prøv ændringen

1. Pak ZIP-filen ud, og åbn **SE_TESTEN.html**.
2. Vælg **Hovedmenu → Elever** eller **Lærere**.
3. Prøv fx `mikkel`, `jensen`, `soren` eller et navn, som ikke findes.

Demoen indeholder kun fiktive personer. Begge demoer, både **SE_TESTEN.html** og **preview/index.html**, bruger samme søgekode som udvidelsen.

## Opdater udvidelsen

Kopiér hele indholdet af **extension** til den eksisterende installationsmappe. Genindlæs LectioPlus+ på **chrome://extensions** eller **edge://extensions**, og genindlæs derefter Lectio-fanen. Behold samme installationssti for at bevare dine indstillinger. Alle tidligere funktioner, herunder spillene og Python-opgaverne fra Test 33, er med.

## Kontroller og afgrænsning

De nye 45 automatiske kontroller dækker elev-/lærernavne, danske bogstaver, delvise navne, flere søgeord, ingen resultater, tastatur, originale links, dynamiske lister, deaktivering, kolonnelayout og navigation i den samlede demo.

Derudover er de eksisterende kontroller for navigation, native sider, privatliv og udvidelsens samlede integration kørt. Resultaterne står i **tests/TEST34_RESULTATER.txt**. Det er DOM- og CSS-parsertests; hele den urelaterede spil-/Python-suite er ikke genkørt for denne ændring.

En lokal Chromium-layoutkontrol kunne ikke startes i testmiljøet. Der er derfor ikke påstået visuel browserverifikation eller liveafprøvning af indloggede Lectio-lister. Prøv især din skoles konkrete liste efter installation.

Manifestets testnavn er opdateret til Test 34; version 0.1.3 og tilladelserne er uændrede. Der er ikke foretaget GitHub-push eller offentlig release.
