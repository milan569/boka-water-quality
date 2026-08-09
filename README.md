# Boka Water Quality

Lehká česká PWA s mapou posledních dostupných výsledků kvality mořské vody.
Aktuální dataset obsahuje 81 oficiálních monitorovacích míst v obcích Kotor,
Tivat, Herceg Novi a Budva pro sezonu 2026 a kontext počasí z Open-Meteo.

Ověřený handover, bezpečnostní pravidla a stav implementace jsou v
[`docs/MASTER_BRIEF.md`](docs/MASTER_BRIEF.md).

## Důležité omezení

Oficiální třída, datum, teplota a salinita pocházejí z veřejné aplikace
[JP Morsko dobro](https://monitoring.morskodobro.me/). Používané JSON rozhraní
neposkytuje číselné výsledky E. coli ani intestinálních enterokoků, proto je
aplikace zobrazuje jako `neuvedeno`.

Počasí, déšť, vítr a bouřky jsou jen oddělený kontext. Nejsou laboratorním
důkazem hygienické kvality vody a nemění oficiální třídu.

## Co aplikace obsahuje

- 81 oficiálních míst ve čtyřech obcích odvozených z polygonů Morsko dobro,
- 405 měření z pěti kol sezony 2026, nejnověji do 31. 7. 2026,
- oficiální třídy Výborná, Dobrá, Vyhovující a Špatná,
- datum a stáří odběru, teploty, salinitu a zdroj,
- historii posledních dvou měsíců vztaženou k nejnovějšímu odběru,
- srážky 24/48/72 hodin, vítr a bouřkový příznak z Open-Meteo,
- ochranu proti použití počasí staršího než 12 hodin,
- české responzivní UI, PWA manifest a service worker,
- datový validátor, automatické testy a GitHub Actions workflow.

## Lokální spuštění

```bash
npm ci
npm run validate:data
npm test
npm run build
npm run dev
```

Lokální URL:

```text
http://localhost:5173/boka-water-quality/
```

## Aktualizace dat

Ruční import oficiálních dat pro Kotor, Tivat, Herceg Novi a Budvu:

```bash
npm run import:morsko -- --year=2026
```

Jednu obec lze nadále importovat například parametrem
`--municipality=Kotor`.

Aktualizace počasí:

```bash
npm run update:weather
```

Po každé aktualizaci:

```bash
npm run validate:data
npm test
npm run build
```

Workflow `update-official-data.yml` lehce kontroluje nejnovější mapová data
čtyřikrát denně a lze jej spustit také ručně. Pokud se mapa nezměnila, nenačítá
81 detailních historií ani nevytváří nové nasazení. Jednou týdně proběhne úplná
kontrola historie; ručně ji lze vynutit volbou `force`. Podmínky automatizované
redistribuce dat JP Morsko dobro je stále nutné právně vyjasnit.
Open-Meteo se aktualizuje přibližně každých šest hodin. Po každé datové změně
workflow výslovně spustí nové nasazení GitHub Pages.

Service worker používá pro navigaci strategii network-first, takže nainstalovaná
PWA při dostupné síti nepřidržuje starou verzi aplikace. Tlačítko
**Aktualizovat** a gesto stažení horní části obrazovky dolů načtou nejnovější
již zveřejněnou verzi; samotný import dat provádí zabezpečený GitHub workflow.

## Dokumentace zdrojů

- [`docs/MORSKO_DOBRO_API_SPIKE.md`](docs/MORSKO_DOBRO_API_SPIKE.md)
- [`docs/OPEN_METEO_INTEGRATION.md`](docs/OPEN_METEO_INTEGRATION.md)
- [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md)

## Instalace na iPhone

1. Otevřít nasazenou HTTPS adresu v Safari.
2. Klepnout na Sdílet.
3. Zvolit **Přidat na plochu**.

Mapové dlaždice vyžadují připojení k internetu. Service worker poskytuje pouze
jednoduchou oportunistickou cache, nikoli zaručenou offline mapu.
