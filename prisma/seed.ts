import "dotenv/config";
import { hash } from "@node-rs/argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const characters = [
  {
    slug: "elias",
    name: "Еліас Ворен",
    title: "Мандрівник",
    bio: "Картограф зі Львова, який отримав лист від зниклої сестри — без зворотної адреси, але з печаткою маєтку Морвель. Щоб знайти її, Еліасу доведеться пройти долиною, якої немає на жодній мапі, і з'ясувати, чому туман у Голловмірі пам'ятає імена.",
    quote: "Я малював мапи всього світу. Але цю долину туман малює сам.",
    image: "/images/char-elias.jpg",
    focus: "50% 38%",
  },
  {
    slug: "severina",
    name: "Графиня Северина Морвель",
    title: "Господиня маєтку",
    bio: "Вона не старіє вже сто років і не пам'ятає жодного з них. Северина приймає гостей у бальній залі, де годинники зупинилися на 23:47, і кожному пропонує угоду: вічна молодість в обмін на одне ім'я, вписане до книги варти.",
    quote: "Не бійтеся, пане Ворен. Тут ніхто не помирає. Тут лише забувають.",
    image: "/images/char-severina.jpg",
    focus: "55% 14%",
  },
  {
    slug: "odilon",
    name: "Брат Оділон",
    title: "Хранитель затопленої каплиці",
    bio: "Останній монах ордену, що століттями стеріг долину від того, що спить під озером. Оділон розмовляє з черепами своїх братів і запевняє, що вони відповідають. Він знає правду про варту, але скаже її лише тому, хто принесе дзвін із дзвіниці.",
    quote: "Ми не молимося, щоб воно прокинулося. Ми молимося, щоб воно не почуло.",
    image: "/images/char-odilon.jpg",
    focus: "50% 18%",
  },
  {
    slug: "ilona",
    name: "Ілона Ворен",
    title: "Та, що несе свічку",
    bio: "Сестра Еліаса. Пів року тому вона поїхала до Голловміру вчителювати й перестала писати. Мешканці кажуть, що ночами бачать її на дорозі до млина: дівчина зі свічкою, яка ніколи не гасне, усміхається і кличе брата на ім'я.",
    quote: "Еліасе, ти запізнився. Свічка горить уже так довго…",
    image: "/images/char-ilona.jpg",
    focus: "55% 35%",
  },
  {
    slug: "lind",
    name: "Маестро Каспар Лінд",
    title: "Художник, якому грає Смерть",
    bio: "Придворний портретист Морвелів. Кожен, кого він малює, зникає до світанку, а портрет на стіні починає дихати. Лінд давно не тримає пензля з власної волі: за його плечем завжди хтось грає на скрипці, і цю мелодію чує лише він.",
    quote: "Я не вбивця. Я лише закінчую те, що вона починає грати.",
    image: "/images/char-lind.jpg",
    focus: "45% 25%",
  },
];

const editions = [
  {
    slug: "standard",
    name: "Стандартне видання",
    tagline: "Почни свою варту",
    priceCents: 4900,
    image: "/images/loc-isle.jpg",
    focus: "50% 45%",
    features: [
      "Hollowmere: Остання варта",
      "Саундтрек «Колискова туману» (5 треків)",
      "Бонус передзамовлення: ліхтар «Остання свічка»",
    ],
  },
  {
    slug: "deluxe",
    name: "Делюкс",
    tagline: "Для тих, хто хоче побачити більше",
    priceCents: 6900,
    image: "/images/char-severina.jpg",
    focus: "50% 16%",
    features: [
      "Hollowmere: Остання варта",
      "Доповнення «Портрети Морвелів»",
      "Повний саундтрек (24 треки)",
      "Цифровий артбук",
      "Набір костюмів «Варта»",
    ],
  },
  {
    slug: "collector",
    name: "Колекційне видання",
    tagline: "Уся книга варти",
    priceCents: 8900,
    image: "/images/char-odilon.jpg",
    focus: "50% 14%",
    features: [
      "Усе з видання Делюкс",
      "Сезонний пропуск: 3 сюжетні доповнення",
      "«Книга варти» з коментарями сценаристів",
      "Режим «Свічка»: проходження без світла",
      "Ранній доступ за 72 години до релізу",
    ],
  },
];

const locations = [
  {
    slug: "abbey",
    name: "Руїни абатства",
    description: "Колись тут правили службу за тих, кого забрав туман. Тепер між дубами блукають процесії без облич, а вітраж у вцілілій стіні щоночі світиться о 23:47.",
    image: "/images/loc-abbey.jpg",
    focus: "50% 60%",
  },
  {
    slug: "isle",
    name: "Острів Мовчання",
    description: "Кладовище посеред озера, куди мертвих везуть човном. Звук тут не поширюється: ти не почуєш власних кроків — і не почуєш тих, хто йде позаду.",
    image: "/images/loc-isle.jpg",
    focus: "45% 50%",
  },
  {
    slug: "manor",
    name: "Маєток Морвель",
    description: "Тридцять кімнат і жодного дзеркала. Вікна світяться навіть тоді, коли в домі нікого немає, а сад за огорожею щоночі підступає трохи ближче до дверей.",
    image: "/images/loc-manor.jpg",
    focus: "50% 50%",
  },
  {
    slug: "mill",
    name: "Зимовий млин",
    description: "Колесо замерзло понад століття тому, але щоночі мешканці чують, як воно крутиться. Мірошник меле щось, що зовсім не схоже на зерно.",
    image: "/images/loc-mill.jpg",
    focus: "45% 70%",
  },
  {
    slug: "path",
    name: "Місячна стежка",
    description: "Єдина дорога з долини. Ті, хто вирушав нею вночі, поверталися на світанку й не пам'ятали, що кудись ішли. Двоє з них досі стоять на пагорбі й дивляться на місяць.",
    image: "/images/loc-path.jpg",
    focus: "30% 50%",
  },
];

const trailers = [
  {
    title: "Тизер: Туман пам'ятає",
    description: "Перший погляд на долину Голловмір.",
    image: "/images/hero-abbey.jpg",
  },
  {
    title: "Геймплей: Маєток Морвель",
    description: "П'ятнадцять хвилин у маєтку без жодного джерела світла.",
    image: "/images/loc-manor.jpg",
  },
  {
    title: "Історія: Та, що несе свічку",
    description: "Сюжетний трейлер про Ілону Ворен.",
    image: "/images/char-ilona.jpg",
  },
];

// English translations, applied to the EN columns only so admin edits to Ukrainian text survive re-seeding.
const charactersEn: Record<string, { nameEn: string; titleEn: string; bioEn: string; quoteEn: string }> = {
  elias: {
    nameEn: "Elias Voren",
    titleEn: "The Wanderer",
    bioEn: "A cartographer from Lviv who received a letter from his missing sister — no return address, only the seal of the Morvel estate. To find her, Elias must cross a valley that appears on no map and learn why the fog in Hollowmere remembers names.",
    quoteEn: "I have drawn maps of the whole world. But this valley, the fog draws itself.",
  },
  severina: {
    nameEn: "Countess Severina Morvel",
    titleEn: "Mistress of the Manor",
    bioEn: "She has not aged in a hundred years and remembers none of them. Severina receives her guests in a ballroom where every clock stopped at 11:47, and offers each of them the same bargain: eternal youth in exchange for one name written into the Book of the Vigil.",
    quoteEn: "Do not be afraid, Mr. Voren. No one dies here. Here, they only forget.",
  },
  odilon: {
    nameEn: "Brother Odilon",
    titleEn: "Keeper of the Drowned Chapel",
    bioEn: "The last monk of an order that for centuries guarded the valley from what sleeps beneath the lake. Odilon speaks to the skulls of his brothers and swears they answer. He knows the truth about the Vigil, but will tell it only to whoever brings him the bell from the belfry.",
    quoteEn: "We do not pray for it to wake. We pray that it does not hear.",
  },
  ilona: {
    nameEn: "Ilona Voren",
    titleEn: "She Who Carries the Candle",
    bioEn: "Elias's sister. Six months ago she went to Hollowmere to teach and stopped writing. Villagers say they see her at night on the road to the mill: a girl with a candle that never goes out, smiling and calling her brother by name.",
    quoteEn: "Elias, you're late. The candle has been burning for so long…",
  },
  lind: {
    nameEn: "Maestro Caspar Lind",
    titleEn: "The Painter for Whom Death Plays",
    bioEn: "Court portraitist to the Morvels. Everyone he paints vanishes before dawn, and the portrait on the wall begins to breathe. Lind stopped holding the brush of his own free will long ago: someone always plays the violin over his shoulder, and only he can hear the tune.",
    quoteEn: "I am not a murderer. I only finish what she begins to play.",
  },
};

const editionsEn: Record<string, { nameEn: string; taglineEn: string; featuresEn: string[] }> = {
  standard: {
    nameEn: "Standard Edition",
    taglineEn: "Begin your vigil",
    featuresEn: [
      "Hollowmere: The Last Vigil",
      "“Lullaby of the Fog” soundtrack (5 tracks)",
      "Pre-order bonus: “The Last Candle” lantern",
    ],
  },
  deluxe: {
    nameEn: "Deluxe",
    taglineEn: "For those who want to see more",
    featuresEn: [
      "Hollowmere: The Last Vigil",
      "“Portraits of the Morvels” expansion",
      "Full soundtrack (24 tracks)",
      "Digital artbook",
      "“Vigil” costume set",
    ],
  },
  collector: {
    nameEn: "Collector's Edition",
    taglineEn: "The complete Book of the Vigil",
    featuresEn: [
      "Everything in the Deluxe Edition",
      "Season pass: 3 story expansions",
      "“The Book of the Vigil” with writers' commentary",
      "Candle Mode: play without any light",
      "Early access 72 hours before release",
    ],
  },
};

const locationsEn: Record<string, { nameEn: string; kindEn: string; descriptionEn: string }> = {
  abbey: {
    nameEn: "Abbey Ruins",
    kindEn: "Playable location",
    descriptionEn: "Masses were once said here for those taken by the fog. Now faceless processions wander between the oaks, and the stained glass in the last standing wall lights up every night at 11:47.",
  },
  isle: {
    nameEn: "Isle of Silence",
    kindEn: "Playable location",
    descriptionEn: "A cemetery in the middle of the lake, where the dead are brought by boat. Sound does not carry here: you will not hear your own footsteps — or the steps of whoever walks behind you.",
  },
  manor: {
    nameEn: "Morvel Manor",
    kindEn: "Playable location",
    descriptionEn: "Thirty rooms and not a single mirror. The windows glow even when no one is home, and every night the garden beyond the fence creeps a little closer to the door.",
  },
  mill: {
    nameEn: "The Winter Mill",
    kindEn: "Playable location",
    descriptionEn: "The wheel froze over a century ago, yet every night the villagers hear it turning. The miller is grinding something that looks nothing like grain.",
  },
  path: {
    nameEn: "The Moonlit Path",
    kindEn: "Playable location",
    descriptionEn: "The only road out of the valley. Those who set out on it at night came back at dawn with no memory of having left. Two of them still stand on the hill, watching the moon.",
  },
};

const trailersEn: Record<string, { titleEn: string; descriptionEn: string }> = {
  "Тизер: Туман пам'ятає": { titleEn: "Teaser: The Fog Remembers", descriptionEn: "A first look at the Hollowmere valley." },
  "Геймплей: Маєток Морвель": { titleEn: "Gameplay: Morvel Manor", descriptionEn: "Fifteen minutes in the manor without a single light source." },
  "Історія: Та, що несе свічку": { titleEn: "Story: She Who Carries the Candle", descriptionEn: "A story trailer about Ilona Voren." },
};

async function main() {
  for (const [i, c] of characters.entries()) {
    const en = charactersEn[c.slug];
    await db.character.upsert({ where: { slug: c.slug }, create: { ...c, ...en, sortOrder: i }, update: en });
  }
  for (const [i, e] of editions.entries()) {
    const en = editionsEn[e.slug];
    await db.edition.upsert({ where: { slug: e.slug }, create: { ...e, ...en, sortOrder: i }, update: en });
  }
  for (const [i, l] of locations.entries()) {
    const en = locationsEn[l.slug];
    await db.location.upsert({ where: { slug: l.slug }, create: { ...l, ...en, sortOrder: i }, update: en });
  }
  if ((await db.trailer.count()) === 0) {
    await db.trailer.createMany({ data: trailers.map((t, i) => ({ ...t, sortOrder: i })) });
  }
  for (const [title, en] of Object.entries(trailersEn)) {
    await db.trailer.updateMany({ where: { title }, data: en });
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    if (password.length < 10) throw new Error("ADMIN_PASSWORD must be at least 10 characters");
    await db.user.upsert({
      where: { email },
      create: {
        email,
        name: "Адміністратор",
        role: "ADMIN",
        passwordHash: await hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1 }),
      },
      update: { role: "ADMIN" },
    });
    console.log(`Admin account: ${email}`);
  }
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
