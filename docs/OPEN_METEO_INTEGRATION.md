# Open-Meteo — kontext počasí

## Účel

Open-Meteo poskytuje pouze kontext pro interpretaci stáří posledního oficiálního
odběru. Srážky, vítr a bouřka nejsou laboratorním důkazem hygienické kvality
vody a nesmějí měnit oficiální třídu.

## Použité rozhraní

Dokumentace:

<https://open-meteo.com/en/docs>

Endpoint:

```text
https://api.open-meteo.com/v1/forecast
```

Importer rozděluje lokality do dávkových požadavků po nejvýše 25 souřadnicích
a načítá:

- hodinové `precipitation` a `weather_code` za předchozích 72 hodin,
- aktuální `wind_speed_10m`, `wind_direction_10m` a `weather_code`,
- časovou zónu `Europe/Podgorica`,
- výchozí pozemní grid buňku pro lokální srážky.

Z hodinových dat se vypočítají součty 24/48/72 hodin. Bouřkový příznak se
aktivuje pro WMO kódy 95, 96 a 99 nebo při hodinové srážce alespoň 10 mm.

## Platnost a bezpečné chování

- Kontext se považuje za aktuální nejvýše 12 hodin.
- Starší nebo neplatný záznam vede na `unknown`, nikoli na nízké riziko.
- Výpadek Open-Meteo nesmí poškodit oficiální dataset.
- `local_incident_flag` zůstává `false`, dokud není připojen samostatný
  ověřovaný incidentní zdroj.

## Licence

Open-Meteo uvádí data pod CC BY 4.0. Bezplatné rozhraní je podle aktuálních
podmínek určeno pro nekomerční použití a má limity požadavků. Aplikace uvádí
atribuci a používá výrazně méně požadavků díky dávkovému načítání.

- Podmínky: <https://open-meteo.com/en/terms>
- Atribuce/licence: <https://open-meteo.com/en/pricing>

Před komerčním použitím je nutné znovu ověřit podmínky a případně použít placené
API.
