"""Build original teaching exercises and verify their reference answers locally.
No uploaded classroom files or student solutions are included in this data.
"""
from pathlib import Path
import contextlib, io, json

LESSONS=[]
def exercise(level,title,prompt,code,cases,params=None,hints=None,concept=''):
    number=1+sum(x['level']==level for x in LESSONS)
    mode='program' if params is None else 'function'
    reference=code if params is None else 'def solve('+params+'):\n'+'\n'.join('    '+line for line in code.splitlines())
    tests=[]
    for case in cases:
        scope={}; out=io.StringIO()
        if params is None:
            answers=iter(case);scope['input']=lambda prompt='':next(answers)
        with contextlib.redirect_stdout(out):
            exec(reference,scope)
            answer=out.getvalue().removesuffix('\n') if params is None else scope['solve'](*case)
        tests.append({('stdin' if params is None else 'args'):case,'expected':answer})
    starter='# Skriv din løsning her.\n' if params is None else 'def solve('+params+'):\n    # Skriv din løsning her, og returnér svaret.\n    pass\n'
    LESSONS.append(dict(level=level,number=number,title=title,prompt=prompt,mode=mode,entry='' if params is None else 'solve',starter=starter,tests=tests,
        concept=concept or ('Læs input i den nævnte rækkefølge. Udskriv kun det ønskede svar; spørgsmål i input() ignoreres af testene.' if params is None else 'Behold funktionsnavnet solve og parametrene. Brug return til resultatet. Testene kalder funktionen med forskellige værdier.'),
        hints=hints or ['Start med et enkelt af eksemplerne.','Kontrollér også tomme værdier, nul eller grænser, når de er tilladt.'],reference=reference))

# Level 1: topics covered by the supplied introductory material.
exercise(1,'Mit første print','Udskriv præcis: Hej Python!','print("Hej Python!")',[[],[],[]],hints=['print() viser tekst.','Tekst skal stå i anførselstegn.'])
exercise(1,'Personlig hilsen','Læs et navn og udskriv Hej NAVN! Bevar stavning og mellemrum.','navn=input()\nprint(f"Hej {navn}!")',[['Elev'],['Ada'],['Ægir Ø']])
exercise(1,'To tal lægges sammen','Læs to heltal på hver sin linje. Udskriv summen.','a=int(input())\nb=int(input())\nprint(a+b)',[['2','3'],['-4','7'],['0','0']])
exercise(1,'Rektanglets areal','Læs bredde og højde som heltal. Udskriv arealet.','b=int(input())\nh=int(input())\nprint(b*h)',[['3','4'],['0','7'],['12','5']])
exercise(1,'Pris med decimaler','Læs en pris som decimaltal. Udskriv den med præcis to decimaler og punktum.','pris=float(input())\nprint(f"{pris:.2f}")',[['12.5'],['0'],['19.999']])
exercise(1,'Ordets længde','Læs en tekstlinje og udskriv antal tegn inklusive mellemrum.','tekst=input()\nprint(len(tekst))',[['Python'],['to ord'],['']])
exercise(1,'Store bogstaver','Læs tekst og udskriv den med store bogstaver.','print(input().upper())',[['hej'],['Æble'],['PyThOn 3']])
exercise(1,'Små bogstaver','Læs tekst og udskriv den med små bogstaver.','print(input().lower())',[['HEJ'],['ØVELSE'],['A1 B2']])
exercise(1,'Fjern yderste mellemrum','Læs tekst og fjern mellemrum i begyndelsen og slutningen. Bevar mellemrum inde i teksten.','print(input().strip())',[['  hej  '],[' to  ord '],['   ']])
exercise(1,'Første og sidste tegn','Læs en ikke-tom tekst. Udskriv første og sidste tegn adskilt af et mellemrum.','s=input()\nprint(s[0],s[-1])',[['Python'],['A'],['Øvelse']])
exercise(1,'Læs bagfra','Læs tekst og udskriv den i omvendt rækkefølge.','print(input()[::-1])',[['abc'],['12345'],['']])
exercise(1,'Gentag en besked','Læs en tekst og derefter et ikke-negativt heltal. Udskriv teksten gentaget det antal gange uden ekstra mellemrum.','s=input()\nn=int(input())\nprint(s*n)',[['ha','3'],['x','0'],['ab','2']])
exercise(1,'Minutter til sekunder','Læs et helt antal minutter og udskriv antal sekunder.','print(int(input())*60)',[['3'],['0'],['125']])
exercise(1,'Sekunder til min:sek','Læs et ikke-negativt helt antal sekunder. Udskriv minutter:sekunder, hvor sekunder altid har to cifre.','s=int(input())\nprint(f"{s//60}:{s%60:02d}")',[['65'],['0'],['600']])
exercise(1,'Temperatur','Læs grader Celsius som decimaltal. Udskriv Fahrenheit med én decimal. Brug F=C*9/5+32.','c=float(input())\nprint(f"{c*9/5+32:.1f}")',[['0'],['100'],['-40']])
exercise(1,'Pris gange antal','Læs stykpris som decimaltal og antal som heltal. Udskriv totalen med to decimaler.','pris=float(input())\nantal=int(input())\nprint(f"{pris*antal:.2f}")',[['7.5','4'],['2','0'],['12.25','3']])
exercise(1,'Rabat','Læs førprisen og rabatprocenten som decimaltal. Udskriv slutprisen med to decimaler.','p=float(input())\nr=float(input())\nprint(f"{p*(1-r/100):.2f}")',[['200','15'],['10','0'],['80','100']])
exercise(1,'Del en regning','Læs en samlet pris og et positivt helt antal personer. Udskriv pris pr. person med to decimaler.','p=float(input())\nn=int(input())\nprint(f"{p/n:.2f}")',[['120','4'],['100','3'],['0','5']])
exercise(1,'Gennemsnit af tre','Læs tre decimaltal. Udskriv deres gennemsnit med to decimaler.','a=float(input())\nb=float(input())\nc=float(input())\nprint(f"{(a+b+c)/3:.2f}")',[['1','2','3'],['-4','0','4'],['1','1','2']])
exercise(1,'Er tallene ens?','Læs to heltal. Udskriv True hvis de er ens, ellers False.','a=int(input())\nb=int(input())\nprint(a==b)',[['2','2'],['2','3'],['-1','-1']])
exercise(1,'Inden for intervallet','Læs et heltal. Udskriv True hvis det ligger fra 10 til 20 inklusive, ellers False.','n=int(input())\nprint(10<=n<=20)',[['10'],['20'],['9']])
exercise(1,'Find et ord','Læs først en tekst og derefter et søgeord. Udskriv True hvis søgeordet findes i teksten. Store/små bogstaver skal have betydning.','tekst=input()\nord=input()\nprint(ord in tekst)',[['en rød bil','rød'],['Python','python'],['abc','']])
exercise(1,'Erstat et ord','Læs tekst, gammelt ord og nyt ord. Udskift alle forekomster og udskriv teksten. Det gamle ord er ikke tomt.','tekst=input()\ngammel=input()\nny=input()\nprint(tekst.replace(gammel,ny))',[['kat kat','kat','hund'],['abc','x','y'],['aaa','a','b']])
exercise(1,'None og tom tekst','Læs tekst. Opret variablen svar med værdien None. Udskriv først svar is None og derefter om den indtastede tekst er tom, på hver sin linje.','tekst=input()\nsvar=None\nprint(svar is None)\nprint(tekst=="")',[[''],['hej'],[' ']])
exercise(1,'En lille ordhistorie','Læs et navn, et sted og en ting. Udskriv præcis to linjer: NAVN fandt TING i STED. og NAVN tog TING med hjem.','navn=input()\nsted=input()\nting=input()\nprint(f"{navn} fandt {ting} i {sted}.")\nprint(f"{navn} tog {ting} med hjem.")',[['Ada','parken','en nøgle'],['Bo','byen','et kort'],['Ægir','det gamle hus','en rød kasse']])

# Level 2: given function wrapper; focus on branches and loops.
def e2(title,prompt,params,code,cases,hints=None):exercise(2,title,prompt,code,cases,params,hints)
e2('Lige eller ulige','Returnér "lige" for lige heltal og "ulige" ellers.','n','return "lige" if n%2==0 else "ulige"',[[2],[3],[-4]])
e2('Talets fortegn','Returnér "positiv", "negativ" eller "nul".','n','return "positiv" if n>0 else "negativ" if n<0 else "nul"',[[4],[-2],[0]])
e2('Størst af tre','Returnér det største af tre tal.','a,b,c','return max(a,b,c)',[[1,7,3],[-2,-9,-1],[4,4,4]])
e2('Billetpriser','En billet koster 40 under 12 år, 60 fra 12 til 17 år og 90 fra 18 år. Returnér prisen. Alder er ikke-negativ.','alder','return 40 if alder<12 else 60 if alder<18 else 90',[[11],[12],[18]])
e2('Skudår','Returnér om et positivt år er skudår: deleligt med 4, men århundreder kun hvis delelige med 400.','aar','return aar%4==0 and (aar%100!=0 or aar%400==0)',[[2024],[1900],[2000]])
e2('Gyldig trekant','Returnér om tre længder kan danne en trekant med positivt areal.','a,b,c','return min(a,b,c)>0 and a+b>c and a+c>b and b+c>a',[[3,4,5],[1,2,3],[-1,3,3]])
e2('Sum fra 1 til n','Returnér 1+2+...+n. n er et ikke-negativt heltal.','n','return sum(range(1,n+1))',[[5],[0],[100]])
e2('Alle lige tal','Returnér en liste med de lige tal fra 0 til og med n. n er ikke-negativ.','n','return list(range(0,n+1,2))',[[6],[1],[0]])
e2('Tæl positive tal','Returnér antallet af tal større end 0 i listen.','tal','return sum(1 for x in tal if x>0)',[[[-1,0,2,3]],[[]],[[0,0]]])
e2('Sum af positive tal','Returnér summen af listens positive tal.','tal','return sum(x for x in tal if x>0)',[[[-2,3,4]],[[]],[[-4,-1]]])
e2('Gangetabel','Returnér de første ti positive multipla af n som en liste.','n','return [n*i for i in range(1,11)]',[[3],[0],[-2]])
e2('Fakultet','Returnér n! for heltal 0–10. Husk at 0! = 1.','n','svar=1\nfor i in range(1,n+1):\n    svar*=i\nreturn svar',[[0],[5],[10]])
e2('Fibonacci','Returnér de første n Fibonacci-tal. Start med 0, 1. n er 0–30.','n','a,b=0,1\nsvar=[]\nfor _ in range(n):\n    svar.append(a)\n    a,b=b,a+b\nreturn svar',[[0],[1],[8]])
e2('Tæl vokaler','Returnér antal a, e, i, o, u, y, æ, ø og å. Ignorér store/små bogstaver.','tekst','return sum(ch in "aeiouyæøå" for ch in tekst.lower())',[['Æblegrød'],['xyz'],['']])
e2('Palindrom','Returnér om teksten er ens forfra og bagfra. Ignorér store/små bogstaver og mellemrum; andre tegn bevares.','tekst','s=tekst.lower().replace(" ","")\nreturn s==s[::-1]',[['Anna'],['to ord'],['Never odd or even']])
e2('Fjern tomme strenge','Returnér listen uden strenge med længde 0. En streng med et mellemrum bevares.','ord','return [x for x in ord if x!=""]',[[['a','','b']],[[' ','']],[[]]])
e2('Find første større tal','Returnér det første tal i listen, som er større end grænsen, ellers None.','tal,graense','for x in tal:\n    if x>graense:\n        return x\nreturn None',[[[1,7,4],3],[[1,2],5],[[],0]])
e2('Begræns en værdi','Returnér x begrænset til intervallet [lav, høj]. lav er højst høj.','x,lav,hoej','return min(hoej,max(lav,x))',[[12,0,10],[-3,0,10],[4,0,10]])
e2('Ciffersum','Returnér summen af decimalcifrene i et ikke-negativt heltal.','n','return sum(int(c) for c in str(n))',[[123],[0],[9008]])
e2('Antal cifre','Returnér antal decimalcifre i et heltal; et minus tæller ikke som et ciffer.','n','return len(str(abs(n)))',[[0],[-123],[10000]])
e2('FizzBuzz','Returnér en liste fra 1 til n. Tal delelige med 3 erstattes af "Fizz", med 5 af "Buzz", med begge af "FizzBuzz". Andre tal er tekst.','n','return ["FizzBuzz" if i%15==0 else "Fizz" if i%3==0 else "Buzz" if i%5==0 else str(i) for i in range(1,n+1)]',[[0],[5],[15]])
e2('Største tal uden tom fejl','Returnér listens største tal eller None, hvis listen er tom.','tal','return max(tal) if tal else None',[[[2,8,1]],[[]],[[-9,-3]]])
e2('Adgangskodens grundkrav','Returnér True ved mindst 8 tegn, mindst ét ASCII-ciffer og mindst ét ASCII-stort bogstav. Ellers False.','tekst','return len(tekst)>=8 and any(c in "0123456789" for c in tekst) and any(c in "ABCDEFGHIJKLMNOPQRSTUVWXYZ" for c in tekst)',[['Password1'],['password1'],['A1kort']])
e2('Gentagne fordoblinger','Start ved 1. Returnér hvor mange fordoblinger der kræves for at nå mindst målet. målet er positivt.','maal','n=1\nantal=0\nwhile n<maal:\n    n*=2\n    antal+=1\nreturn antal',[[1],[9],[32]])
e2('Er listen sorteret?','Returnér om listen er sorteret stigende eller med ens nabotal. En tom liste er sorteret.','tal','return all(tal[i]<=tal[i+1] for i in range(len(tal)-1))',[[[1,1,3]],[[3,2]],[[]]])

# Level 3: structured data, reusable functions and text.
def e3(title,prompt,params,code,cases):exercise(3,title,prompt,code,cases,params)
e3('Unikke værdier i rækkefølge','Returnér hver værdi én gang i den rækkefølge, den først forekommer. Listen indeholder heltal.','tal','return list(dict.fromkeys(tal))',[[[3,1,3,2,1]],[[]],[[4,4]]])
e3('Ordoptælling','Del teksten på whitespace, brug små bogstaver, og returnér antal forekomster som dictionary. Tegnsætning bevares.','tekst','resultat={}\nfor ord in tekst.lower().split():\n    resultat[ord]=resultat.get(ord,0)+1\nreturn resultat',[['Hej hej verden'],[''],['a b a b c']])
e3('Samlet varekurv','Listen indeholder dictionaries med pris og antal. Returnér den samlede pris som tal.','varer','return sum(v["pris"]*v["antal"] for v in varer)',[[[{'pris':5,'antal':2},{'pris':2.5,'antal':3}]],[[]],[[{'pris':9,'antal':0}]]])
e3('Grupper efter første bogstav','Returnér en dictionary med små begyndelsesbogstaver som nøgler og originale ord som værdier i lister. Spring tomme ord over.','ord','r={}\nfor w in ord:\n    if w:\n        r.setdefault(w[0].lower(),[]).append(w)\nreturn r',[[['And','abe','Bil','']],[[]],[['Ø','øl']]])
e3('Flad liste','Returnér alle elementer fra en liste af lister i oprindelig rækkefølge. Kun ét niveau skal fjernes.','lister','return [x for liste in lister for x in liste]',[[[[1, 2], [3], []]], [[]], [[[], [4]]]])
e3('Byt nøgler og værdier','Returnér en dictionary, hvor værdierne er nøgler, og deres værdi er en liste over oprindelige nøgler.','data','r={}\nfor k,v in data.items():\n    r.setdefault(v,[]).append(k)\nreturn r',[[{'a':'x','b':'x','c':'y'}],[{}],[{'x':'a'}]])
e3('Gennemsnit uden None','Ignorér None i listen. Returnér gennemsnittet af de resterende tal eller None, hvis der ingen er.','tal','r=[x for x in tal if x is not None]\nreturn sum(r)/len(r) if r else None',[[[1,None,3]],[[None]],[[]]])
e3('Kilometer og meter','Læs en tekst som "1,5 km" eller "350m" og returnér antal meter. Uden enhed betyder tallet meter. Input er gyldigt og ikke-negativt.','tekst','s=tekst.lower().replace(" ","").replace(",",".")\nreturn float(s[:-2])*1000 if s.endswith("km") else float(s[:-1]) if s.endswith("m") else float(s)',[['1,5 km'],['350m'],['12']])
e3('Normalisér et navn','Fjern yderste whitespace, saml indre whitespace til ét mellemrum og gør første bogstav i hvert ord stort.','tekst','return " ".join(tekst.split()).title()',[['  ada  lovelace '],['bo'],['']])
e3('Længste ord','Returnér det længste ord. Ved lighed vælges det første. Returnér tom tekst for en tom liste.','ord','return max(ord,key=len) if ord else ""',[[['en','længere','kort']],[[]],[['ab','cd']]])
e3('Fælles elementer','Returnér sorterede, unikke heltal, der findes i begge lister.','a,b','return sorted(set(a)&set(b))',[[[1,2,2],[2,3]],[[],[1]],[[3,1],[1,3]]])
e3('Rotér en liste','Rotér listen k pladser mod højre. k er et ikke-negativt heltal.','tal,k','if not tal:\n    return []\nk%=len(tal)\nreturn tal[-k:]+tal[:-k] if k else tal[:]',[[[1,2,3],1],[[1,2],4],[[],2]])
e3('Opdel i blokke','Del listen i blokke af størrelse n. Sidste blok må være mindre. n er positivt.','tal,n','return [tal[i:i+n] for i in range(0,len(tal),n)]',[[[1,2,3,4,5],2],[[],3],[[1,2],5]])
e3('Kumulativ sum','Returnér de løbende summer af listens tal.','tal','r=[]\ns=0\nfor x in tal:\n    s+=x\n    r.append(s)\nreturn r',[[[1,2,3]],[[]],[[3,-2,4]]])
e3('Hyppigste værdi','Returnér den hyppigste værdi. Ved lighed vælges den mindste. Returnér None for en tom liste af heltal.','tal','if not tal:\n    return None\nfrom collections import Counter\nc=Counter(tal)\nreturn min(c,key=lambda x:(-c[x],x))',[[[3,2,3,2,1]],[[]],[[5]]])
e3('Median','Returnér medianen af en ikke-tom liste af tal.','tal','s=sorted(tal)\nn=len(s)\nreturn s[n//2] if n%2 else (s[n//2-1]+s[n//2])/2',[[[3,1,2]],[[1,4]],[[7]]])
e3('Vægtet gennemsnit','Returnér det vægtede gennemsnit. Listerne er lige lange, vægte er ikke-negative og summen er positiv.','tal,vaegte','return sum(x*w for x,w in zip(tal,vaegte))/sum(vaegte)',[[[2,8],[1,3]],[[4],[2]],[[1,9],[0,1]]])
e3('Tæl ordlængder','Returnér en dictionary med ordlængder som tekstnøgler og antal ord. Del på whitespace.','tekst','r={}\nfor w in tekst.split():\n    k=str(len(w));r[k]=r.get(k,0)+1\nreturn r',[['en to tre'],[''],['a ab abc']])
e3('CSV med semikolon','Læs semikolonsepareret tekst med header navn;point. Returnér en liste af dictionaries med navn som tekst og point som heltal. Brug csv-modulet, så citerede felter virker.','tekst','import csv,io\nreturn [{"navn":r["navn"],"point":int(r["point"])} for r in csv.DictReader(io.StringIO(tekst),delimiter=";")]',[['navn;point\nAda;4\nBo;7'],['navn;point'],['navn;point\n"A;B";5']])
e3('Et lille JSON-filter','Læs en JSON-liste af tal som tekst og returnér summen af tal over grænsen.','tekst,graense','import json\nreturn sum(x for x in json.loads(tekst) if x>graense)',[['[1,5,8]',4],['[]',0],['[-3,0,2]',-1]])
e3('Indkøb der mangler','Returnér en dictionary med de varer og positive antal, der mangler for at opfylde ønsket. Manglende lagervarer tælles som 0.','lager,oenske','return {k:n-lager.get(k,0) for k,n in oenske.items() if n>lager.get(k,0)}',[[{'mel':2},{'mel':5,'æg':3}],[{},{}],[{'a':9},{'a':2}]] )
e3('Find dubletter','Returnér sorteret liste over de heltal, som forekommer mere end én gang.','tal','from collections import Counter\nreturn sorted(x for x,n in Counter(tal).items() if n>1)',[[[1,2,1,3,2]],[[]],[[4,4,4]]])
e3('Sikker division','Returnér a/b eller None, hvis b er 0.','a,b','return a/b if b!=0 else None',[[8,2],[3,0],[-5,2]])
e3('Tilføj en filendelse','Returnér filnavnet med .py til sidst, medmindre det allerede ender på .py uden hensyn til store/små bogstaver.','navn','return navn if navn.lower().endswith(".py") else navn+".py"',[['test'],['TEST.PY'],['a.txt']])
e3('Enkel tekststatistik','Returnér en dictionary med tegn, ord og linjer. Tom tekst har 0 linjer. Brug splitlines() til linjer.','tekst','return {"tegn":len(tekst),"ord":len(tekst.split()),"linjer":len(tekst.splitlines())}',[['hej verden\nny linje'],[''],['a\n']])

# Level 4: validation and small algorithms.
def e4(title,prompt,params,code,cases):exercise(4,title,prompt,code,cases,params)
e4('Tal eller None','Læs en streng med decimalkomma eller punktum. Returnér et endeligt decimaltal, ellers None.','tekst','import math\ntry:\n    x=float(tekst.strip().replace(",","."))\n    return x if math.isfinite(x) else None\nexcept ValueError:\n    return None',[[' 1,25 '],['hej'],['nan']])
e4('Parenteskontrol','Returnér om (), [] og {} er korrekt indlejret. Ignorér andre tegn.','tekst','stack=[]\nmatch={")":"(","]":"[","}":"{"}\nfor ch in tekst:\n    if ch in "([{":stack.append(ch)\n    elif ch in match:\n        if not stack or stack.pop()!=match[ch]:return False\nreturn not stack',[['a([{}])'],['([)]'],['abc(']])
e4('Binær søgning','Find indekset for mål i en sorteret liste med unikke tal. Returnér −1 hvis det mangler.','tal,maal','lo,hi=0,len(tal)-1\nwhile lo<=hi:\n    mid=(lo+hi)//2\n    if tal[mid]==maal:return mid\n    if tal[mid]<maal:lo=mid+1\n    else:hi=mid-1\nreturn -1',[[[1,3,8],3],[[1,3,8],2],[[],4]])
e4('Primtalssi','Returnér alle primtal op til og med n, hvor 0 ≤ n ≤ 10.000.','n','s=[True]*(n+1)\nfor i in range(2,int(n**.5)+1):\n    if s[i]:\n        for j in range(i*i,n+1,i):s[j]=False\nreturn [i for i in range(2,n+1) if s[i]]',[[10],[1],[30]])
e4('Sammenflet intervaller','Returnér sorterede, sammenflettede lukkede intervaller. Intervaller, der rører hinanden, skal samles.','intervaller','r=[]\nfor a,b in sorted(intervaller):\n    if r and a<=r[-1][1]:r[-1][1]=max(r[-1][1],b)\n    else:r.append([a,b])\nreturn r',[[[[1,3],[2,5],[8,9]]],[[]],[[[1,2],[2,3]]]])
e4('Glidende gennemsnit','Returnér gennemsnittet af hvert sammenhængende vindue med k tal. k er positivt. Hvis k overstiger længden, returneres [].','tal,k','return [sum(tal[i:i+k])/k for i in range(len(tal)-k+1)]',[[[1,2,3,4],2],[[1],3],[[],1]])
e4('Transponér en matrix','Returnér den transponerede rektangulære matrix. En tom matrix giver [].','matrix','return [list(r) for r in zip(*matrix)]',[[[[1, 2, 3], [4, 5, 6]]], [[]], [[[1], [2]]]])
e4('Matrixprodukt','Returnér A·B. Matricerne er ikke-tomme og har kompatible dimensioner.','a,b','return [[sum(x*y for x,y in zip(row,col)) for col in zip(*b)] for row in a]',[[[[1,2],[3,4]],[[2,0],[0,2]]],[[[1,2,3]],[[1],[1],[1]]],[[[0]],[[4]]]])
e4('Run-length encoding','Returnér listen [tegn, antal] for hver sammenhængende gruppe af ens tegn.','tekst','r=[]\nfor ch in tekst:\n    if r and r[-1][0]==ch:r[-1][1]+=1\n    else:r.append([ch,1])\nreturn r',[['aaabbc'],[''],['aba']])
e4('Run-length decoding','Genskab teksten fra gyldige par [tegn, antal], hvor antal er ikke-negativt.','grupper','return "".join(ch*n for ch,n in grupper)',[[[['a',3],['b',2]]],[[]],[[['x',0],['y',1]]]])
e4('Caesar-kryptering','Flyt ASCII-bogstaver k positioner i alfabetet. Bevar store/små bogstaver og andre tegn. k kan være negativt.','tekst,k','r=""\nfor c in tekst:\n    if "a"<=c<="z":r+=chr((ord(c)-97+k)%26+97)\n    elif "A"<=c<="Z":r+=chr((ord(c)-65+k)%26+65)\n    else:r+=c\nreturn r',[['Abc xyz!',3],['A',-1],['Æøå 123',4]])
e4('Sorter efter to felter','Returnér personer sorteret efter point faldende og derefter navn stigende. Alle poster har navn og point.','personer','return sorted(personer,key=lambda p:(-p["point"],p["navn"]))',[[[{'navn':'Bo','point':3},{'navn':'Ada','point':3},{'navn':'Cy','point':7}]],[[]],[[{'navn':'X','point':0}]]])
e4('Kontosaldo','Start med saldo 0. Behandl tal som indbetalinger (positive) og hævninger (negative). Afvis hævninger, der gør saldoen negativ. Returnér saldo og antal afviste som [saldo, antal].','bevaegelser','saldo=0\nafviste=0\nfor x in bevaegelser:\n    if saldo+x<0:afviste+=1\n    else:saldo+=x\nreturn [saldo,afviste]',[[[100,-30,-90,20]],[[-1]],[[]]])
e4('Simulér en stak','Kommandoer er ["push", værdi] eller ["pop"]. Returnér en liste over de poppede værdier; tom stak giver None.','kommandoer','stack=[]\nr=[]\nfor cmd in kommandoer:\n    if cmd[0]=="push":stack.append(cmd[1])\n    else:r.append(stack.pop() if stack else None)\nreturn r',[[[['push',2],['push',3],['pop'],['pop'],['pop']]],[[]],[[['pop']]]])
e4('Spiral gennem matrix','Læs en rektangulær matrix med uret fra øverste venstre hjørne og indad. Returnér værdierne som en flad liste.','matrix','a=[r[:] for r in matrix]\nr=[]\nwhile a:\n    r+=a.pop(0)\n    a=[list(row) for row in zip(*a)][::-1]\nreturn r',[[[[1, 2, 3], [4, 5, 6], [7, 8, 9]]], [[]], [[[1, 2, 3]]]])
e4('Ord med samme bogstaver','Gruppér ord, der er anagrammer. Bevar rækkefølge for grupper og ord efter første forekomst. Store/små bogstaver har betydning.','ord','r={}\nfor w in ord:r.setdefault("".join(sorted(w)),[]).append(w)\nreturn list(r.values())',[[['eat','tea','tan','ate','nat']],[[]],[['a','A']]])
e4('Valider IPv4','Returnér om teksten består af fire heltalsfelter 0–255 adskilt af punktum. Foranstillede nuller tillades kun for tallet 0.','tekst','dele=tekst.split(".")\nreturn len(dele)==4 and all(p.isascii() and p.isdigit() and 0<=int(p)<=255 and (p=="0" or not p.startswith("0")) for p in dele)',[['192.168.0.1'],['256.1.1.1'],['01.2.3.4']])
e4('Afstand mellem punkter','Returnér den euklidiske afstand mellem to lige lange koordinatlister.','a,b','import math\nreturn math.sqrt(sum((x-y)**2 for x,y in zip(a,b)))',[[[0,0],[3,4]],[[1,2,3],[1,2,3]],[[0,0,0],[1,2,2]]])
e4('Lineær regression i Python','Returnér [hældning, skæring] for mindste-kvadraters linjen. Der er mindst to par, og x-værdierne er ikke alle ens.','xs,ys','xm=sum(xs)/len(xs);ym=sum(ys)/len(ys)\na=sum((x-xm)*(y-ym) for x,y in zip(xs,ys))/sum((x-xm)**2 for x in xs)\nreturn [a,ym-a*xm]',[[[1,2,3],[2,4,6]],[[0,1],[3,5]],[[-1,0,1],[1,1,1]]])
e4('Del tekst i afsnit','Returnér afsnit adskilt af tomme linjer. Saml linjer i hvert afsnit med ét mellemrum og fjern yderste whitespace.','tekst','r=[]\ncurrent=[]\nfor line in tekst.splitlines()+[""]:\n    if line.strip():current.append(line.strip())\n    elif current:r.append(" ".join(current));current=[]\nreturn r',[['a\nb\n\nc'],[''],['\n x \n\n\n y\n']])
e4('To tal med bestemt sum','Returnér indekserne [i,j] for det første par fundet ved at gennemløbe j fra venstre. Brug tidligste tidligere i. Returnér None hvis intet par findes.','tal,maal','set_first={}\nfor j,x in enumerate(tal):\n    if maal-x in set_first:return [set_first[maal-x],j]\n    set_first.setdefault(x,j)\nreturn None',[[[2,7,11,15],9],[[3,3],6],[[1,2],9]])
e4('Skemaoverlap','Intervaller er [start, slut] i minutter, med start < slut. Returnér om nogen overlapper. Et interval må starte præcis når et andet slutter.','intervaller','s=sorted(intervaller)\nreturn any(s[i][0]<s[i-1][1] for i in range(1,len(s)))',[[[[0,10],[10,20]]],[[[0,20],[5,10]]],[[]]])
e4('Lokal frekvenstabel','Returnér en dictionary med tekstnøglerne "negative", "nul", "positive" og antal i hver gruppe.','tal','return {"negative":sum(x<0 for x in tal),"nul":sum(x==0 for x in tal),"positive":sum(x>0 for x in tal)}',[[[-2,0,1,3]],[[]],[[0,0]]])
e4('Sammenlign versionsnumre','Sammenlign versioner med heltal adskilt af punktum. Manglende sidste led er 0. Returnér −1, 0 eller 1.','a,b','x=list(map(int,a.split(".")));y=list(map(int,b.split(".")))\nn=max(len(x),len(y));x+=[0]*(n-len(x));y+=[0]*(n-len(y))\nreturn (x>y)-(x<y)',[['1.2','1.2.0'],['1.10','1.2'],['0.9','1']])
e4('En lille klasse','Definér klassen Taeller med startværdi 0 og metoden tilfoej(n). Brug klassen i solve til at behandle tallene og returnere dens værdi.','tal','class Taeller:\n    def __init__(self):self.vaerdi=0\n    def tilfoej(self,n):self.vaerdi+=n\nt=Taeller()\nfor n in tal:t.tilfoej(n)\nreturn t.vaerdi',[[[1,2,3]],[[]],[[4,-7]]])

# Level 5: algorithmic challenges, bounded inputs.
def e5(title,prompt,params,code,cases):exercise(5,title,prompt,code,cases,params,concept='Udfordring: løs først små eksempler, begrund algoritmen, og overvej tidsforbruget. Testene kontrollerer resultater, ikke din kodestil eller et fuldstændigt korrekthedsbevis.')
e5('Rekursiv sum','Returnér summen af alle heltal i en liste, som kan indeholde flere indlejrede lister.','data','def visit(x):\n    return sum(visit(y) for y in x) if isinstance(x,list) else x\nreturn visit(data)',[[[1,[2,[3]],4]],[[]],[[[-2],0]]])
e5('Hurtig potens','Beregn a^n med gentagen kvadrering. n er et ikke-negativt heltal.','a,n','resultat=1\nwhile n:\n    if n%2:resultat*=a\n    a*=a;n//=2\nreturn resultat',[[2,10],[5,0],[-2,7]])
e5('Færrest mønter','Returnér det mindste antal mønter til beløbet, eller −1 hvis umuligt. Møntværdier er positive heltal og kan bruges ubegrænset.','moenter,beloeb','dp=[0]+[float("inf")]*beloeb\nfor x in range(1,beloeb+1):\n    for c in moenter:\n        if c<=x:dp[x]=min(dp[x],dp[x-c]+1)\nreturn -1 if dp[beloeb]==float("inf") else dp[beloeb]',[[[1,3,4],6],[[2],3],[[5],0]])
e5('Længste stigende delfølge','Returnér længden af den længste strengt stigende delfølge; elementerne behøver ikke ligge ved siden af hinanden.','tal','dp=[1]*len(tal)\nfor i in range(len(tal)):\n    for j in range(i):\n        if tal[j]<tal[i]:dp[i]=max(dp[i],dp[j]+1)\nreturn max(dp,default=0)',[[[10,9,2,5,3,7,101,18]],[[]],[[2,2,2]]])
e5('Redigeringsafstand','Returnér Levenshtein-afstanden med pris 1 for indsætning, sletning og erstatning af et tegn.','a,b','row=list(range(len(b)+1))\nfor i,x in enumerate(a,1):\n    new=[i]\n    for j,y in enumerate(b,1):new.append(min(new[-1]+1,row[j]+1,row[j-1]+(x!=y)))\n    row=new\nreturn row[-1]',[['kitten','sitting'],['','abc'],['ens','ens']])
e5('Længste fælles delfølge','Returnér længden af den længste fælles delfølge af to strenge.','a,b','dp=[[0]*(len(b)+1) for _ in range(len(a)+1)]\nfor i,x in enumerate(a,1):\n    for j,y in enumerate(b,1):dp[i][j]=dp[i-1][j-1]+1 if x==y else max(dp[i-1][j],dp[i][j-1])\nreturn dp[-1][-1]',[['abcde','ace'],['','abc'],['abc','xyz']])
e5('Korteste vej i en uvægtet graf','Grafen er en dictionary fra knude til naboer. Returnér mindste antal kanter fra start til mål, eller −1.','graf,start,maal','from collections import deque\nq=deque([(start,0)]);seen={start}\nwhile q:\n    u,d=q.popleft()\n    if u==maal:return d\n    for v in graf.get(u,[]):\n        if v not in seen:seen.add(v);q.append((v,d+1))\nreturn -1',[[{'A':['B','C'],'B':['D'],'C':['D'],'D':[]},'A','D'],[{},'A','A'],[{'A':[]},'A','B']])
e5('Dijkstra','Grafen er en dictionary med lister af [nabo, ikke-negativ vægt]. Returnér mindste afstand fra start til mål eller None.','graf,start,maal','import heapq\nq=[(0,start)];dist={start:0}\nwhile q:\n    d,u=heapq.heappop(q)\n    if d!=dist[u]:continue\n    if u==maal:return d\n    for v,w in graf.get(u,[]):\n        nd=d+w\n        if nd<dist.get(v,float("inf")):dist[v]=nd;heapq.heappush(q,(nd,v))\nreturn None',[[{'A':[['B',4],['C',1]],'C':[['B',1]],'B':[]},'A','B'],[{},'X','X'],[{'A':[]},'A','B']])
e5('Topologisk rækkefølge','Returnér topologisk sortering af en rettet graf. Vælg altid alfabetisk mindste ledige knude. Returnér None ved cyklus.','graf','import heapq\nnodes=set(graf)|{v for vs in graf.values() for v in vs}\ndeg={u:0 for u in nodes}\nfor vs in graf.values():\n    for v in vs:deg[v]+=1\nq=[u for u in nodes if deg[u]==0];heapq.heapify(q);r=[]\nwhile q:\n    u=heapq.heappop(q);r.append(u)\n    for v in graf.get(u,[]):\n        deg[v]-=1\n        if deg[v]==0:heapq.heappush(q,v)\nreturn r if len(r)==len(nodes) else None',[[{'A':['C'],'B':['C'],'C':[]}],[{'A':['B'],'B':['A']}],[{}]])
e5('Antal øer','Et gitter består af 0 og 1. Returnér antal sammenhængende grupper af 1-taller. Kun op/ned/venstre/højre tæller.','gitter','if not gitter:return 0\nrows,cols=len(gitter),len(gitter[0]);seen=set();count=0\nfor r in range(rows):\n    for c in range(cols):\n        if gitter[r][c]!=1 or (r,c) in seen:continue\n        count+=1;stack=[(r,c)];seen.add((r,c))\n        while stack:\n            x,y=stack.pop()\n            for a,b in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:\n                if 0<=a<rows and 0<=b<cols and gitter[a][b]==1 and (a,b) not in seen:seen.add((a,b));stack.append((a,b))\nreturn count',[[[[1, 0, 1], [1, 0, 0], [0, 1, 1]]], [[]], [[[1, 1], [1, 1]]]])
e5('Rygsæk 0/1','Hver genstand har vægt og værdi og kan vælges højst én gang. Returnér højeste værdi inden for kapaciteten. Alle input er ikke-negative heltal; vægte er positive.','vaegte,vaerdier,kapacitet','dp=[0]*(kapacitet+1)\nfor w,v in zip(vaegte,vaerdier):\n    for c in range(kapacitet,w-1,-1):dp[c]=max(dp[c],dp[c-w]+v)\nreturn dp[-1]',[[[2,3,4],[3,4,5],5],[[],[],4],[[2],[10],1]])
e5('Maksimal delsum','Returnér største sum af en ikke-tom sammenhængende del af listen. Listen er ikke-tom.','tal','best=cur=tal[0]\nfor x in tal[1:]:cur=max(x,cur+x);best=max(best,cur)\nreturn best',[[[-2,1,-3,4,-1,2,1,-5,4]],[[-5,-2,-7]],[[3]]])
e5('Antal inversioner','Returnér antal indekspar i<j hvor tal[i]>tal[j].','tal','def count(a):\n    if len(a)<2:return a,0\n    mid=len(a)//2;l,x=count(a[:mid]);r,y=count(a[mid:]);i=j=0;out=[];n=x+y\n    while i<len(l) and j<len(r):\n        if l[i]<=r[j]:out.append(l[i]);i+=1\n        else:out.append(r[j]);j+=1;n+=len(l)-i\n    return out+l[i:]+r[j:],n\nreturn count(tal)[1]',[[[2,4,1,3,5]],[[]],[[3,2,1]]])
e5('Postfix-beregner','Beregn et gyldigt postfix-udtryk med heltal og +, -, *. Tokens er tekst i en liste.','tokens','s=[]\nfor t in tokens:\n    if t in ["+","-","*"]:\n        b=s.pop();a=s.pop();s.append(a+b if t=="+" else a-b if t=="-" else a*b)\n    else:s.append(int(t))\nreturn s[0]',[[['2','3','+','4','*']],[[ '5','2','-']],[['-3']]])
e5('Rekursiv binær søgetræhøjde','Et træ er None eller [værdi, venstre, højre]. Returnér højde i antal knuder; tomt træ har højde 0.','trae','if trae is None:return 0\nreturn 1+max(solve(trae[1]),solve(trae[2]))',[[None],[[1,None,None]],[[1,[2,[3,None,None],None],[4,None,None]]]])
e5('LRU-cache','Simulér en cache med positiv kapacitet. Kommandoer er ["put",nøgle,værdi] og ["get",nøgle]. Get returnerer −1 hvis nøglen mangler. Returnér alle get-resultater.','kapacitet,kommandoer','from collections import OrderedDict\nc=OrderedDict();r=[]\nfor cmd in kommandoer:\n    k=cmd[1]\n    if cmd[0]=="get":\n        r.append(c.get(k,-1))\n        if k in c:c.move_to_end(k)\n    else:\n        c[k]=cmd[2];c.move_to_end(k)\n        if len(c)>kapacitet:c.popitem(last=False)\nreturn r',[[2,[['put','a',1],['put','b',2],['get','a'],['put','c',3],['get','b']]],[1,[['get','x']]],[1,[['put','a',1],['put','a',2],['get','a']]]])
e5('Søg mønster uden overlapkrav','Returnér alle startindekser, hvor mønstret findes i teksten, også overlappende. Mønstret er ikke-tomt.','tekst,moenster','return [i for i in range(len(tekst)-len(moenster)+1) if tekst.startswith(moenster,i)]',[['aaaa','aa'],['abc','x'],['ab','abc']])
e5('Længste delstreng uden gentagelse','Returnér længden af den længste sammenhængende delstreng uden gentagne tegn.','tekst','last={};start=best=0\nfor i,c in enumerate(tekst):\n    if c in last:start=max(start,last[c]+1)\n    last[c]=i;best=max(best,i-start+1)\nreturn best',[['abcabcbb'],[''],['bbbbb']])
e5('Antal veje gennem gitter','Gitteret har 0 for fri og 1 for blokeret. Returnér antal veje fra øverste venstre til nederste højre med kun højre/ned.','gitter','if not gitter or not gitter[0]:return 0\ndp=[0]*len(gitter[0]);dp[0]=1\nfor row in gitter:\n    for j,x in enumerate(row):\n        if x==1:dp[j]=0\n        elif j:dp[j]+=dp[j-1]\nreturn dp[-1]',[[[[0, 0, 0], [0, 1, 0], [0, 0, 0]]], [[[1]]], [[]]])
e5('Alle gyldige parentesstrenge','Returnér alle gyldige strenge med n parentespar, sorteret leksikografisk. 0 ≤ n ≤ 6.','n','r=[]\ndef build(s,a,b):\n    if len(s)==2*n:r.append(s);return\n    if a<n:build(s+"(",a+1,b)\n    if b<a:build(s+")",a,b+1)\nbuild("",0,0)\nreturn sorted(r)',[[0],[2],[3]])
e5('Find et flertal','Returnér tallet, der optræder mere end halvdelen af gangene, ellers None.','tal','candidate=None;count=0\nfor x in tal:\n    if count==0:candidate=x\n    count+=1 if x==candidate else -1\nreturn candidate if tal.count(candidate)>len(tal)//2 else None',[[[2,2,1,2]],[[1,2]],[[]]])
e5('Minimum i roteret liste','En sorteret liste med unikke heltal er roteret et vilkårligt antal pladser. Find minimum med binær søgning. Listen er ikke-tom.','tal','lo,hi=0,len(tal)-1\nwhile lo<hi:\n    mid=(lo+hi)//2\n    if tal[mid]>tal[hi]:lo=mid+1\n    else:hi=mid\nreturn tal[lo]',[[[4,5,1,2,3]],[[1,2,3]],[[9]]])
e5('Forbind grupper','Knuderne er 0 til n−1. Kanterne er urettede par. Returnér antal sammenhængende komponenter.','n,kanter','parent=list(range(n))\ndef find(x):\n    while x!=parent[x]:\n        parent[x]=parent[parent[x]];x=parent[x]\n    return x\nfor a,b in kanter:parent[find(a)]=find(b)\nreturn len({find(i) for i in range(n)})',[[5,[[0,1],[1,2],[3,4]]],[3,[]],[0,[]]])
e5('Vælg flest aktiviteter','Returnér højeste antal ikke-overlappende intervaller. Start må være lig forrige slut. Alle intervaller har start < slut.','intervaller','end=float("-inf");antal=0\nfor a,b in sorted(intervaller,key=lambda p:p[1]):\n    if a>=end:antal+=1;end=b\nreturn antal',[[[[1, 3], [2, 5], [3, 4], [4, 7]]], [[]], [[[0, 1], [1, 2], [0, 3]]]])
e5('Lav et sikkert regneudtryk','Beregn tekst med heltal, parenteser, +, - og *. Brug ast til kun at tillade disse operationer og unært minus. Ugyldigt input skal give None. Brug ikke eval().','tekst','import ast\ndef calc(n):\n    if isinstance(n,ast.Constant) and type(n.value) is int:return n.value\n    if isinstance(n,ast.UnaryOp) and isinstance(n.op,ast.USub):return -calc(n.operand)\n    if isinstance(n,ast.BinOp) and isinstance(n.op,(ast.Add,ast.Sub,ast.Mult)):\n        a,b=calc(n.left),calc(n.right)\n        return a+b if isinstance(n.op,ast.Add) else a-b if isinstance(n.op,ast.Sub) else a*b\n    raise ValueError()\ntry:return calc(ast.parse(tekst,mode="eval").body)\nexcept (SyntaxError,ValueError,TypeError):return None',[['2*(3+4)'],['-3+2'],['__import__("os")']])

if __name__=='__main__':
    assert len(LESSONS)==125, len(LESSONS)
    assert all(sum(x['level']==level for x in LESSONS)==25 for level in range(1,6))
    assert len({x['title'] for x in LESSONS})==125
    root=Path(__file__).resolve().parents[1]
    guides=json.loads((root/'tests/fixtures/python-lesson-guides.json').read_text())
    assert len(guides)==125
    for lesson in LESSONS:
        guide=guides[f"{lesson['level']}-{lesson['number']}"]
        lesson['brief']=guide
        if lesson['mode']=='program':
            assert len(guide['inputs'])==len(lesson['tests'][0]['stdin'])
        # Presentation only: task ids, solutions and saved progress stay valid.
        lesson['hints']=[guide['plan'],*lesson['hints']]
    (root/'tests/fixtures/python-lesson-references.json').write_text(json.dumps(LESSONS,ensure_ascii=False,indent=2)+'\n')
    public=[{k:v for k,v in x.items() if k!='reference'} for x in LESSONS]
    (root/'extension/school-code-lessons.js').write_text('globalThis.lectioPlusCodeLessons = '+json.dumps(public,ensure_ascii=False,separators=(',',':'))+';\n')
    print('Built 125 original lessons; 375 reference cases executed.')
