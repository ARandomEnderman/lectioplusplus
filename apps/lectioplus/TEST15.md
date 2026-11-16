# LectioPlus+ – Test 15

Testpakke fra 16. november 2026. Indeholder Test 14 samt automatisk tegnsætningshjælp og en molekylebygger. Ingen GitHub-release er oprettet; manifestversionen er fortsat 0.1.3.

## Molekyler i 3D → Byg selv

Find **HjælpeMiddler → Kemi → Molekyler i 3D**, og vælg **Visning → Byg selv**.

- Træk H, C, N, O eller Cl ind i byggefeltet. Et klik på grundstoffets knap tilføjer også et atom. Slipper du et nyt atom tæt på et atom med en ledig binding, tilføjes en enkeltbinding.
- Vælg **Forbind atomer**, og tryk på to atomer. Vælg enkelt-, dobbelt- eller tripelbinding. Alternativt kan du bruge felterne **Valgt atom**, **Forbind med** og **Forbind valgte atomer**.
- **Tilføj manglende H** udfylder ledige bindinger med eksplicitte hydrogenatomer. Der tilføjes højst 24 atomer i alt.
- Flyt atomer med mus/touch eller piletaster. Enter/mellemrum vælger eller forbinder et fokuseret atom; Delete sletter det. Dybdeskyderen flytter det valgte atom foran eller bag det øvrige byggefelt.
- Formlen og navnet opdateres automatisk. Identifikationen sammenligner både grundstoffer og bindingsnetværk med 15 kontrollerede eksempler. Den er uafhængig af atomrækkefølge og placering.
- **Fortryd ændring** gemmer op til 40 trin. Gem hele strukturen med **Gem denne opsætning**. Et genkendt resultat kan gemmes på beregningsarket.
- De oprindelige tre referencevisninger af vand, kuldioxid og metan findes fortsat under **Se modeller**.

Farverne vises også under modellen: H lys, C grå, N blå, O rød og Cl grøn. Farverne angiver grundstoffer, ikke protoner eller elektroner.

### Kendte molekyler

| Navn | Formel | PubChem CID |
|---|---|---|
| Vand | H₂O | 962 |
| Brint | H₂ | 783 |
| Ilt | O₂ | 977 |
| Kvælstof | N₂ | 947 |
| Ammoniak | NH₃ | 222 |
| Metan | CH₄ | 297 |
| Kuldioxid | CO₂ | 280 |
| Hydrogenchlorid | HCl | 313 |
| Ethan | C₂H₆ | 6324 |
| Ethen | C₂H₄ | 6325 |
| Ethyn | C₂H₂ | 6326 |
| Methanol | CH₄O | 887 |
| Ethanol | C₂H₆O | 702 |
| Dimethylether | C₂H₆O | 8254 |
| Hydrogenperoxid | H₂O₂ | 784 |

Ethanol og dimethylether har samme formel, men genkendes som forskellige stoffer på grund af bindingerne. Hydrogenchlorid navngives ikke som saltsyre, som er en vandig opløsning.

Byggeren er en afgrænset undervisningsmodel: neutrale strukturer med H/Cl 1, O 2, N 3 og C 4 bindinger. Ladninger, radikaler, aromatiske systemer, stereokemi og kemisk stabilitet beregnes ikke. En struktur uden manglende bindinger er ikke nødvendigvis et kendt eller stabilt stof. Ukendte strukturer, ufuldstændige bindinger og adskilte dele får derfor ingen gættede navne. 3D-visningen viser brugerens skitse; den beregner ikke ligevægtsgeometri eller energi. De ekstra eksemplers udgangskoordinater er flade tegninger.

Strukturdata er hentet fra [PubChem PUG REST](https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/962/JSON?record_type=2d) den 16. november 2026 for tabellens CIDs; alle H-atomer og bindingsordener er eksplicitte. [Lewis-strukturer og bindinger, OpenStax](https://openstax.org/books/chemistry-2e/pages/7-3-lewis-symbols-and-structures) forklarer modellens grundlag. Genkendte molekyler har et direkte PubChem-link i værktøjet.

## Komma og punktum

**Ret komma og punktum** indsætter alle fundne ændringer i et redigerbart resultatfelt med ét klik. Originalen står ved siden af. **Kopiér rettet tekst** kopierer resultatet; **Brug den viste tekst** sætter det ind i kildefeltet og kan fortrydes. Forslag kan stadig vælges enkeltvis under **Se og vælg ændringer**, eller findes manuelt med **Find forslag**.

Der er valg mellem med/uden nye startkommaer og mellem at rette/bevare begyndelsesbogstaver. Reglerne håndterer almindelige ledsætninger, helsætninger med forskellige grundled, enkle indskudte relativsætninger, mulige nye sætninger, sluttegn og mellemrum. Links, e-mailadresser, almindelige filnavne/domæner, decimaler, klokkeslæt, forkortelser, kode og citerede tekststykker beskyttes mod de almindelige rettelser.

Eksempel:

> jeg er træt men jeg skal lave lektier bagefter vil jeg slappe af

bliver til:

> Jeg er træt, men jeg skal lave lektier. Bagefter vil jeg slappe af.

Hjælpen kører lokalt uden login, AI eller eksterne tekstkald og gemmer ikke teksten automatisk. Den bruger en begrænset liste af danske sætningsmønstre, ikke en komplet sproglig parser. Gennemlæs derfor resultatet, især nye punktummer og lange, tvetydige sætninger. Valget uden startkomma fjerner ikke eksisterende kommaer. Maksimum er 12.000 tegn pr. rettelse.

Regelgrundlag: [Dansk Sprognævn/Sproget.dk om komma](https://sproget.dk/typiske-problemer/komma/), [punktum](https://sproget.dk/typiske-problemer/punktum/) og [store begyndelsesbogstaver](https://sproget.dk/typiske-problemer/store-eller-smaa-bogstaver/).

## Afprøvning

Pak ZIP-filen ud og åbn **SE_TESTEN.html** for demoen med fiktive data. **START_HER.txt** beskriver installation i Chrome/Edge og bevarelse af indstillinger.

**1.640 automatiske kontroller i 22 testsuiter er bestået**, heraf 151 kontroller i den nye Test 15-suite. De automatiske kontroller omfatter tegnsætningens output, gentagen rettelse, beskyttet notation, startkomma-valg, kopiering/fortryd, alle 15 molekyler, omnummererede atomer, isomerer, manglende/ugyldige bindinger, ukendte strukturer, træk, afbrudte træk, tastatur, gemte strukturer og beregningsark. Resultatloggen følger med i `tests/TESTRESULTATER.txt`.

Kontrollerne bruger kode og DOM med fiktive data. Denne pakke er ikke visuelt gennemgået i browseren eller afprøvet på alle indloggede Lectio-sider.
