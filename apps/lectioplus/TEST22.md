# Test 22 — enklere indtastning, egne layouts og atomnavne

Testversion oven på Test 21 og 0.1.3. Skemaets indholdsikoner og den nye værktøjsoversigt følger med. Ingen ny offentlig release.

## Indtastning

- Statistik har ét tal pr. række. Lineær regression og rapportmålinger har X og Y for samme måling på samme række.
- Kredsløbsbyggeren har et felt for hver modstand. Rækker kan tilføjes og fjernes.
- Reaktionsmængder har felter med stoffets formel og enhed, fx `H2 (g)` og `O2 (g)`. Når reaktionen ændres, bevares mængder kun for de samme stoffer; et nyt stof kræver en ny mængde. Et enhedsskift ændrer felternes enhed og fjerner det gamle resultat, men omregner ikke tallene automatisk.
- Den oprindelige tekstindtastning findes stadig under en foldbar tekstvisning, så tal kan indsættes samlet. Rækker og tekst holdes synkroniseret. En tom celle i en påbegyndt tabel giver en fejl; den forsvinder ikke ubemærket fra beregningen.
- De almindelige beregningsværktøjer har **Ryd værdier** og **Indlæs eksempel**. Relevante felter viser hjælpeeksempler, tilladte intervaller og valgfrie oplysninger. Fejl i almindelige talfelter markeres ved feltet; ved manuel beregning flyttes fokus dertil.

Beregningsmotorerne er bevaret. Det er indtastningen, præsentationen og valideringen omkring dem, der er ændret.

## Tilpasning

Åbn et værktøj, og fold **Tilpas indtastning og layout** ud.

Vælg **Alle værktøjer** eller **Kun dette værktøj**. Der er tre startlayouts: Roligt, Side om side og Kompakt. Derefter kan du selv vælge:

- Felter og resultat ved siden af eller under hinanden.
- Ét eller to felter pr. række i almindelige feltgrupper.
- Kompakte, normale eller store indtastningsfelter.
- Normal eller bred arbejdsflade.
- Resultat til højre eller venstre i understøttede delte visninger.
- Visning af brugsvejledning og felthjælp.
- Automatisk udfoldning af mellemregninger.

Indstillingerne gemmes lokalt og følger med i indstillingsbackup. Layoutet kan ændres uden at rydde det indtastede. **Brug fælles layout** fjerner kun det aktuelle værktøjs undtagelse. Specialværktøjer bevarer nødvendige grupper, tabeller og byggefelter; man kan ikke flytte enhver enkelt kontrol frit. Smalle skærme viser resultatet under felterne.

## Grundstoffernes navne

Atompaletten viser **Brint**, **Kulstof (karbon)**, **Kvælstof**, **Ilt** og **Klor** sammen med symbolerne. Et enkelt atom i byggefeltet får grundstoffets navn med det samme. Linjen **Valgt atom** viser også grundstoffets navn, når atomet er en del af et molekyle.

Molekylets navn vises særskilt, fx Metan. Den eksisterende genkendelse af 15 molekyler er bevaret; ukendte forbindelser får ikke et gættet navn. Der er ikke tilføjet en model, der kan bygge nye grundstoffer ved at ændre protonantallet.

## Afprøvning

Pak ZIP-filen ud og åbn **SE_TESTEN.html**. Demoen starter i Lineær regression med fiktive målinger. Prøv at rette X/Y-felter, tilføje en række og skifte layout. Åbn derefter **Molekyler i 3D → Visning → Byg selv**, og tilføj C. Der skal stå **Kulstof (karbon)**.

Til test på Lectio: Kopiér hele `extension`-mappen til den allerede installerede mappe, behold samme placering, og genindlæs både udvidelsen og Lectio-fanen. Tag eventuelt en backup først. Ved ny installation bruges **Indlæs udpakket** i `chrome://extensions` eller `edge://extensions`. Hav kun én udgave aktiveret. Den lokale tegnsætningsmodel kræver hele `vendor`-mappen og kan ikke afprøves i en direkte `file://`-demo.

## Testdækning

Kør `npm ci && npm test` i `apps/lectioplus/tests`. Alle **2.121 kontroller i 29 testsuiter** består. Test 22 har 55 nye kontroller for indtastning, decimaler, tomme felter, X/Y-par, reaktantmængder, layouts, backup, navigation og grundstofnavne. De tidligere tests dækker fortsat beregninger, øvrige værktøjer, skema, noter, privatliv og sprogmodel.

Automatiske kontroller bruger fiktive data og simuleret browser-DOM/API; den eksisterende modeltest kører også WASM/modellen. Layoutet er ikke visuelt liveverificeret på en indlogget Lectio-side. Afprøv derfor testpakken i din browser før udgivelse.
