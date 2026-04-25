/**
 * Curated Unsplash imagery. All photographs are sourced under the
 * Unsplash license. They are restricted to the categories defined in
 * the brand spec (aerial nighttime cities, architectural interiors,
 * dignified disaster aftermath, hands at work, topographic data).
 *
 * URLs use Unsplash's image CDN with explicit width and quality params
 * so the network footprint is bounded.
 */

export const heroAerial = {
  src: "https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=2400&q=80&auto=format&fit=crop",
  alt: "Aerial view of an American city skyline at dusk, lake horizon in the distance",
};

/**
 * Parallax intro reel — 7 stock photos used by the IntroParallax section.
 * Center (index 0) MUST be the hero photo so the parallax-end zooms into
 * the existing hero seamlessly. The remaining six are operations-flavored
 * editorial scenes: coordinator hands at work, civic interiors, dignified
 * disaster aftermath, topographic data, radios and dispatch equipment.
 */
export const parallaxReel = [
  {
    src: "https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=2400&q=80&auto=format&fit=crop",
    alt: "Aerial view of a city skyline at dusk — the editorial focal image",
  },
  {
    src: "https://images.unsplash.com/photo-1568667256549-094345857637?w=1600&q=80&auto=format&fit=crop",
    alt: "Architectural interior — long reading room with warm lamps",
  },
  {
    src: "https://images.unsplash.com/photo-1499914485622-a88fac536970?w=1200&q=80&auto=format&fit=crop",
    alt: "A hand resting on an open notebook, soft daylight",
  },
  {
    src: "https://images.unsplash.com/photo-1581922814484-0b48460b7010?w=1600&q=80&auto=format&fit=crop",
    alt: "Topographic and weather satellite imagery, monochrome",
  },
  {
    src: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=1600&q=80&auto=format&fit=crop",
    alt: "A quiet street at dawn after a storm, no people",
  },
  {
    src: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1600&q=80&auto=format&fit=crop",
    alt: "Hands at a laptop with a stethoscope — medical coordination",
  },
  {
    src: "https://images.unsplash.com/photo-1542621334-a254cf47733d?w=1600&q=80&auto=format&fit=crop",
    alt: "Engineering blueprint with a pencil — planning detail",
  },
] as const;

export const archInterior = {
  src: "https://images.unsplash.com/photo-1568667256549-094345857637?w=1600&q=80&auto=format&fit=crop",
  alt: "Architectural interior — long reading room with wooden shelves and warm lamps",
};

export const handOnNotebook = {
  src: "https://images.unsplash.com/photo-1499914485622-a88fac536970?w=1200&q=80&auto=format&fit=crop",
  alt: "A hand resting on an open notebook, soft daylight",
};

export const powerLineCrew = {
  src: "https://images.unsplash.com/photo-1473073898338-1370687abe98?w=1600&q=80&auto=format&fit=crop",
  alt: "Power line silhouettes against a dim winter sky",
};

export const topographicMap = {
  src: "https://images.unsplash.com/photo-1581922814484-0b48460b7010?w=1600&q=80&auto=format&fit=crop",
  alt: "Topographic and weather satellite imagery, monochrome",
};

export const floodedStreetDawn = {
  src: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=1600&q=80&auto=format&fit=crop",
  alt: "A quiet street at dawn after a storm, no people",
};
