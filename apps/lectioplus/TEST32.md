# Test 32 – Python-funktionerne i alle 125 opgaver

Denne testpakke gennemgår de fem niveauers eksisterende opgaver. Den tilføjer ingen nye opgaver; den retter opgavetestens behandling af gyldig Python og kontrollerer, at opgavernes funktioner og standardmoduler kan køre i det medfølgende miljø.

## Rettelser

- `input()`, `builtins.input()` og `from builtins import input` bruger nu samme testsvar. Spørgsmålsteksten tæller fortsat ikke med i det bedømte svar.
- `sys.stdin.readline()`, læsning af hele strømmen, iteration og `sys.stdin.buffer` kan bruge opgavens testdata. Hver test starter med sin egen UTF-8-strøm, og normal tilstand gendannes efter både succes og fejl.
- Når testdata slipper op, får Python `EOFError`, ligesom ved almindeligt `input()`. Tidligere kom der `StopIteration`.
- Mellemrum og ekstra tomme linjer bliver ikke længere fjernet før bedømmelse. Ét afsluttende linjeskift fra `print()` accepteres stadig.
- Hele tal sammenlignes præcist. Tidligere kunne eksempelvis 1.000.000.001 blive godkendt, selv om det rigtige svar var 1.000.000.000. Decimaltal har fortsat en lille tolerance for flydende komma, også når eksempelvis `sum([0.2]*10)` ligger en afrundingsfejl fra 2.

## Funktioner, som gennemgangen dækker

| Område | Eksempler fra opgaverne |
| --- | --- |
| Grundlæggende Python | `input`, `print`, `int`, `float`, `str`, `bool`, `None`, regneoperatorer, sammenligninger og f-strenge |
| Tekst | Indekser, slicing, `upper`, `lower`, `strip`, `replace`, `split`, `splitlines`, `join`, `startswith`, `endswith`, `ord` og `chr` |
| Samlinger | Lister, tuples, dictionaries, sets, `append`, `pop`, `get`, `setdefault`, `items`, `values`, `sorted` og `zip` |
| Kontrol og funktioner | `if`, `for`, `while`, `range`, `enumerate`, comprehensions, generatorudtryk, `lambda`, egne funktioner, rekursion, klasser og fejlhåndtering |
| Standardmoduler | `math`, `collections` (`Counter`, `deque`, `OrderedDict`), `csv`, `io`, `json`, `heapq` og `ast` |
| Sværere opgaver | Grafer, Dijkstra, dynamisk programmering, matricer, cache, søgning, sortering og sikker analyse af regneudtryk |

Det er rigtig CPython, der kører opgaverne. Gennemgangen er ikke en garanti for alle tænkelige Python-pakker eller programmer. Eksterne downloads, desktopvinduer og en fuld operativsystem-terminal er ikke en del af miljøet.

## Testomfang

`test32-lessons.cjs` kontrollerer først, at de 125 opgaver, som vises i udvidelsen, præcis matcher de gennemtestede opgaver. Derefter køres:

- **375 bedømmelser:** Hver opgaves tre testcases gennem den faktiske worker. Hver opgave får et nyt Python-miljø.
- **375 almindelige kørsler:** Samme referencekode og testcases gennem Kør program-grenen. De 25 programopgaver besvares via interaktive inputbeskeder. De 100 funktionsopgaver kaldes med deres argumenter og får kontrolleret returværdien.
- **38 nye regressionskontroller** i `workbench-runtime.mjs` for inputvarianter, EOF, oprydning, betydende mellemrum, ekstra linjeskift, store heltal, decimaltal og ikke-endelige tal.

Almindelig kørsel samles i én worker pr. niveau for at begrænse testtiden; hver enkelt referencekørsel får sit eget navnerum og egne argumenter. Det ændrer ikke elevens kode eller kørsel i produktet.

Hele testpakken køres med `npm test --prefix apps/lectioplus/tests`. Node 24 med JSPI bruges til de interaktive tests. Resultaterne ligger i `tests/TEST32_RESULTATER.txt` i ZIP-pakken. De øvrige tests dækker også terminalens Enter/Send svar, Stop, gentagne spørgsmål og tidsgrænser under ventetid.

Det er automatiske tests med rigtig Python, Node VM og JSDOM. Den installerede udvidelse i Chrome/Edge og en indlogget Lectio-side er ikke afprøvet her.

## Installation og brug

1. Pak hele ZIP-filen ud.
2. Kopiér alt i `extension` til den eksisterende installationsmappe, inklusive `vendor`.
3. Genindlæs udvidelsen på `chrome://extensions` eller `edge://extensions`.
4. Genindlæs derefter Lectio-fanen.
5. Åbn Hjælpemidler → Kodeværksted → Python-opgaver.

**Test min løsning** bruger opgavens testdata automatisk. **Kør program** kører den kode, du har skrevet; en funktion som `solve(...)` skal stadig kaldes, hvis du vil se noget fra den i en almindelig kørsel. Brug eksempelvis `print(solve(5))`, når funktionen tager ét tal. Inputspørgsmål besvares i terminalen som i Test 31.

Interaktivt input gælder `input()`. I fri kode kræver direkte læsning af `sys.stdin` fortsat Forudfyldte svar. Browserkrav og Stop-funktion er uændrede fra [Test 31](TEST31.md). HTML-demoen viser layoutet; Python kræver den installerede udvidelse.

Manifestversionen er fortsat 0.1.3. Denne pakke er en testlevering uden GitHub-push eller release.
