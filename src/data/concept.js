// "Het concept" block. Same { nl, en } convention as the rest of src/data:
// a bare string means the text is identical in both languages.

export const conceptBlock = {
  kicker: { nl: 'Het concept', en: 'The concept' },
  heading: { nl: 'Een plek waar je blijft hangen', en: 'A place where you linger' },
  body1: {
    nl: 'Café Faim is een plek waar je samenkomt, waar je blijft hangen, waar je even ontsnapt aan de drukte en gewoon geniet. Een kleine pauze in je dag — met de geur van vers gebakken lekkers om je heen.',
    en: 'Café Faim is a place where you come together, where you linger, where you escape the rush for a moment and simply enjoy. A small pause in your day — surrounded by the smell of freshly baked treats.',
  },
  body2: {
    nl: 'Alles wat je hier proeft wordt met liefde en aandacht gemaakt. Denk aan loaded cookies die rijk gevuld zijn en precies goed in elke bite, romige cheesecakes, gepersonaliseerde taarten en speelse cakepops die eruitzien als kleine cadeautjes.',
    en: 'Everything you taste here is made with love and attention. Think loaded cookies that are richly filled and just right in every bite, creamy cheesecakes, personalised cakes and playful cakepops that look like little gifts.',
  },
};

export const conceptPills = [
  { strong: '100%', label: { nl: 'Halal', en: 'Halal' } },
  { strong: { nl: 'Vers', en: 'Fresh' }, label: { nl: 'Elke dag', en: 'Every day' } },
  { strong: 'Matcha', label: { nl: 'Huisfavoriet', en: 'House favourite' } },
  { strong: { nl: 'Op maat', en: 'Custom' }, label: { nl: 'Taarten', en: 'Cakes' } },
];
