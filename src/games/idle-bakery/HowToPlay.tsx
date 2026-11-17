import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Hornear cada vez más galletas. No hay final: tu pastelería sigue creciendo.</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>Haz clic en la galleta gigante para hornear.</li>
          <li>
            Compra edificios (cursores, abuelas, granjas, minas…) que hornean solos. Cada uno cuesta
            un 15 % más que el anterior del mismo tipo.
          </li>
          <li>Las mejoras duplican la producción de un edificio o la fuerza de tus clics.</li>
          <li>
            De vez en cuando aparece un pastel dorado: haz clic antes de que desaparezca para
            conseguir una hornada de suerte, un frenesí (producción ×7 durante 77 s) o un frenesí de
            clics (×777 durante 13 s).
          </li>
          <li>
            Con un billón de galletas horneadas puedes ascender: empiezas de cero, pero cada nivel
            de prestigio suma un 1 % de producción para siempre.
          </li>
          <li>
            Mientras no juegas, tu pastelería produce un 10 % de lo normal (hasta 12 horas). Todo se
            guarda solo.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Bake more and more cookies. There is no end: your bakery keeps growing.</p>
      <h3>How to play</h3>
      <ul>
        <li>Click the big cookie to bake.</li>
        <li>
          Buy buildings (cursors, grandmas, farms, mines…) that bake by themselves. Each costs 15 %
          more than the last of its kind.
        </li>
        <li>Upgrades double a building’s production or the power of your clicks.</li>
        <li>
          Now and then a golden pastry appears: click it before it fades for a lucky haul, a frenzy
          (production ×7 for 77 s) or a click frenzy (×777 for 13 s).
        </li>
        <li>
          From a trillion cookies baked you can ascend: you start over, but each prestige level adds
          1 % production forever.
        </li>
        <li>
          While you are away, your bakery produces 10 % of normal (for up to 12 hours). Everything
          saves by itself.
        </li>
      </ul>
    </>
  );
}
