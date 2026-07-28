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
- 405 měření z pěti kol sezony 2026, nejnověji do 24. 7. 2026,
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

Workflow `update-official-data.yml` je záměrně pouze ruční, dokud nebude
vyjasněna licence automatizované redistribuce dat JP Morsko dobro. Open-Meteo
workflow je připraven na aktualizaci každých šest hodin.

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
