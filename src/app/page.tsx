import { Reveals } from "@/components/fx/Reveals";
import { Characters } from "@/components/home/Characters";
import { Editions } from "@/components/home/Editions";
import { Hero } from "@/components/home/Hero";
import { Locations } from "@/components/home/Locations";
import { Newsletter } from "@/components/home/Newsletter";
import { Trailers } from "@/components/home/Trailers";
import { localize } from "@/i18n/content";
import { getDictionary } from "@/i18n/server";
import { db } from "@/lib/db";

export default async function Home() {
  const { locale } = await getDictionary();
  const [characters, editions, locations, trailers] = await Promise.all([
    db.character.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        title: true,
        bio: true,
        quote: true,
        nameEn: true,
        titleEn: true,
        bioEn: true,
        quoteEn: true,
        image: true,
        focus: true,
      },
    }),
    db.edition.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        tagline: true,
        priceCents: true,
        currency: true,
        features: true,
        nameEn: true,
        taglineEn: true,
        featuresEn: true,
        image: true,
        focus: true,
      },
    }),
    db.location.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        kind: true,
        description: true,
        nameEn: true,
        kindEn: true,
        descriptionEn: true,
        image: true,
        focus: true,
      },
    }),
    db.trailer.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, title: true, description: true, titleEn: true, descriptionEn: true, image: true, youtubeId: true },
    }),
  ]);

  const view = {
    characters: characters.map((c) => localize(c, locale, ["name", "title", "bio", "quote"])),
    editions: editions.map((e) => localize(e, locale, ["name", "tagline", "features"])),
    locations: locations.map((l) => localize(l, locale, ["name", "kind", "description"])),
    trailers: trailers.map((t) => localize(t, locale, ["title", "description"])),
  };

  return (
    <main>
      <Hero />
      {view.characters.length > 0 && <Characters characters={view.characters} />}
      {view.editions.length > 0 && <Editions editions={view.editions} locale={locale} />}
      {view.locations.length > 0 && <Locations locations={view.locations} />}
      {view.trailers.length > 0 && <Trailers trailers={view.trailers} />}
      <Newsletter />
      <Reveals />
    </main>
  );
}
