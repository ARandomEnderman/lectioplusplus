# LectioPlus+ – Test 16

Retter ikonnavne som `smsbookmark` foran lektionsnavnet i Lektier. Lectios ikonfonte bruger tekst som `sms` og `bookmark` til at vælge en lille grafik. Udtrækningen læste tidligere disse tekster sammen med lektionsnavnet.

Tekstudtrækningen filtrerer nu ikonernes DOM-elementer fra. Det omfatter titler, almindelige tabelværdier og skematekst. Lektiekortenes indhold og materialelinks bruger samme filtrering. Rigtige ord som sms eller bookmark i lektieteksten bevares. Lectios oprindelige elementer, links og handlinger ændres ikke.

Der er tilføjet 18 kontroller i `tests/homework.cjs`. Testen genskaber fejlen med fiktive lektionsdata og fejler som forventet mod den gamle Test 15-pakke. Den nye kode består både titel-/linkkontroller, bevarelse af almindelig tekst, forskellige ikonfont-klasser og dynamiske ikonændringer.

**1.658 automatiske kontroller i 22 testsuiter er bestået.** Resultatloggen følger med i `tests/TESTRESULTATER.txt`.

Alle funktioner fra Test 15 følger med, inklusive molekylebygger og automatisk komma-/punktumhjælp. Se `TEST15.md` for vejledning til disse.

Pak ud, og åbn `SE_TESTEN.html`, eller følg `START_HER.txt` for installation. Dette er en testpakke; ingen ændringer er pushet til GitHub eller udgivet som release. Der er ikke foretaget en ny visuel eller indlogget browsergennemgang.
