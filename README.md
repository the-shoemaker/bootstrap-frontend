# API-Dashboard

`index.html` über einen lokalen Webserver öffnen. Bootstrap 5.3.8 via CDN, HTML, CSS und JavaScript ohne Build oder API-Schlüssel. Daten werden erst nach Button-Klick geladen.

- Katzenbild: The Cat API, `/v1/images/search`.
- Bitcoin in USD und CHF: Coinbase, `/v2/prices/BTC-{currency}/spot`.
- Wetter: Open-Meteo, aktuelle Temperatur.
- Ladestationen: OpenStreetMap via Overpass, Umkreis 5 km, die fünf nächsten erfassten Stationen nach Luftlinie. Daten können unvollständig sein; keine Live-Verfügbarkeit.
- Karte: interaktive swisstopo-Landeskarte via map.geo.admin.ch, auf Zürich zentriert.

Fixer Standort: Zürich, 47.3769 / 8.5417. Öffentliche Dienste können Anfragen begrenzen. Bei Fehlern kann der jeweilige Button erneut benutzt werden. Der ursprüngliche Strukturentwurf liegt in `wireframe.svg`.
