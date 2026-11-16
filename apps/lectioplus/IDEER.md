# LectioPlus+ – idéliste

Opdateret 16. november 2026.

Status: alle 18 forslag er implementeret i Test 13. Der er desuden tilføjet komma-/punktumhjælp, navngivne noter pr. fag, oversætter uden konto/nøgle og Strafe Clicker fra som standard. Se `TEST13.md` for placering, omfang og begrænsninger. Pakken leveres til afprøvning før offentlig udgivelse; indlogget og visuel browserverifikation mangler fortsat.

Test 14 følger op med konkrete stabilitetsrettelser til Anonym, noter og oversættelse. Se `TEST14.md`.

## Første otte forslag

1. **Værktøjspanel ved siden af lektier.** Åbn lommeregner, noter eller formelsamling uden at skjule opgaveteksten. Panelets bredde kan ændres.
2. **Reparér visningen.** Genopbyg LectioPlus+-design ved en blandet eller ødelagt visning uden at nulstille indstillinger. Supplér med flere tests af opstart og navigation på rigtige Lectio-sider.
3. **Atom og ion ved siden af hinanden.** Vis elektronafgivelse eller -optagelse og ændret ladning med kontrollerede iondata.
4. **Sammenlign grundstoffer og isotoper.** To modeller med fremhævede forskelle i protoner, neutroner, elektroner og skaller.
5. **Søgbar formelsamling.** Fag, emner, symbolforklaringer, enheder, eksempler og direkte adgang til relevant beregner.
6. **Interaktive grafer og figurer.** Skydere til eksempelvis koefficienter i en parabel samt mål i trekanter og vektorer.
7. **Reaktionsberegner.** Udbyg afstemning med stofmængder, begrænsende reaktant og teoretisk udbytte, med tydelige modelantagelser.
8. **Samlet beregningsark.** Saml valgte resultater, figurer og egne noter fra flere værktøjer; navngiv, kopiér og udskriv dem.

## Yderligere forslag

9. **Drejelige molekylemodeller.** Et kontrolleret udvalg af fx H₂O, CO₂ og CH₄ med farveforklaring, bindinger og molekylgeometri. Modeller skal komme fra verificerede strukturer; en indtastet formel er ikke alene nok til at bestemme strukturen.
10. **Forsøgsrapport og måleskema.** Struktur til formål, hypotese, udstyr, fremgangsmåde, egne målinger, fejlkilder og konklusion. Målinger kan sendes til eksisterende graf- og statistikværktøjer. Ingen opfundne målinger eller konklusioner.
11. **Betydende cifre og måleusikkerhed.** Hjælp til afrunding, videnskabelig notation og simple beregninger med måleusikkerhed, med forklaring af den valgte metode.
12. **Byg et simpelt elektrisk kredsløb.** Serie- og parallelkobling af ohmske modstande med en ideel jævnspændingskilde; vis strøm, spænding og samlet modstand i en figur.
13. **Sandsynlighedsforsøg.** Simulér terningekast eller møntkast og sammenlign observerede frekvenser med den teoretiske fordeling. Vis tydeligt, at simulation er tilfældig.
14. **Flashcards med gentagelsesplan.** Byg videre på de eksisterende kort: vurder sværhedsgrad, gentag svære kort oftere og vis egne fremskridt. Ikke afhængigt af AI.
15. **Personlig opgavetavle.** Egne opgaver og delmål kan trækkes mellem Ikke startet, I gang og Færdig, med fag og eget tidsestimat. Personlige markeringer skal være tydeligt adskilt fra Lectios afleveringsstatus.
16. **Faglig ordliste.** Søg korte forklaringer på fx mol, isotop, hældning og standardafvigelse; se dansk og engelsk betegnelse samt link til værktøj eller eksempel.
17. **Profiler til forskellige situationer.** Gem opsætninger som Skoledag, Lektielæsning og Minimal visning, og skift mellem dem uden at ændre hver indstilling manuelt. Ingen ændringer af de udeladte login- eller eksamenssider.
18. **Egne værktøjsopsætninger.** Gem navngivne sæt af egne input, aksegrænser og enhedsvalg, og indlæs dem igen i det relevante værktøj. Udbygger eksisterende favoritter med genbrug af en konkret opsætning.

## Ved videreudvikling

- Kontrollér først den aktuelle kode, så eksisterende funktioner udbygges uden dubletter.
- Prioritér stabilitet og brugervenlighed sammen med nye funktioner.
- Behold den eksisterende beslutning om ingen AI.
- Nye faglige modeller kræver kildekontrol, domænevalidering og relevante tests.
- Se TEST13.md for den implementerede første udgaves omfang og begrænsninger.

Test 15 udvider Molekyler i 3D med en atom-/bindingsbygger og 15 strukturbaserede opslag. Komma og punktum har nu automatisk indsættelse i et redigerbart resultatfelt. Se `TEST15.md`; begge dele leveres som test før udgivelse.

Test 17 gør det automatisk fundne molekylnavn synligt ved byggefeltet og retter dokumenterede fejl i den lokale tegnsætningsmotor. Den er fortsat en begrænset dansk skrivehjælp, ikke en fuld grammatikkontrol. Se `TEST17.md`.
