export const DEMO_CITY = {
  name: "Manhattan, NYC",
  lat: 40.7589,
  lng: -73.9851,
  radiusKm: 5,
};

const KM_PER_DEG_LAT = 110.574;

function kmPerDegLng(lat: number): number {
  return 111.32 * Math.cos((lat * Math.PI) / 180);
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rand01(seed: number, salt: number): number {
  const x = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function spreadAroundCity(id: string): { lat: number; lng: number } {
  const seed = hashStr(id);
  const r = rand01(seed, 1) * DEMO_CITY.radiusKm;
  const theta = rand01(seed, 2) * 2 * Math.PI;
  const dx = r * Math.cos(theta);
  const dy = r * Math.sin(theta);
  const lat = DEMO_CITY.lat + dy / KM_PER_DEG_LAT;
  const lng = DEMO_CITY.lng + dx / kmPerDegLng(DEMO_CITY.lat);
  return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
}
