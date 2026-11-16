# LectioPlus+ – Test 17

Opfølgning på navnevisningen i Molekyler i 3D og fejl i den danske tegnsætningshjælp. Alle funktioner og rettelser fra Test 16 følger med.

## Molekylets navn ved byggefeltet

I **Molekyler i 3D → Visning → Byg selv** står et felt med **Molekylets navn** direkte over byggefeltet. Det opdateres automatisk, når du ændrer atomer eller bindinger. Fx vises Vand sammen med H2O, når vandstrukturen er færdig.

Hvis der mangler bindinger eller H-atomer, forklarer feltet det og henviser til **Tilføj manglende H**. Adskilte atomer skal forbindes først. Når du rydder eller ændrer strukturen, fjernes et navn, som ikke længere passer. Fortryd gendanner navnet sammen med strukturen.

Kataloget indeholder fortsat de 15 kontrollerede molekyler fra Test 15. Det er ikke et universelt system til navngivning af alle molekyler. Ukendte strukturer får beskeden **Navnet findes ikke i kataloget**. Flytning og rotation udløser ikke gentagne skærmlæseroplæsninger af det samme navn.

## Rettelser i Komma og punktum

Den tidligere motor kunne overse almindelige ledsætninger og sætte punktum midt i dem. Rettelserne udvider genkendelsen af:

- Hv-led som “hvad de skulle”, “hvem af os der kommer” og “hvilken bog jeg læser”. De må ikke deles efter hv-ordet eller få et ekstra komma foran det tilhørende “der”.
- Navneord, tillægsord og biord i grundled, fx “solen langsomt begyndte” og “de første mennesker begyndte”.
- Udvalgte relativsætninger med udeladt “som”, fx “den bog, du gav mig”.
- Indledende ledsætninger med “før”, slutkomma og almindelige forbindelser som “uden at” og “efter at”.
- Fælles grundled med “og”, fx “solen og månen”, som ikke skal skilles med komma.
- Forskel på almindelige direkte spørgsmål og udvalgte hv-sætninger, der er en del af en anden sætning.

Eksempel på en rettet fejl:

> Da jeg kom ned i køkkenet, kunne jeg se, at min familie allerede sad ved bordet, mens de snakkede om, hvad de skulle lave i løbet af dagen.

Der sættes ikke længere et punktum mellem “hvad” og “de” i dette eksempel.

**Brug originalteksten, når du prøver den nye version.** Hjælpen fjerner ikke vilkårlige eksisterende punktummer eller kommaer. Derfor kan et forkert punktum fra en tidligere rettelse stadig blive stående, hvis du bruger det gamle resultat som ny kildetekst.

Motoren er fortsat lokal, på dansk og uden login eller AI. Den anvender afgrænsede mønstre og et udvidet udvalg af udsagnsord. Den er ikke en fuld grammatisk parser og garanterer ikke korrekt tegnsætning i alle tekster. Lange, tvetydige eller indviklede sætninger kan fortsat kræve manuel rettelse. Brugerfladen beskriver derfor resultatet som et forslag, der skal gennemlæses.

Regelgrundlag: [Sproget.dk – kommagrammatik](https://sproget.dk/typiske-problemer/komma/kommagrammatik/) og [komma](https://sproget.dk/typiske-problemer/komma/). Værktøjet implementerer kun en del af de beskrevne konstruktioner.

## Kontrol

**1.769 automatiske kontroller i 23 testsuiter er bestået.** Loggen ligger i `tests/TESTRESULTATER.txt`.

`test17.cjs` indeholder 111 nye kontroller. De 39 faste teksteksempler dækker både fejl og allerede korrekt tekst; hver rettelse kontrolleres også ved en gentagen kørsel. Test 16 gav forkert output i 26 af netop disse eksempler; den nye version består alle 39. Dette er en regressionstest af udvalgte konstruktioner, ikke et mål for kvaliteten på vilkårlig dansk tekst.

De øvrige nye kontroller omfatter startkomma til/fra, alle 15 molekylers navne ved byggefeltet, ukendte/ufærdige strukturer, ryd/fortryd, skærmlæseropdateringer og knappen til automatisk tegnsætning.

Pak ud, og åbn **SE_TESTEN.html**, eller se **START_HER.txt** for installation. Testene bruger fiktive data og DOM-kontrol. Denne pakke er ikke visuelt afprøvet i browseren eller på alle indloggede Lectio-sider. Ingen ændringer er pushet til GitHub eller udgivet som release.
