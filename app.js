'use strict';

const latitude = 47.3769;
const longitude = 8.5417;
const number = new Intl.NumberFormat('de-CH', { maximumFractionDigits: 2 });

async function getJSON(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(35000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

// Each button loads independently. Errors leave earlier results visible.
function connect(buttonId, action) {
  const button = document.getElementById(buttonId);
  const status = document.createElement('p');
  status.className = 'small mt-2 mb-0';
  status.setAttribute('role', 'status');
  button.after(status);
  button.addEventListener('click', async () => {
    button.disabled = true;
    status.classList.remove('text-danger');
    status.textContent = 'Wird geladen …';
    button.setAttribute('aria-busy', 'true');
    try {
      await action();
      status.textContent = '';
    } catch (error) {
      status.classList.add('text-danger');
      status.textContent = 'Laden fehlgeschlagen. Bitte erneut versuchen.';
      console.error(buttonId, error);
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  });
}

connect('load-cat', async () => {
  const images = await getJSON('https://api.thecatapi.com/v1/images/search');
  const url = new URL(images[0].url);
  if (url.protocol !== 'https:') throw new Error('Invalid image URL');
  const image = new Image();
  image.alt = 'Zufälliges Katzenbild';
  image.className = 'cat-image';
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Image timeout')), 20000);
    image.onload = () => { clearTimeout(timer); resolve(); };
    image.onerror = () => { clearTimeout(timer); reject(new Error('Image failed')); };
    image.src = url.href;
  });
  const result = document.getElementById('cat-result');
  result.removeAttribute('aria-label');
  result.replaceChildren(image);
});

connect('load-bitcoin', async () => {
  const prices = await Promise.all(['USD', 'CHF'].map(async currency => {
    const result = await getJSON(`https://api.coinbase.com/v2/prices/BTC-${currency}/spot`);
    const amount = Number(result.data.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Invalid price');
    return amount;
  }));
  document.getElementById('bitcoin-usd').textContent = number.format(prices[0]);
  document.getElementById('bitcoin-chf').textContent = number.format(prices[1]);
});

connect('load-weather', async () => {
  const data = await getJSON(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&timezone=Europe%2FZurich`);
  if (!Number.isFinite(data.current?.temperature_2m)) throw new Error('Invalid weather');
  document.getElementById('weather-temperature').textContent = `${number.format(data.current.temperature_2m)} °C`;
});

// Haversine distance in kilometres, measured in a straight line.
function distance(lat, lon) {
  const radians = value => value * Math.PI / 180;
  const a = Math.sin(radians(lat - latitude) / 2) ** 2
    + Math.cos(radians(latitude)) * Math.cos(radians(lat))
    * Math.sin(radians(lon - longitude) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

connect('load-stations', async () => {
  const query = `[out:json][timeout:25];nwr[amenity=charging_station](around:5000,${latitude},${longitude});out center tags;`;
  const data = await getJSON('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: new URLSearchParams({ data: query }),
  });
  if (!Array.isArray(data.elements) || data.remark) throw new Error('Incomplete stations response');
  const stations = data.elements.map(station => {
    const point = station.center || station;
    return { ...station, distance: distance(point.lat, point.lon) };
  }).filter(station => Number.isFinite(station.distance))
    .sort((a, b) => a.distance - b.distance).slice(0, 5);
  const list = document.getElementById('stations-result');
  const rows = stations.map(station => {
    const item = document.createElement('li');
    item.className = 'list-group-item';
    const link = document.createElement('a');
    link.href = `https://www.openstreetmap.org/${station.type}/${station.id}`;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = station.tags.name || station.tags.operator || 'Ladestation';
    item.append(link, ` · ${number.format(station.distance)} km Luftlinie`);
    const address = [station.tags['addr:street'], station.tags['addr:housenumber']].filter(Boolean).join(' ');
    if (address) {
      const detail = document.createElement('div');
      detail.className = 'small text-secondary';
      detail.textContent = address;
      item.append(detail);
    }
    return item;
  });
  list.replaceChildren(...rows);
  if (!stations.length) {
    const item = document.createElement('li');
    item.className = 'list-group-item';
    item.textContent = 'Keine Ladestationen im Umkreis von 5 km gefunden.';
    list.append(item);
  }
});

connect('load-map', async () => {
  const map = document.createElement('iframe');
  map.title = 'swisstopo: Zürich';
  map.className = 'map-frame';
  map.referrerPolicy = 'no-referrer';
  // Zürich in the Swiss LV95 coordinate system used by geo.admin.ch.
  map.src = 'https://map.geo.admin.ch/#/embed?lang=de&center=2683304.03,1247925.60&z=8&bgLayer=ch.swisstopo.pixelkarte-farbe';
  const result = document.getElementById('map-result');
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { map.remove(); reject(new Error('Map timeout')); }, 25000);
    map.onload = () => { clearTimeout(timer); resolve(); };
    map.onerror = () => { clearTimeout(timer); map.remove(); reject(new Error('Map failed')); };
    result.replaceChildren(map);
  });
});
