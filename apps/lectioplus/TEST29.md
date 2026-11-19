# Test 29 – Adgang til kodeværkstedets isolerede vindue

Test 28 stoppede med `LXP28-SANDBOX`. Konsolbillederne indeholder også en afvisning med teksten `Resources must be listed in the web_accessible_resources manifest key`. Den afviste adresse er samlet som `<URL>` i billedet, så det konkrete filnavn kan ikke bekræftes derfra.

Gennemgangen fandt, at `workbench-host.html` var webtilgængelig, men det indlejrede `workbench-sandbox.html` ikke var. Denne test tilføjer den præcise HTML-fil til den eksisterende regel for `https://lectio.dk/*` og `https://www.lectio.dk/*`. Det adresserer den mulige blokering ved indlejring fra Lectio. Filen forbliver i manifestets `sandbox.pages`; iframe-sandboxen og begge CSP-politikker er bevaret. Worker, startscript og vendor-filer er fortsat ikke webtilgængelige.

Der er ikke grundlag for at tilskrive alle konsolfejl til LectioPlus+. Fejl fra eksempelvis `index.js` kan ikke identificeres sikkert uden deres fulde kildeadresser.

## Øvrige ændringer

- Hosten kontrollerer først, at `workbench-sandbox.html` kan læses. Mangler filen, nævnes filnavnet direkte.
- Den installerede udvidelse bruger `chrome.runtime.getURL()` til iframe-adressen.
- `LXP29-SANDBOX-LOAD` betyder, at navigationen fejlede eller ikke udløste en indlæsningshændelse inden tidsgrænsen.
- `LXP29-SANDBOX-READY` betyder, at indlæsningshændelsen kom, men startscriptet ikke svarede. Browseren kan også udløse indlæsningshændelsen for en fejlside; hændelsen alene beviser derfor ikke, at sandboxen virker.
- Gentagne indlæsningshændelser kan ikke oprette flere kanaler eller forlænge tidsgrænsen. Sene hændelser fra et tidligere forsøg ignoreres.
- Andre opstartstrin beholder deres eksisterende `LXP28-...`-koder.

## Installation og afprøvning

1. Pak hele ZIP-filen ud. Kopiér indholdet af `extension` til den mappe, din eksisterende installation bruger. Både den nye `manifest.json` og `workbench-host.js` skal med.
2. Åbn `chrome://extensions` eller `edge://extensions`, og genindlæs LectioPlus+. En almindelig genindlæsning af Lectio-fanen indlæser ikke det ændrede manifest.
3. Genindlæs derefter Lectio-fanen. Hav kun én LectioPlus+-udgave aktiveret.
4. Åbn Hjælpemidler → Kodeværksted → Python → Fri kode, og kør:

```python
print("Hej fra terminalen!")
print(2 + 3)
```

Terminalen skal vise hilsenen og `5`. Prøv derefter en anden kørsel. Svar til `input()` skrives stadig før kørsel i fanen Input.

Hvis det fejler, send terminalens nye fejlkode. Ved en ny `Denying load`-fejl: fold den grupperede konsollinje ud, så filnavnet efter `chrome-extension://.../` er synligt. Der er ikke behov for loginoplysninger eller en eksport af hele Lectio-siden.

`SE_TESTEN.html` viser designet med fiktive data. Lokale runtimes kræver installationen og kan ikke prøves ved dobbeltklik på HTML-demoen.

## Kontroller og begrænsninger

`test29.cjs` kontrollerer manifestets præcise filliste og Lectio-afgrænsning, bevaret isolation, manglende HTML, korrekt installationsadresse, separate tidsgrænser, gentagne/sene indlæsningshændelser, oprydning og overgangen til worker-opstart. Den øvrige testsuite indeholder faktiske Python- og JavaScript-kørsler gennem simulerede browserkanaler.

Automatiske kontroller erstatter ikke en test af den installerede udvidelse i Chrome/Edge. Billederne er ikke nok til at bevise, at den afviste fil netop er sandboxens HTML. Rettelsen skal afprøves i brugerens browser før release.

Manifestversionen er fortsat `0.1.3`. Ingen GitHub-push eller release.

Referencer: [Chromes regler for webtilgængelige filer](https://developer.chrome.com/docs/extensions/reference/manifest/web-accessible-resources) og [Chromiums kontrol af ressourceadgang](https://chromium.googlesource.com/chromium/src/+/HEAD/extensions/renderer/resource_request_policy.cc). Den sidste beskriver bl.a. forskellen mellem et topvindue med udvidelsens oprindelse og indlejrede vinduer.
