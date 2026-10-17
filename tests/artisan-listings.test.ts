import { describe, expect, test } from "bun:test";
import { uniqueArtisanListings } from "../src/lib/artisanListings";
import type { Provider } from "../src/data/mockData";

const artisan = (id: number, overrides: Partial<Provider> = {}): Provider => ({
  id, brandName: "Ngozi Threadworks", firstName: "Ngozi", lastName: "Okafor",
  about: "Women's ready-to-wear with Afrocentric prints and modern silhouettes.",
  city: "Enugu", state: "Enugu", category: "tailoring", email: `${id}@example.test`,
  phone: "", rating: 0, reviewCount: 0, verified: false, featured: false,
  estimatedDeliveryDays: 7, heroImage: `${id}.jpg`, customOrdersEnabled: false, styleTags: [],
  ...overrides,
});

describe("Unique public artisan listings", () => {
  test("repeated IDs across pages appear once", () => {
    expect(uniqueArtisanListings([artisan(25), artisan(25, { about: "Updated profile" })]).map(p => p.id)).toEqual([25]);
  });
  test("Ngozi's duplicate profiles with different IDs, email and images appear once", () => {
    expect(uniqueArtisanListings([artisan(25), artisan(28, { brandName: " NGOZI  Threadworks " })]).map(p => p.id)).toEqual([25]);
  });
  test("businesses sharing a name remain separate when location or description differs", () => {
    expect(uniqueArtisanListings([artisan(25), artisan(28, { city: "Lagos" }), artisan(29, { about: "Independent bridal studio" })]).map(p => p.id)).toEqual([25, 28, 29]);
  });
  test("incomplete profiles with different IDs are not collapsed", () => {
    expect(uniqueArtisanListings([artisan(25, { about: "" }), artisan(28, { about: "" })])).toHaveLength(2);
  });
});