var SEED_ECOSSE_2026 = {
  trip: {
    id: "ecosse-2026",
    name: "Écosse — 30 ans de mariage",
    emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    startDate: "2026-06-24",
    endDate: "2026-06-29",
    travelers: [
      { name: "René", emoji: "👨", role: "owner" },
      { name: "Nicole", emoji: "👩", role: "traveler" }
    ],
    phases: [
      { name: "Préparation", label: "PREP — Veille de départ", range: [0, 0] },
      { name: "Édimbourg", label: "ÉDIMBOURG — Culture & romantisme", range: [1, 2] },
      { name: "Highlands", label: "HIGHLANDS — Road trip & nature", range: [3, 5] },
      { name: "Retour", label: "RETOUR — St Andrews & vol", range: [6, 6] }
    ]
  },
  days: [
    {
      day: 0,
      emoji: "📋",
      label: "Veille de départ — Checklist & valises",
      from: "Nice",
      locationId: "edinburgh",
      timeline: [
        { t: "🧳", d: "Préparer les valises (voir checklist)" },
        { t: "📋", d: "Vérifier passeports/CNI, adaptateur prise UK, carte bancaire" },
        { t: "✈️", d: "Confirmation vol easyJet Nice → Édimbourg (lendemain matin)" },
        { t: "🌤️", d: "Checker la météo Édimbourg — prévoir couches + imperméable" }
      ],
      highlights: [
        "⚠️ Prise UK = 3 broches, adaptateur indispensable",
        "🌡️ Écosse fin juin : 14-19°C, météo changeante, toujours un imperméable"
      ]
    },
    {
      day: 1,
      emoji: "✈️",
      label: "Arrivée Édimbourg",
      from: "Nice",
      to: "Édimbourg",
      hotelId: "the-witchery",
      locationId: "edinburgh",
      timeline: [
        { t: "🛫", d: "Vol Nice → Édimbourg (easyJet, direct 2h45)", accent: true },
        { t: "15:00", d: "Installation à The Witchery by the Castle" },
        { t: "16:00", d: "Balade Royal Mile & ruelles médiévales" },
        { t: "19:30", d: "🍽️ Dîner romantique aux chandelles — The Witchery (gothique, velours, vue château)", green: true }
      ],
      highlights: [
        "💡 The Witchery = seulement 9 suites, réservation indispensable",
        "🏰 Le château d'Édimbourg est illuminé le soir — vue magnifique depuis la terrasse"
      ]
    },
    {
      day: 2,
      emoji: "🏰",
      label: "Édimbourg en amoureux",
      from: "Édimbourg",
      hotelId: "the-witchery",
      locationId: "edinburgh",
      timeline: [
        { t: "09:00", d: "☕ Petit-déjeuner The Witchery" },
        { t: "10:00", d: "🏰 Château d'Édimbourg — visite matinale avant la foule" },
        { t: "12:00", d: "Dean Village — village caché, ruisseau, maisons XVIIe" },
        { t: "13:00", d: "🍽️ Déjeuner au bord de l'eau, Dean Village" },
        { t: "14:30", d: "🌿 Royal Botanic Garden — 28 hectares de jardins" },
        { t: "16:00", d: "🍫 Atelier chocolat Coco Chocolate OU Afternoon Tea" },
        { t: "18:00", d: "🥃 Scotch Malt Whisky Society — dégustation privée dans un club secret", green: true },
        { t: "20:30", d: "🌅 Arthur's Seat au coucher du soleil (22h) — vue 360° sur la ville", green: true },
        { t: "22:30", d: "🎵 Concert classique St Giles Cathedral (si programmation)" }
      ],
      highlights: [
        "💡 SMWS = club privé de whisky, ambiance fauteuils Chesterfield",
        "🌅 Fin juin, le soleil se couche vers 22h — lumière dorée magique sur la ville",
        "💕 Dean Village est l'un des coins les plus romantiques et secrets d'Édimbourg"
      ]
    },
    {
      day: 3,
      emoji: "🚗",
      label: "Road trip vers les Highlands",
      from: "Édimbourg",
      to: "Fort William",
      dist: "210 km",
      dur: "3h30",
      hotelId: "inverlochy-castle",
      locationId: "fort-william",
      timeline: [
        { t: "08:30", d: "🚗 Récupérer voiture de location (boîte auto, conduite à gauche !)", accent: true },
        { t: "09:30", d: "Route via Stirling — aperçu du château Wallace" },
        { t: "11:00", d: "☕ Arrêt village de Luss — scone & tea en bord du Loch Lomond" },
        { t: "13:00", d: "🍽️ Déjeuner route des Highlands" },
        { t: "14:30", d: "🚂 Viaduc de Glenfinnan — le pont Harry Potter + Jacobite Steam Train", green: true },
        { t: "16:30", d: "🏰 Eilean Donan Castle — château sur île, 3 lochs (£12/pers)", green: true },
        { t: "18:30", d: "Arrivée Inverlochy Castle Hotel" },
        { t: "19:30", d: "🍽️ Dîner gastronomique au château — gibier, fruits de mer, feu de cheminée", green: true }
      ],
      highlights: [
        "🚂 Le Jacobite Steam Train passe sur le viaduc vers 10h30 et 15h — vérifier horaires",
        "🏰 Eilean Donan = château le plus photographié d'Écosse, sublime en lumière rasante",
        "⚠️ Conduite à gauche — prendre une automatique pour éviter le stress"
      ]
    },
    {
      day: 4,
      emoji: "🌊",
      label: "Île de Skye",
      from: "Fort William",
      to: "Île de Skye",
      dist: "130 km",
      dur: "2h",
      hotelId: "skye-hotel",
      locationId: "isle-of-skye",
      timeline: [
        { t: "08:30", d: "Route vers l'île de Skye (pont gratuit)" },
        { t: "10:00", d: "🧚 Fairy Pools — piscines naturelles turquoise au pied des Cuillins", green: true },
        { t: "12:00", d: "🗿 Old Man of Storr — rando 1h30, vue spectaculaire sur la mer" },
        { t: "13:30", d: "🍽️ Déjeuner à Portree — fish & chips au port coloré" },
        { t: "15:00", d: "🥃 Distillerie Talisker — dégustation 'Made by the Sea' (£20/pers)", green: true },
        { t: "17:00", d: "🎨 Portree — galeries d'art, boutiques artisanales" },
        { t: "19:00", d: "🍽️ Dîner au Three Chimneys — meilleur resto d'Écosse, cottage bord de mer, menu dégustation ~£85/pers", green: true },
        { t: "22:00", d: "🌅 Neist Point Lighthouse — coucher de soleil sur les falaises (~22h30), dauphins possibles", green: true }
      ],
      highlights: [
        "💕 Three Chimneys = restaurant mythique, cottage isolé, produits ultra locaux — RÉSERVER",
        "🧚 Les Fairy Pools sont magiques par temps clair — eau turquoise cristalline",
        "🥃 Talisker = le whisky de la mer, iodé et fumé, unique au monde"
      ]
    },
    {
      day: 5,
      emoji: "⛰️",
      label: "Glen Coe & Loch Ness",
      from: "Île de Skye",
      to: "Highlands",
      dist: "180 km",
      dur: "3h",
      hotelId: "highland-lodge",
      locationId: "glen-coe",
      timeline: [
        { t: "08:30", d: "Route retour depuis Skye" },
        { t: "10:30", d: "⛰️ Vallée de Glen Coe — la plus spectaculaire d'Écosse", green: true },
        { t: "11:30", d: "🥾 Rando Lost Valley — cirque caché entre les montagnes (2h A/R)" },
        { t: "14:00", d: "🍽️ Déjeuner au Clachaig Inn (pub mythique Glen Coe)" },
        { t: "15:30", d: "🚤 Croisière Loch Ness — château Urquhart depuis l'eau, Nessie ? 🦕", green: true },
        { t: "17:00", d: "🏰 Urquhart Castle — ruines surplombant le loch" },
        { t: "18:30", d: "🥃 Distillerie Dalwhinnie ou Tomatin — dégustation Highlands" },
        { t: "20:00", d: "🍽️ Dîner au lodge" },
        { t: "22:00", d: "🛁 Hot tub privé sous le ciel clair de minuit — face aux montagnes", green: true },
        { t: "23:00", d: "🎶 Soirée pub musique celtique live (fiddle, accordéon)" }
      ],
      highlights: [
        "💕 Hot tub privé face aux Highlands sous le ciel lumineux de juin = moment magique",
        "🦕 Croisière Loch Ness — garder les yeux ouverts pour Nessie",
        "🍺 Clachaig Inn = pub historique au cœur de Glen Coe, ambiance authentique"
      ]
    },
    {
      day: 6,
      emoji: "🏡",
      label: "St Andrews & retour",
      from: "Highlands",
      to: "Édimbourg",
      dist: "200 km",
      dur: "3h",
      locationId: "edinburgh",
      timeline: [
        { t: "08:30", d: "☕ Dernier petit-déjeuner Highland" },
        { t: "09:30", d: "🚗 Route retour vers Édimbourg via St Andrews" },
        { t: "12:00", d: "🏖️ St Andrews — West Sands Beach (plage Chariots of Fire)" },
        { t: "12:30", d: "🍦 Glace chez Jannettas Gelateria" },
        { t: "13:00", d: "🏛️ Ruines cathédrale St Andrews + balade en bord de mer" },
        { t: "14:30", d: "🚗 Route vers aéroport Édimbourg" },
        { t: "15:30", d: "Restitution voiture de location" },
        { t: "17:00", d: "✈️ Vol retour Édimbourg → Nice", accent: true }
      ],
      highlights: [
        "⛳ St Andrews = berceau du golf, bord de mer charmant",
        "🎬 West Sands Beach = la plage mythique du film Chariots of Fire"
      ]
    }
  ],
  hotels: {
    "the-witchery": {
      name: "The Witchery by the Castle",
      addr: "Castlehill, Royal Mile, Edinburgh EH1 2NF",
      phone: "+44 131 225 5613",
      booking: "thewitchery.com",
      note: "9 suites gothiques, bougies, velours, bain à remous privé. THE adresse romantique d'Édimbourg.",
      checkin: "15:00",
      checkout: "11:00",
      amenities: ["🛁 Bain à remous privé", "🍽️ Restaurant gastronomique", "🏰 Vue château"],
      links: [{ label: "🌐 Site officiel", url: "https://www.thewitchery.com" }]
    },
    "inverlochy-castle": {
      name: "Inverlochy Castle Hotel",
      addr: "Torlundy, Fort William PH33 6SN",
      phone: "+44 1397 702177",
      booking: "inverlochycastlehotel.com",
      note: "Château 5⭐ au pied du Ben Nevis. Restaurant gastronomique, feu de cheminée, jardins victoriens.",
      checkin: "15:00",
      checkout: "11:00",
      amenities: ["🏰 Château historique", "🍽️ Restaurant étoilé", "🌳 Jardins victoriens", "🔥 Feu de cheminée"],
      links: [{ label: "🌐 Site officiel", url: "https://www.inverlochycastlehotel.com" }]
    },
    "skye-hotel": {
      name: "Hôtel de charme — Île de Skye",
      note: "À confirmer. Options : Kinloch Lodge, Skeabost Hotel, ou cottage près de Portree.",
      amenities: ["🌊 Vue mer", "🍽️ Restaurant"]
    },
    "highland-lodge": {
      name: "Lodge avec hot tub privé — Highlands",
      note: "À confirmer. Lodge/cottage isolé avec hot tub face aux montagnes. Options : Loch Ness area.",
      amenities: ["🛁 Hot tub privé", "⛰️ Vue montagnes", "🔥 Cheminée"]
    }
  },
  locations: {
    "edinburgh": { lat: 55.9533, lon: -3.1883, tz: "Europe/London" },
    "fort-william": { lat: 56.8198, lon: -5.1052, tz: "Europe/London" },
    "isle-of-skye": { lat: 57.2736, lon: -6.2155, tz: "Europe/London" },
    "glen-coe": { lat: 56.6823, lon: -5.1024, tz: "Europe/London" }
  },
  restaurants: {
    "1": {
      main: { name: "The Witchery", icon: "🍽️", note: "Dîner aux chandelles, gothique luxueux", price: "£££", rating: 4.7 }
    },
    "4": {
      main: { name: "The Three Chimneys", icon: "🍽️", note: "Menu dégustation ~£85/pers, cottage bord de mer, réservation obligatoire", price: "££££", rating: 4.8, web: "https://www.threechimneys.co.uk" },
      alts: [
        { name: "Dulse & Brose (Portree)", note: "Fruits de mer locaux, plus abordable" },
        { name: "Scorrybreac", note: "Fine dining Portree, vue port" }
      ]
    },
    "5": {
      main: { name: "Clachaig Inn", icon: "🍺", note: "Pub mythique Glen Coe, cuisine hearty, ambiance montagne", price: "££", rating: 4.4 }
    }
  },
  culture: [
    {
      title: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Écosse — Romantisme & traditions",
      sections: [
        { h: "Noces de perle en terres celtes", p: "30 ans de mariage = noces de perle. L'Écosse, terre de légendes, de châteaux et de paysages dramatiques, offre un cadre parfait pour célébrer. La lumière de juin, qui ne s'éteint jamais vraiment (coucher du soleil vers 22h), crée une atmosphère magique unique." },
        { h: "Le whisky — l'eau de vie écossaise", p: "Le scotch whisky est indissociable de l'Écosse. Chaque région a son caractère : les Highlands sont floraux et miellés, Skye (Talisker) est marin et tourbé, les Lowlands sont légers et herbacés. Une dégustation à deux est un rituel incontournable." },
        { h: "Conduite à gauche", p: "On roule à gauche au Royaume-Uni ! Prendre une voiture en boîte automatique pour éviter le stress du changement de main. Les routes des Highlands sont parfois des single-track roads avec des passing places — patience et courtoisie." },
        { h: "Météo fin juin", p: "14-19°C en moyenne. Le temps change vite : soleil, nuages, crachin parfois dans la même heure. Toujours avoir un imperméable léger et des couches. Mais les journées sont magnifiques et très longues (lever 4h30, coucher 22h)." }
      ]
    }
  ],
  lists: {
    "checklist-ecosse": {
      id: "checklist-ecosse",
      type: "packing",
      title: "🧳 Valise Écosse",
      sections: [
        {
          title: "Vêtements",
          items: [
            { id: "v1", text: "Imperméable léger / coupe-vent" },
            { id: "v2", text: "Polaire ou pull chaud" },
            { id: "v3", text: "Chaussures de marche confortables" },
            { id: "v4", text: "Bonnet léger / écharpe (soirées fraîches)" },
            { id: "v5", text: "Tenue dîner élégant (The Witchery, Three Chimneys)" },
            { id: "v6", text: "Couches superposables (météo changeante)" }
          ]
        },
        {
          title: "Documents & pratique",
          items: [
            { id: "d1", text: "Passeport ou CNI (post-Brexit)" },
            { id: "d2", text: "Permis de conduire" },
            { id: "d3", text: "Réservation vol easyJet" },
            { id: "d4", text: "Réservation hôtels" },
            { id: "d5", text: "Réservation Three Chimneys" },
            { id: "d6", text: "Adaptateur prise UK (3 broches)" },
            { id: "d7", text: "Carte bancaire sans frais à l'étranger" }
          ]
        },
        {
          title: "À réserver à l'avance",
          items: [
            { id: "r1", text: "The Witchery — suite (9 suites, très demandé)" },
            { id: "r2", text: "Three Chimneys — dîner (plusieurs semaines à l'avance)" },
            { id: "r3", text: "Jacobite Steam Train (complet rapidement en juin)" },
            { id: "r4", text: "Inverlochy Castle — chambre" },
            { id: "r5", text: "Location voiture boîte auto" },
            { id: "r6", text: "Lodge hot tub Highlands" },
            { id: "r7", text: "Croisière Loch Ness" }
          ]
        }
      ]
    }
  }
};
