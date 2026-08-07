/**
 * City hubs are retired: a remote-only board has no city-specific inventory.
 * This module now only maps old city slugs onto their country hub so the
 * legacy `/jobs/in/cities/:city` URLs keep redirecting instead of 404ing.
 */
export { LEGACY_CITY_REDIRECTS as CITY_REDIRECTS } from "./countryHubs";
