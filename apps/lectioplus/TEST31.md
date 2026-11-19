# Test 31 – Python-input direkte i terminalen

Python spørger nu i terminalen, når programmet når `input()`. Et svarfelt åbner automatisk og får fokus. Skriv svaret og tryk Enter eller Send svar. Programmet fortsætter fra samme sted med sine eksisterende variabler; det bliver ikke kørt forfra.

## Prøv dette

```python
navn = input("Hvad hedder du? ")
alder = int(input("Hvor gammel er du? "))
print(f"Hej {navn}! Næste år bliver du {alder + 1}.")

for nummer in range(3):
    svar = input(f"Svar {nummer + 1}: ")
    print("Du skrev:", repr(svar))
```

Tomt Enter giver en tom streng, ligesom i Python. Danske bogstaver og mellemrum bevares. Hvert svar kan indeholde op til 4.096 tegn på én linje. Svar bliver vist som almindelig tekst i terminalen.

Stop program virker også, mens Python venter. Tidsgrænsen for kørsel tæller ikke den tid, du bruger på at svare. Flere spørgsmål giver ikke programmet en ny fuld tidsgrænse for hvert svar.

## Input-indstillingen

Under fanen Input findes **Python-input**:

- **Svar i terminalen** er standard. Tidligere forudfyldte svar bliver ikke brugt i denne tilstand.
- **Forudfyldte svar** lader dig skrive svar på forhånd, ét pr. linje.

Test min løsning bruger altid opgavens egne testdata uden at spørge. JavaScripts eksisterende `input()` og regex-tekstfeltet bevarer deres hidtidige funktion. Denne ændring gælder Pythons `input()`; den implementerer ikke en fuld operativsystem-terminal eller interaktiv `sys.stdin.readline()`.

## Installation

1. Pak hele ZIP-filen ud, og kopiér alt i `extension` til den eksisterende installationsmappe. Manifest, HTML, CSS og JavaScript skal opdateres samlet.
2. Genindlæs udvidelsen på `chrome://extensions` eller `edge://extensions`.
3. Genindlæs derefter Lectio-fanen, og åbn Hjælpemidler → Kodeværksted → Python → Fri kode.

Kommunikationsprotokollen er opdateret til version 3, så en blanding af nye og gamle opstartsfiler bliver afvist. Manifestets udgivelsesversion er stadig `0.1.3`. Ingen GitHub-push eller release.

## Hvordan det virker og begrænsninger

Den medfølgende Pyodide-runtime bruger `pyodide.ffi.run_sync()` og JavaScript Promise Integration (JSPI) til at vente på svaret uden at blokere beskeder til workeren. Funktionen virker også i løkker og funktioner. Python-spørgsmål sendes med et særskilt id gennem den eksisterende private forbindelse; kun svaret til den aktive forespørgsel accepteres. Gamle og dobbelte svar ignoreres. Host og klient pauser hver deres tidsgrænse under ventetiden.

Der er ikke tilføjet en server, et netværkskald, ekstra udvidelsestilladelser eller SharedArrayBuffer. Programmet kører fortsat i den isolerede klassiske worker fra Test 30. De interaktive svar gemmes ikke i indstillingerne.

Interaktivt input kræver en browser med JSPI; Pyodide dokumenterer understøttelse fra Chrome 137. En browser uden understøttelsen får en forklaring ved `input()` og kan vælge forudfyldte svar. `SE_TESTEN.html` viser stadig designet; den installerede udvidelse er nødvendig for Python-kørsel.

## Test

- `test31-runtime.cjs`: faktisk Python med JSPI, gentagne spørgsmål i funktion/løkke, tom linje, Unicode, mellemrum, forældede svar, normal konvertering og ValueError, trace, forudfyldt tilstand, automatisk opgavebedømmelse og manglende JSPI.
- `test31-ui.cjs`: faktisk Python-output og svar gennem JSDOM-terminalen, fokus, Enter, Send svar, ekko, tekstsikkerhed, Stop, oprydning og valg af inputtilstand.
- `test31-transport.cjs`: klient, host og sandbox, validering af svar, afbrydelse, særskilte anmodnings-id'er og tidsbudgetter med simuleret to minutters ventetid.

De to første tests køres med Node 24 og `--experimental-vm-modules --experimental-wasm-jspi`. Hele testpakken inkluderer dem. Tests er ikke en liveprøve på en indlogget Lectio-side eller af Chromes CSP; afprøv pakken i browseren før release.

Kilde: [Pyodides forklaring af JSPI, input og run_sync](https://blog.pyodide.org/posts/jspi/).
