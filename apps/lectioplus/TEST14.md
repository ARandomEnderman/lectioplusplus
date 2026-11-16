# LectioPlus+ – Test 14

Testpakke fra 16. november 2026. Bygger videre på Test 13 og indeholder alle dens funktioner, herunder 54 værktøjer. Denne omgang retter konkrete fejl i Anonym, noter og oversættelse. Ingen GitHub-release er oprettet.

## Rettelser

| Område | Ny adfærd |
|---|---|
| Anonym ved opdateret tekst | Hele det fulde navn kontrolleres igen, når Lectio ændrer teksten. Hvis én del af et navn opdelt over flere elementer ændres, bliver resten ikke hængende som Anonym. |
| Navne med bindestreg | Et længere navn, som blot indeholder brugerens fulde navn som en del, skjules ikke delvist. |
| Profilbilleder og gentagne opdateringer | Uændrede billedmarkeringer og navnemasker genbruges. Gentagne opdateringer omskriver ikke DOM'en uden grund. |
| Notehandlinger | Noteskrivning og noteskift låses kortvarigt under gemning, oprettelse, sletning og gendannelse. Kun den valgte note kan slettes. |
| Ændringer fra andre faner | Gemning og sletning kontrollerer den senest observerede note igen, når handlingen faktisk udføres. Ved konflikt vises en besked; en lokal kladde bevares. Dette er ikke en garanti mod helt samtidige lageroperationer i to faner. |
| Maksimalt antal noter | Kapaciteten kontrolleres igen ved udførelsen, så en ventende oprettelse ikke lydløst bliver klippet væk ved grænsen på 40 noter. |
| Oversættelsens formatering | Linjeskift, blanke linjer og mellemrum ved opdeling bevares. Der indsættes ikke automatisk et mellemrum midt i et langt ord eller tekst uden ordmellemrum. |
| Markeret tekst | En markering over grænsen på 2.000 tegn giver en besked. En ældre markering bliver ikke brugt i stedet. |
| Oversætterens brugerflade | Tegntæller, markering af for lang tekst og automatisk skriveretning i begge felter. Et gammelt svar ryddes, når der forsøges igen. |
| Langsom oversættelse | Højst 24 tekststykker og samlet tidsbudget på 45 sekunder; hvert kald har stadig højst 12 sekunder. Mange korte linjer afvises før første kald med besked om at vælge et mindre udsnit. |

## Sådan prøver du den

1. Pak ZIP-filen ud, og åbn **SE_TESTEN.html**. Demoen bruger fiktive data.
2. Under **Indstillinger → Udseende**: prøv **Vis mit navn som Anonym**, og åbn Profil i demoen.
3. Under **HjælpeMiddler → Mine noter**: opret to noter, gem, skift, slet og fortryd.
4. I **Oversætter**: prøv et par korte afsnit med en blank linje mellem. Tekst sendes kun, når du trykker Oversæt. Der kræves ingen konto eller API-nøgle.
5. På rigtigt Lectio: brug installationsvejledningen i **START_HER.txt**. Kun én LectioPlus+-udgave må være aktiv ad gangen.

## Kontrol og afgrænsning

1.489 automatiske kontroller i 21 testsuiter er bestået, heraf 39 nye kontroller af de rettede situationer. Loggen følger med i `tests/TESTRESULTATER.txt`. En ny regressionstest af delvis anonymisering blev også kørt mod den tidligere Test 13-pakke og fejlede der som forventet.

Testene kontrollerer beregninger og DOM-adfærd med fiktive data. Den færdige, selvstændige demo kontrolleres særskilt for blandt andet navigation, lektier, lommeregner, atommodel, noter, oversætter og Anonym. Der er ikke foretaget en visuel eller indlogget gennemgang af alle rigtige Lectio-sider.

Anonym er fortsat en visningsindstilling. Navnet kan stadig findes i Lectios data og ved kopiering eller eksport. Skrivefelter, PDF'er og tekst inde i billeder ændres ikke. Identitetsopslag kan fejle; i så fald gættes der ikke. Billedindstillingen skjuler personbilleder generelt, også i elevlister og kort. Se `TEST13.md` for øvrige modelantagelser og kilder.
