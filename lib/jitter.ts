const JITTER_DEG = 0.001;

export function jitter(lat: number, lng: number): { lat: number; lng: number } {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { lat, lng };
  const dLat = (Math.random() * 2 - 1) * JITTER_DEG;
  const dLng = (Math.random() * 2 - 1) * JITTER_DEG;
  return {
    lat: Number((lat + dLat).toFixed(6)),
    lng: Number((lng + dLng).toFixed(6)),
  };
}
