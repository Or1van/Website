import type { Metadata } from "next";
import Image from "next/image";
import { getDictionary } from "@/i18n/server";
import styles from "../pages.module.css";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).t.meta.credits };
}

const BASE = "https://commons.wikimedia.org/wiki/File:";

// All works are in the public domain; links point to their Wikimedia Commons source pages.
const CREDITS = [
  { file: "hero-abbey.jpg", work: "Абатство в дубовому лісі", workEn: "The Abbey in the Oakwood", artist: "Каспар Давид Фрідріх", artistEn: "Caspar David Friedrich", year: "1809–1810", source: "Caspar_David_Friedrich_-_Abtei_im_Eichwald_-_Google_Art_Project.jpg" },
  { file: "char-elias.jpg", work: "Мандрівник над морем туману", workEn: "Wanderer above the Sea of Fog", artist: "Каспар Давид Фрідріх", artistEn: "Caspar David Friedrich", year: "бл. 1818", source: "Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg" },
  { file: "char-severina.jpg", work: "Мадам X (мадам П'єр Готро)", workEn: "Madame X (Madame Pierre Gautreau)", artist: "Джон Сінгер Сарджент", artistEn: "John Singer Sargent", year: "1883–1884", source: "Madame_X_(Madame_Pierre_Gautreau),_John_Singer_Sargent,_1884_(unfree_frame_crop).jpg" },
  { file: "char-odilon.jpg", work: "Святий Франциск у медитації", workEn: "Saint Francis in Meditation", artist: "Франсиско де Сурбаран", artistEn: "Francisco de Zurbarán", year: "1635–1639", source: "Francisco_de_Zurbarán_053.jpg" },
  { file: "char-ilona.jpg", work: "Дівчина зі свічкою", workEn: "Girl with a Candle", artist: "Послідовник Годфріда Схалкена", artistEn: "Follower of Godfried Schalcken", year: "XVIII ст.", source: "Follower_of_Godefridus_Schalcken_-_Girl_with_a_Candle_-_GS-101_-_Leiden_Collection.jpg" },
  { file: "char-lind.jpg", work: "Автопортрет зі Смертю, що грає на скрипці", workEn: "Self-Portrait with Death Playing the Fiddle", artist: "Арнольд Бёклін", artistEn: "Arnold Böcklin", year: "1872", source: "Arnold_Boecklin-fiedelnder_Tod.jpg" },
  { file: "loc-isle.jpg", work: "Острів мертвих (третя версія)", workEn: "Isle of the Dead (third version)", artist: "Арнольд Бёклін", artistEn: "Arnold Böcklin", year: "1883", source: "Arnold_Böcklin_-_Die_Toteninsel_III_(Alte_Nationalgalerie,_Berlin).jpg" },
  { file: "loc-manor.jpg", work: "Вулиця при місячному світлі", workEn: "Street Scene in Moonlight", artist: "Джон Аткінсон Ґрімшоу", artistEn: "John Atkinson Grimshaw", year: "XIX ст.", source: "John_Atkinson_Grimshaw_-_Street_Scene_in_Moonlight.jpg" },
  { file: "loc-mill.jpg", work: "Зимовий пейзаж", workEn: "Winter Landscape", artist: "Якоб ван Рейсдал", artistEn: "Jacob van Ruisdael", year: "бл. 1670", source: "Jacob_van_Ruisdael_-_Winter_Landscape_Mauritshuis.jpg" },
  { file: "loc-path.jpg", work: "Двоє чоловіків споглядають місяць", workEn: "Two Men Contemplating the Moon", artist: "Каспар Давид Фрідріх", artistEn: "Caspar David Friedrich", year: "бл. 1825–1830", source: "Friedrich_-_Two_Men_Contemplating_the_Moon.jpg" },
];

export default async function CreditsPage() {
  const { locale, t } = await getDictionary();
  const en = locale === "en";
  return (
    <main className="page">
      <div className="container">
        <p className="eyebrow">{t.credits.eyebrow}</p>
        <h1 className="page-title">{t.credits.title}</h1>
        <p className={styles.lead}>{t.credits.lead}</p>
        <ul className={styles.credits}>
          {CREDITS.map((c) => (
            <li key={c.file}>
              <div className={styles.creditThumb}>
                <Image src={`/images/${c.file}`} alt={en ? c.workEn : c.work} fill sizes="96px" style={{ objectFit: "cover" }} />
              </div>
              <div>
                <p className={styles.itemName}>{en ? c.workEn : c.work}</p>
                <p className={styles.muted}>
                  {en ? c.artistEn : c.artist}, {en ? c.year.replace("бл.", "c.").replace(" ст.", " c.") : c.year}
                </p>
                <a href={`${BASE}${c.source}`} target="_blank" rel="noopener noreferrer" className={styles.link}>
                  Wikimedia Commons ↗
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
