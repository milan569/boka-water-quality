# Boka Water Quality — master brief

## Stav dokumentu

- Platnost k: 27. 7. 2026
- Výchozí větev: `main`
- Výchozí commit před aktuálními lokálními změnami: `570bb77` (`Remove map tooltip`)
- Lokální projekt: `E:\- INVESTMENT\MonteNegro\BokaWaterQuality`
- GitHub: <https://github.com/milan569/boka-water-quality>
- GitHub Pages: <https://milan569.github.io/boka-water-quality/>

### Jak číst jistotu tvrzení

- **Ověřeno** — doloženo aktuálním repozitářem nebo sestavením.
- **Historický údaj** — zaznamenáno během dosavadní práce, ale nemusí být zpětně doložitelné z repozitáře.
- **Plán** — zamýšlená funkce, nikoli aktuální schopnost aplikace.
- **Ověřit** — před použitím v produkci je nutná kontrola proti autoritativnímu zdroji.

## 1. Identifikace projektu

**Ověřeno**

- Pracovní název: Boka Water Quality.
- Repo/aplikace: `boka-water-quality`.
- Typ: jednoduchá responzivní webová aplikace/PWA s mapou.
- Oblast: Boka Kotorska a vybrané pobřežní lokality Černé Hory.
- Cílové zařízení: zejména iPhone, Safari a instalace na plochu.
- Aktuální lokální stav: funkční MVP s reálnou oficiální klasifikací pro obce
  Kotor, Tivat, Herceg Novi a Budva a reálným kontextem Open-Meteo.
- Technologie: React, Vite, Leaflet/React Leaflet, statické JSON soubory a GitHub Pages.
- Backend, databáze a uživatelské účty nejsou implementovány.

## 2. Executive summary

Aplikace zobrazuje 81 oficiálních monitorovacích míst v obcích Kotor, Tivat,
Herceg Novi a Budva, 405 měření z pěti kol sezony 2026 a oddělený kontext
Open-Meteo. Oficiální data byla importována z veřejných JSON endpointů
JP Morsko dobro; Open-Meteo se načítá v dávkách po nejvýše 25 místech.

Současná aplikace stále **není samostatnou zdravotní autoritou**. Přesně
reprodukuje klasifikaci zdroje a její stáří. Číselné hodnoty E. coli a
enterokoků veřejný JSON zdroj neposkytuje a aplikace je proto zobrazuje jako
neuvedené. Incidentní a satelitní vrstvy nejsou implementovány.

Hlavní produktové pravidlo:

> Oficiální hygienická klasifikace musí zůstat oddělena od kontextových
> indikátorů. Déšť, vítr, bouřky, zákal nebo lokální zprávy nejsou přímým
> důkazem hygienické kvality vody.

## 3. Cíl a uživatelský scénář

Uživatel otevře aplikaci na telefonu, na mapě zvolí lokalitu a rychle zjistí:

- poslední dostupný oficiální výsledek a datum odběru,
- stáří a zdroj výsledku,
- E. coli a intestinální enterokoky v jednotkách převzatých ze zdroje,
- teplotu moře, případně vzduchu, salinitu a pH, pokud je zdroj poskytuje,
- historii dostupných měření,
- oddělený kontext počasí a incidentů,
- jasné upozornění na chybějící, stará nebo neověřená data.

Slovo „aktuální“ se nesmí používat bez uvedení data a stáří. Preferovaný termín
je „poslední dostupné měření“.

## 4. Cílová oblast a lokality

**Historický stav výchozího commitu**

Mock dataset obsahoval 16 bodů:

- Kotor City Beach, Muo, Prčanj, Stoliv, Dobrota, Perast a Risan,
- Tivat Belane, Donja Lastva, Porto Montenegro, Plavi Horizonti a Krašići,
- Herceg Novi, Meljine a Igalo,
- Budva Mogren jako srovnávací lokalitu mimo Boku.

**Historický údaj**

Souřadnice Kotor City Beach, Muo, Plavi Horizonti a Krašići byly ručně
dolaďovány. Plavi Horizonti byly posunuty blíže k Uvala Pržno.

**Aktuální stav**

Aktivní dataset obsahuje 81 oficiálních míst: Kotor 15, Tivat 10, Herceg Novi
22 a Budva 34. Souřadnice jsou počítány jako centroid polygonu dodaného
Morsko dobro. Interní obecné body jako Porto Montenegro, Muo nebo Kotor City
Beach nejsou bez jednoznačného párování směšovány s oficiálním datasetem.

**Ověřit**

- všechny souřadnice proti oficiálnímu seznamu monitorovacích míst,
- zda každý interní bod odpovídá skutečnému oficiálnímu odběrnému místu,
- přesné názvy, externí ID a případnou geometrii lokalit.

## 5. Datové zdroje

### JP Morsko dobro

Plánovaný primární zdroj oficiálních výsledků:

<https://monitoring.morskodobro.me/>

Technický průzkum z 27. 7. 2026 potvrdil veřejné JSON endpointy. Podrobnosti jsou
v `docs/MORSKO_DOBRO_API_SPIKE.md`.

Před implementací je nutné ověřit:

- dostupné endpointy a jejich stabilitu,
- právní podmínky, licenci, atribuci a přiměřenou frekvenci stahování,
- význam klasifikací: veřejné rozhraní poskytuje hodnocení jednotlivých kol i
  sezonní souhrn,
- jednotky mikrobiologických ukazatelů,
- dostupnost teploty, salinity, poznámek a polygonů; pH ani číselné výsledky
  mikrobiologických ukazatelů nebyly ve veřejném JSON nalezeny,
- způsob jednoznačného párování lokalit.

### PORTODIMARE / GeoNode

Možný pomocný zdroj geometrie, historických atributů a WMS/WFS/GeoJSON vrstev.
Nemá být bez ověření použit jako zdroj nejnovější hygienické klasifikace.

### Open-Meteo

Zdroj kontextu:

- srážky za 24, 48 a 72 hodin,
- rychlost a směr větru,
- bouřkové nebo přívalové události,
- případně relevantní marine proměnné.

Každý záznam musí mít čas výpočtu a dobu platnosti. Expirované počasí se nesmí
popisovat jako „posledních 24 hodin“.

Integrace a licence jsou popsány v `docs/OPEN_METEO_INTEGRATION.md`.

### Incidentní a satelitní zdroje

Lokální média, obce, vodárenské společnosti a Copernicus/Sentinel jsou pouze
budoucí doplňkové vrstvy. Incidenty musí mít zdroj, čas, lokalitu a stav
ověření. Satelitní optické indikátory nesmí být prezentovány jako mikrobiologický
rozbor.

## 6. Aktuální funkce MVP

**Ověřeno**

- mapa a 81 barevných kruhových markerů čtyř obcí,
- klasifikace `excellent`, `good`, `satisfactory`, `poor`, `unknown`,
- intenzita markeru podle stáří posledního vzorku,
- výběr lokality kliknutím bez popupu a tooltipu,
- detail posledního oficiálního měření,
- seznam historie za klouzavé časové okno,
- kontextové vysvětlení z Open-Meteo,
- responzivní rozložení pro telefon a desktop,
- PWA manifest, ikony, jednoduchý service worker a ruční/pull-down obnovení.

## 7. Technická architektura

- `src/data/bathing_sites.json` — lokality a souřadnice.
- `src/data/measurements.json` — normalizovaná oficiální měření.
- `src/data/weather_context.json` — kontext počasí z Open-Meteo.
- `src/utils/dataSelectors.js` — výběr posledního měření, historie a riziková logika.
- `src/utils/status.js` — metadata stavů, stáří a trendu.
- `src/config/riskThresholds.js` — prozatímní demo prahy.
- `scripts/import-morsko-dobro.mjs` — normalizovaný import oficiálních dat.
- `scripts/update-weather.mjs` — dávková aktualizace Open-Meteo.
- `scripts/validate-data.mjs` — kontrola schématu a vazeb.
- `tests/` — deterministické testy datové a rizikové logiky.
- `src/components/WaterMap.jsx` — mapa a výběr bodu.
- `src/components/SiteDetail.jsx` — detail lokality.
- `src/components/Legend.jsx` — legenda.
- `public/manifest.webmanifest` — instalační metadata.
- `public/sw.js` — jednoduchá oportunistická cache.
- `.github/workflows/deploy.yml` — sestavení a nasazení na GitHub Pages.

Současný service worker nezaručuje plnohodnotnou offline mapu. Mapové dlaždice
vyžadují síť.

## 8. Lokální prostředí

**Ověřeno k datu dokumentu**

- Node.js `v24.18.0`
- npm `11.16.0`
- Git `2.55.0.windows.1` podle historického záznamu
- lokální vývojová URL: `http://localhost:5173/`

Doporučený deterministický postup:

```powershell
Set-Location "E:\- INVESTMENT\MonteNegro\BokaWaterQuality"
npm ci
npm run validate:data
npm test
npm run build
npm run dev
```

## 9. GitHub a deployment

**Ověřeno**

- remote: `https://github.com/milan569/boka-water-quality.git`
- větev: `main`
- Pages workflow používá Node 24, `npm ci`, `npm run build` a adresář `dist`
- Vite base: `/boka-water-quality/`
- uvedené commity:
  - `289a219` — Initial Boka water quality MVP
  - `7470078` — Add Boka iOS app icon
  - `4157aba` — Remove redundant map popup
  - `570bb77` — Remove map tooltip

**Historický údaj**

První deployment selhal, dokud nebyl zdroj GitHub Pages nastaven na GitHub
Actions. Lokální síťové otevření z iPhonu nefungovalo pravděpodobně kvůli
firewallu, síti nebo VPN.

## 10. iOS instalace

1. Otevřít GitHub Pages URL v Safari.
2. Nechat aplikaci plně načíst.
3. Sdílet → Přidat na plochu.
4. Doporučený název: `Boka` nebo `Boka Water`.

Po změně ikony nebo service workeru může být nutné odstranit starého zástupce a
přidat jej znovu. Cache je po aktuálních změnách verzována jako `v7` a
navigační požadavky používají při dostupné síti strategii network-first.

## 11. Lokalizace

Viditelné uživatelské rozhraní má být české. Interní klíče, ID a hodnoty enumů
zůstávají anglické. Zdrojové názvy a originální klasifikace se uchovávají vedle
přeloženého zobrazení, aby nedošlo ke ztrátě významu.

## 12. Omezení a rizika

- dataset pokrývá obce Kotor, Tivat, Herceg Novi a Budva,
- veřejný JSON neobsahuje číselné hodnoty E. coli a enterokoků,
- není vyjasněna licence automatizované redistribuce Morsko dobro; lehká
  kontrola proto porovnává jen čtyři mapové odpovědi každých šest hodin a
  úplné historie se bez změny stahují jen jednou týdně,
- Open-Meteo se aktualizuje přibližně každých šest hodin,
- oba datové workflow po změně výslovně spustí nové nasazení GitHub Pages,
- obecné watch-pointy Muo a Kotor City Beach nejsou jednoznačně spárovány,
- prozatímní a odborně nevalidované rizikové prahy,
- minimální offline schopnost,
- bez backendu a dlouhodobého úložiště,
- závislost mapových dlaždic na externí službě,
- bez incidentního monitoringu a satelitních vrstev.

## 13. Bezpečnostní pravidla pro reálná data

1. Aplikace nesmí odvozovat oficiální třídu z vlastních prahů, pokud ji zdroj
   poskytuje přímo.
2. Chybějící nebo expirovaná data se zobrazí jako neznámá, nikoli jako bezpečná.
3. Počasí nikdy nepřepisuje oficiální klasifikaci.
4. Každý importovaný záznam uchová zdroj, čas importu a identifikátor původu.
5. Import selže bezpečně: poslední validní dataset zůstane dostupný a UI ukáže
   jeho stáří.
6. Nasazení nových dat proběhne pouze po automatické validaci.
7. Demo a reálná data nesmí být v jednom produkčním datasetu zaměnitelná.

## 14. Definition of done pro první reálný import

- zdroj a podmínky použití jsou zdokumentovány,
- endpoint nebo importní postup je opakovatelný,
- alespoň jedna obec je ručně porovnána proti oficiálnímu zobrazení,
- jednotky a klasifikace jsou ověřeny,
- párování lokalit je explicitní a nejasné body jsou odmítnuty,
- validátor nehlásí chyby,
- testy a produkční build procházejí,
- UI zobrazuje skutečný název zdroje a datum aktualizace,
- při výpadku zdroje nevznikne falešný „aktuální“ stav.

## 15. Prioritizovaný plán

1. Vyjasnit podmínky automatizované redistribuce Morsko dobro.
2. Ručně projít názvy a polohy 81 importovaných míst.
3. Rozhodnout, zda mají být neoficiální uživatelské body jako Porto Montenegro
   zobrazeny jen jako orientační místa bez vlastní oficiální klasifikace.
4. Prověřit, zda existuje autorizovaný zdroj numerických mikrobiologických hodnot.
5. Otestovat publikovanou verzi na skutečném iPhonu a Safari.
6. Incidenty a Copernicus řešit až po stabilním víceobecním importu.

## 16. Instrukce pro navazujícího Codex agenta

- Nejdřív přečíst tento dokument, `README.md`, `docs/DATA_MODEL.md` a
  `docs/PROJECT_PLAN.md`.
- Porovnat datum a výchozí commit briefu s aktuálním `HEAD`.
- Neoznačovat historická tvrzení jako ověřená bez důkazu.
- Zachovat jednoduchou statickou architekturu, dokud ji reálný objem dat
  nevyžaduje změnit.
- Nezavádět účty ani backend bez konkrétní potřeby.
- Před změnou zkontrolovat pracovní strom a chránit nesouvisející změny.
- Přidávat konkrétní soubory, ne automaticky celý pracovní strom.
- Po změně spustit validaci, testy a build.
- Push a veřejné nasazení provést pouze v rozsahu výslovně schváleného úkolu.

## 17. Otevřené otázky

- Jaké endpointy Morsko dobro skutečně používá?
- Jaká je licence a povolený způsob opakovaného načítání?
- Jaký je přesný význam oficiálních kategorií?
- Jsou hodnoty uváděny jako CFU, MPN nebo jiná jednotka na 100 ml?
- Které lokality v interním seznamu mají jednoznačný oficiální protějšek?
- Jak často jsou výsledky zveřejňovány a jak zacházet s opravami?
- Jaké stáří výsledku má UI označit jako staré, aniž by vydávalo zdravotní radu?
- Má být aplikace osobní utilita, nebo veřejně komunikovaný informační nástroj?

## 18. Odkazy

- Aplikace: <https://milan569.github.io/boka-water-quality/>
- Repo: <https://github.com/milan569/boka-water-quality>
- JP Morsko dobro monitoring: <https://monitoring.morskodobro.me/>
- Open-Meteo: <https://open-meteo.com/>
