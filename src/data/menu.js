/*
 * Menu content, mirroring the printed card in the shop.
 * Every translatable string is a { nl, en } pair; a bare string (Espresso,
 * Tiramisu, prices) is identical in both languages and passes through t()
 * untouched.
 *
 * Section kinds:
 *   group   — plain heading + priced list
 *   box     — same, on the inset cream panel
 *   boxList — inset panel with an unpriced, wrapping name list
 *   feature — the highlighted matcha panel, with its own badge
 *   till    — the "Lunch tot 15:00" footnote
 */

export const lunchCard = {
  title: 'Lunch',
  columns: [
    [
      {
        kind: 'group',
        heading: { nl: 'Broodjes', en: 'Sandwiches' },
        items: [
          {
            name: 'Carpaccio',
            price: '€11.95',
            desc: {
              nl: 'Focaccia, rucola, Parmezaanse kaas, pijnboompitten, truffelmayonaise',
              en: 'Focaccia bread, Rucola, Parmesan cheese, Pine nuts, Truffle mayo',
            },
          },
          {
            name: 'Caprese',
            price: '€8.95',
            desc: {
              nl: 'Focaccia, mozzarella, tomaat, huisgemaakte groene pesto, rucola',
              en: 'Focaccia bread, Mozzarella, Tomato, Homemade green pesto, Rucola',
            },
          },
          {
            name: { nl: 'Tonijn Melt', en: 'Tuna Melt' },
            price: '€9.95',
            desc: {
              nl: 'Focaccia, tonijnsalade, kaas, cherrytomaat, rode ui, sla',
              en: 'Focaccia bread, Tuna salad, Cheese, Cherrytomato, Red onion, Lettuce',
            },
          },
          {
            name: { nl: 'Gerookte Zalm', en: 'Smoked Salmon' },
            price: '€12.95',
            desc: {
              nl: 'Focaccia, avocado, roomkaas, dille, citroendressing, rucola',
              en: 'Focaccia bread, Avocado, Cream cheese, Dill, Lemon dressing, Rucola',
            },
          },
          {
            name: { nl: 'Hete Kip', en: 'Spicy Chicken' },
            price: '€10.95',
            desc: {
              nl: 'Focaccia, sla, kip, kaas, speciale Faim-saus',
              en: 'Focaccia bread, Lettuce, Chicken, Cheese, Special Faim sauce',
            },
          },
        ],
      },
      {
        kind: 'group',
        heading: { nl: 'Salades', en: 'Salads' },
        items: [
          {
            name: 'Burrata',
            price: '€14.95',
            desc: {
              nl: 'Burrata, komkommer, vijgen, gerookte amandelen, tomaat, balsamicostroop, huisgemaakte groene pesto',
              en: 'Burrata, Cucumber, Figs, Smoked almonds, Tomato, Balsamic glaze, Homemade green pesto',
            },
          },
          {
            name: { nl: 'Caesar', en: 'Ceasar' },
            price: '€13.95',
            desc: {
              nl: 'Romaine sla, Parmezaanse kaas, croutons, gekookt ei, kip en Caesardressing',
              en: 'Romaine lettuce, Parmesan cheese, Croutons, Boiled egg, Chicken and Ceaser dressing',
            },
          },
          {
            name: { nl: 'Zalm', en: 'Salmon' },
            price: '€14.95',
            desc: {
              nl: 'Romaine sla, kappertjes, rode ui, tomaat, komkommer en honing-mosterd-dilledressing',
              en: 'Romaine lettuce, Capers, Red onion, Tomato, Cucumber and Honey mustard dill dressing',
            },
          },
        ],
      },
    ],
    [
      {
        kind: 'group',
        heading: { nl: 'Pannenkoeken', en: 'Pancakes' },
        items: [
          {
            name: { nl: 'Choco Banaan Amandel', en: 'Choco Ban Almo' },
            price: '€9.95',
            desc: {
              nl: 'Amandelmascarpone, amandelpraliné, banaan, amandelen, chocoladestukjes en ahornsiroop',
              en: 'Almond mascarpone, Almond praline, Bananas, Almonds, Chocolate chips and Maple syrup',
            },
          },
          {
            name: { nl: 'Pistache Rode Vruchten', en: 'Pistachio Berries' },
            price: '€10.95',
            desc: {
              nl: 'Pistachemascarpone, pistachepraliné, rode vruchten, pistachenoten, rozenblaadjes en ahornsiroop',
              en: 'Pistachio mascarpone, Pistachio praline, Red fruits, Pistachios, Rose petals and Maple syrup',
            },
          },
          {
            name: 'Loaded Biscoff',
            price: '€9.95',
            desc: {
              nl: 'Biscoff mascarpone, Lotus crumble, Biscoff en witte chocoladepasta',
              en: 'Biscoff mascarpone, Lotus crumbles, Biscoff and White chocolate spread',
            },
          },
        ],
      },
      {
        kind: 'boxList',
        heading: { nl: 'Gebak', en: 'Pastries' },
        lead: {
          nl: 'Dagelijkse selectie aan de toonbank',
          en: 'Daily selection at the counter',
        },
        list: [
          { nl: 'Koekjes', en: 'Cookies' },
          { nl: 'Taartpunten', en: 'Cake slices' },
          { nl: 'Kaneelbroodjes', en: 'Cinnamon rolls' },
          'Cheesecake',
          'Tiramisu',
          'Brownies',
          'Muffins',
          { nl: 'Dessertbekers', en: 'Dessert cups' },
          { nl: 'Signature gebak', en: 'Signature pastries' },
          { nl: 'Bananenbrood', en: 'Banana bread' },
        ],
        note: { nl: 'Aanbod kan dagelijks variëren.', en: 'Selection may vary daily.' },
      },
      { kind: 'till', text: { nl: 'Lunch tot 15:00', en: 'Lunch till 15:00' } },
    ],
  ],
};

export const drinksCard = {
  title: { nl: 'Dranken', en: 'Drinks' },
  columns: [
    [
      {
        kind: 'group',
        heading: { nl: 'Warme Dranken', en: 'Hot Drinks' },
        items: [
          { name: { nl: 'Koffie', en: 'Coffee' }, price: '€3.20' },
          { name: 'Espresso', price: '€3.20' },
          { name: 'Cappuccino', price: '€3.40' },
          { name: 'Macchiato', price: '€4.10' },
          { name: 'Flat White', price: '€4.90' },
          { name: { nl: 'Warme Chocolademelk', en: 'Hot Chocolate' }, price: '€3.70' },
          { name: { nl: 'Thee', en: 'Tea' }, price: '€3.40' },
        ],
      },
      {
        kind: 'group',
        heading: { nl: 'IJskoffie', en: 'Iced Coffee' },
        items: [
          { name: { nl: 'Klassiek', en: 'Classic' }, price: '€5.50' },
          { name: { nl: 'Karamel', en: 'Caramel' }, price: '€5.70' },
          { name: { nl: 'Vanille', en: 'Vanilla' }, price: '€5.70' },
          { name: { nl: 'Chocolade', en: 'Chocolate' }, price: '€5.70' },
          { name: 'Crème Brûlée', price: '€6.50' },
          { name: 'Tiramisu', price: '€6.50' },
        ],
      },
      {
        kind: 'box',
        heading: { nl: "Extra's", en: 'Extras' },
        items: [
          { name: { nl: 'Slagroom', en: 'Whipped Cream' }, price: '€0.50' },
          { name: 'Cold Foam', price: '€0.75' },
          { name: { nl: 'Siroop', en: 'Syrup' }, price: '€0.75' },
          { name: { nl: 'Melkopties', en: 'Milk Options' }, price: '€0.50' },
        ],
      },
    ],
    [
      {
        kind: 'feature',
        badge: { nl: 'Huisfavoriet', en: 'House favourite' },
        groups: [
          {
            heading: 'Matcha',
            items: [
              {
                name: 'Iced Latte',
                price: '€7.00',
                from: { nl: 'Vanaf', en: 'From' },
                desc: {
                  nl: 'Kies smaak, melk en siroop naar wens — vraag de barista naar de opties.',
                  en: 'Choose your flavor, milk and syrup — ask the barista for the options.',
                },
              },
            ],
          },
          {
            heading: { nl: 'Specials', en: 'Specialty' },
            sub: true,
            items: [
              {
                name: 'Strawberry Shortcake',
                price: '€8.00',
                desc: {
                  nl: 'Aardbei, koekjessiroop, melk naar keuze, aardbeien cold foam, koekjeskruimels',
                  en: 'Strawberry, Cookie syrup, Milk of choice, Strawberry cold foam, Cookie crumbs',
                },
              },
              {
                name: 'Crème Brûlée',
                price: '€8.00',
                desc: {
                  nl: 'Vanillesiroop, melk naar keuze, matcha, crème brûlée met gekarameliseerde suiker',
                  en: 'Vanilla syrup, Milk of choice, Matcha, Crème brûlée with caramelized sugar',
                },
              },
              {
                name: 'Coconut Cloud',
                price: '€7.75',
                desc: { nl: 'Kokoswater, romige matcha', en: 'Coconut water, Creamy matcha' },
              },
            ],
          },
        ],
      },
      {
        kind: 'group',
        heading: { nl: 'Frisdranken', en: 'Beverages' },
        items: [
          { name: 'Coca Cola', price: '€3.30' },
          { name: 'Cola Zero', price: '€3.30' },
          { name: 'Fanta', price: '€3.30' },
          { name: 'Sprite', price: '€3.30' },
          { name: 'Ice Tea', price: '€3.40' },
          { name: { nl: 'Ice Tea Perzik', en: 'Ice Tea Peach' }, price: '€3.40' },
          { name: { nl: 'Appelsap', en: 'Apple Juice' }, price: '€3.30' },
          { name: { nl: 'Sinaasappelsap', en: 'Orange Juice' }, price: '€3.30' },
          { name: { nl: 'Water / Bruisend', en: 'Water / Sparkling' }, price: '€2.90' },
          { name: 'Red Bull', price: '€3.90' },
        ],
      },
    ],
  ],
};

export const menuCards = [lunchCard, drinksCard];
