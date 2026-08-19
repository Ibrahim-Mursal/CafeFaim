// Photos shown in the "In beeld" marquee and the "Taarten op maat" cards.
// Paths stay relative so the built site works from a domain root or a subfolder;
// the files live in public/assets and are copied through the build untouched.

export const cakeCategories = [
  {
    id: 'verjaardag',
    src: 'assets/gallery/verjaardag-goud.jpg',
    alt: 'Roze verjaardagstaart met gouden drip en macarons',
    title: { nl: 'Verjaardagstaarten', en: 'Birthday cakes' },
    blurb: { nl: 'Van klassiek tot volledig custom.', en: 'From classic to fully custom.' },
  },
  {
    id: 'bruiloft',
    src: 'assets/gallery/bruiloft-ruffle.jpg',
    alt: 'Tweelaagse bruiloftstaart met ruffles en gipskruid',
    title: { nl: 'Bruiloftstaarten', en: 'Wedding cakes' },
    blurb: { nl: 'Meerdere lagen, bloemen, jouw stijl.', en: 'Multi-tier, florals, your style.' },
  },
  {
    id: 'babyshower',
    src: 'assets/gallery/babyshower-vlinder.jpg',
    alt: 'Roze babyshowertaart met gouden silhouet en vlinders',
    title: { nl: 'Babyshower & gender reveal', en: 'Baby shower & gender reveal' },
    blurb: { nl: 'Zacht, lief en persoonlijk.', en: 'Soft, sweet and personal.' },
  },
  {
    id: 'sweettable',
    src: 'assets/gallery/sweettable-box.jpg',
    alt: 'Sweet table box met cakesicles, cupcakes en gouden details',
    title: { nl: 'Sweet tables', en: 'Sweet tables' },
    blurb: {
      nl: 'Cakesicles, cupcakes en desserts voor je feest.',
      en: 'Cakesicles, cupcakes and desserts for your party.',
    },
  },
];

// Eight tiles, drifting past in one continuous strip. Placeholder stand-ins
// until the cafe supplies interior / coffee / matcha / lunch photography —
// swapping a photo here is the only edit the marquee needs.
export const galleryPhotos = [
  {
    id: 'bruiloft',
    src: 'assets/gallery/bruiloft-ruffle.jpg',
    alt: 'Tweelaagse bruiloftstaart met ruffles en gipskruid',
    caption: { nl: 'Bruiloftstaarten', en: 'Wedding cakes' },
  },
  {
    id: 'babyshower',
    src: 'assets/gallery/babyshower-vlinder.jpg',
    alt: 'Roze babyshowertaart met gouden silhouet en vlinders',
    caption: { nl: 'Babyshower', en: 'Baby shower' },
  },
  {
    id: 'verjaardag',
    src: 'assets/gallery/verjaardag-goud.jpg',
    alt: 'Roze verjaardagstaart met gouden drip en macarons',
    caption: { nl: 'Verjaardagstaarten', en: 'Birthday cakes' },
  },
  {
    id: 'sweettable',
    src: 'assets/gallery/sweettable-box.jpg',
    alt: 'Sweet table box met cakesicles, cupcakes en gouden details',
    caption: { nl: 'Sweet tables', en: 'Sweet tables' },
  },
  {
    id: 'ohbaby',
    src: 'assets/gallery/ohbaby-drip.jpg',
    alt: "Roze 'Oh Baby' taart met witte chocoladedrip",
    caption: { nl: 'Oh Baby', en: 'Oh Baby' },
  },
  {
    id: 'kinder',
    src: 'assets/gallery/kinder-pikachu.jpg',
    alt: 'Kindertaart met Pikachu en gele botercrème',
    caption: { nl: 'Kindertaarten', en: "Kids' cakes" },
  },
  {
    id: 'bridetobe',
    src: 'assets/gallery/bridetobe-anjers.jpg',
    alt: 'Bride to be taart met anjers en witte ruffles',
    caption: { nl: 'Bride to be', en: 'Bride to be' },
  },
  {
    id: 'henna',
    src: 'assets/gallery/henna-rozen.jpg',
    alt: 'Witte hennataart met rode en witte rozen',
    caption: { nl: 'Henna & bruiloft', en: 'Henna & wedding' },
  },
];
