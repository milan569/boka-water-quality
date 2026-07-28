# JP Morsko dobro — technický průzkum veřejných dat

## Stav

- Ověřeno: 27. 7. 2026
- Veřejná aplikace: <https://monitoring.morskodobro.me/>
- Rozsah aktivního importu: Kotor, Tivat, Herceg Novi a Budva, sezona 2026

## Shrnutí

Veřejná aplikace používá jednoduché JSON endpointy bez přihlášení. Endpointy
poskytují seznam obcí a koupališť, kola měření, mapový přehled s geometrií a
historii jednotlivých odběrných míst.

Rozhraní poskytuje:

- oficiální slovní klasifikaci a její číselnou váhu,
- datum a čas odběru,
- teplotu vzduchu a moře,
- salinitu,
- počasí, vítr, vlny a některé vizuální poznámky,
- polygon monitorovaného koupaliště.

Rozhraní v ověřených odpovědích **neposkytuje číselné výsledky E. coli ani
intestinálních enterokoků**. Tyto hodnoty proto importer ukládá jako `null`.
Klasifikace se přebírá přímo ze zdroje a nesmí být zpětně dopočítána z chybějících
hodnot.

## Endpointy

Základní URL:

```text
https://monitoring.morskodobro.me
```

### Kola měření

```http
POST /javna/getCalendarData
Content-Type: application/x-www-form-urlencoded

godina=2026
```

Odpověď obsahuje pole `data` s `id` kola a textovým rozsahem dat.

### Seznam koupališť

```http
POST /javna/getBeachesName
Content-Type: application/x-www-form-urlencoded

opstina=4
```

Ověřené identifikátory obcí:

- `1` Bar
- `2` Budva
- `3` Tivat
- `4` Kotor
- `5` Herceg Novi
- `6` Ulcinj

### Mapový přehled

```http
POST /javna/crtajMapu
Content-Type: application/x-www-form-urlencoded

godina=2026
rb=5
opstina=4
q=
```

Relevantní pole:

- `id` — stabilní ID monitorovacího místa,
- `naziv` — název konkrétního odběrného místa,
- `plaza` — koupaliště/oblast,
- `opstina` — obec,
- `geometrija` — polygon ve WKT,
- `datumUzorkovanja` a `vrijemeUzorkovanja`,
- `ocjena` — klasifikace v angličtině,
- `tezina` — číselná třída 1–4.

### Historie místa

```http
GET /javna/dajRezultateUzorkovanja?id=119&godina=2026
```

Relevantní pole navíc:

- `idMjerenja` — ID konkrétního měření,
- `temperaturaVazduha`,
- `temperaturaMora`,
- `salinitet`,
- `vremenskePrilike`,
- `vjetarSmjer`,
- `vjetarIntenzitet`,
- `talasi`,
- `kisaDanPrijeUzorkovanja`,
- `kisaNaDanUzorkovanja`,
- `plivajuceOtpadneMaterije`,
- `suspendovaneMaterije`,
- `komentar`,
- případná pole opakovaného měření.

## Mapování klasifikací

Primární mapování používá `tezina`, protože text `ocjena` obsahuje například
anglické `Okay` pro třetí třídu:

| `tezina` | Interní hodnota | Zobrazení |
|---:|---|---|
| 1 | `excellent` | Výborná |
| 2 | `good` | Dobrá |
| 3 | `satisfactory` | Vyhovující |
| 4 | `poor` | Špatná |

Veřejná stránka uvádí pro hodnocení po jednotlivém vyšetření následující
hranice na 100 ml:

| Parametr | Výborná | Dobrá | Vyhovující |
|---|---:|---:|---:|
| Intestinální enterokoky | `<60` | `61–100` | `101–200` |
| Escherichia coli | `<100` | `101–200` | `201–300` |

Importer tyto hranice nepoužívá k výpočtu. Ukládá třídu dodanou zdrojem.

## Regulační kontext

Veřejná aplikace stále zobrazuje odkaz na starší předpis `028/19`. Aktuální
zpráva JP Morsko dobro pro sezonu 2026 uvádí klasifikaci podle článku 8 nového
předpisu `19/26`. Dokumentace projektu proto nesmí tvrdit, že `028/19` je
aktuální právní základ bez dalšího ověření.

Zdroj:

<https://www.morskodobro.me/me/aktuelnosti/1200-rezultati-analize-kvaliteta-morske-vode>

## Licence a provozní omezení

Na veřejné monitorovací stránce nebyla nalezena samostatná licence ani podmínky
pro automatizovanou redistribuci dat. Z toho nelze dovodit neomezené právo
opakovaného stahování nebo dalšího zveřejňování.

Do vyjasnění:

- používat nízkou frekvenci požadavků,
- uvádět přímou atribuci a odkaz na zdroj,
- uchovávat čas importu,
- nepřekrývat oficiální službu agresivním pollingem,
- před veřejným produkčním provozem požádat JP Morsko dobro o potvrzení
  podmínek automatizovaného použití.

## Bezpečné selhání

- Import odmítne neznámou číselnou třídu.
- Nejasné nebo chybějící datum způsobí chybu.
- Chybějící numerické mikrobiologické hodnoty zůstávají `null`.
- Aktivní dataset se zapisuje až po úplném stažení a normalizaci.
- Reprezentativní raw odpovědi se ukládají pro audit mapování.
