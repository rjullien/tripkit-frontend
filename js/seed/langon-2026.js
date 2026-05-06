var SEED_LANGON_2026 = {
  trip: {
    id: "langon-2026",
    name: "Langon — Chez Camille",
    emoji: "🏡",
    startDate: "2026-05-25",
    endDate: "2026-06-03",
    routeUrl: "https://www.google.com/maps/dir/Eyguians,+05300/16+Rue+du+Gaz,+33210+Langon/70+Chemin+du+P%C3%A8re+Goiran,+06330+Roquefort-les-Pins",
    mapImage: "map-overview-v2.jpg",
    travelers: [
      {
        name: "René",
        role: "owner"
      },
      {
        name: "Nicole"
      }
    ],
    phases: [
      {
        name: "Trajet aller",
        days: [0, 0]
      },
      {
        name: "Séjour Langon",
        days: [1, 8]
      },
      {
        name: "Trajet retour",
        days: [9, 9]
      }
    ],
    users: {
      rjullien: {
        city: "Eyguians",
        locationId: "langon",
        defaultConf: "rene"
      }
    }
  },
  days: [
    {
      day: 0,
      emoji: "🚗",
      from: "Eyguians",
      to: "Langon",
      dist: "653 km",
      dur: "~8h30 (VE)",
      label: "Trajet Eyguians → Langon 🔋",
      mapUrl: "https://www.google.com/maps/dir/Eyguians,+05300/16+Rue+du+Gaz,+33210+Langon",
      timeline: [
        {
          t: "08:00",
          d: "🚗 Départ Eyguians (3 Hameaux de Colombes)"
        },
        {
          t: "10:00",
          d: "🔌 Recharge #1 — Montélimar/Orange (~180 km)"
        },
        {
          t: "10:25",
          d: "🚗 Reprise route"
        },
        {
          t: "12:30",
          d: "🔌 Recharge #2 + déjeuner — Montpellier/Narbonne (~380 km)"
        },
        {
          t: "13:15",
          d: "🚗 Reprise route"
        },
        {
          t: "15:00",
          d: "🔌 Recharge #3 si besoin — Toulouse/Agen (~530 km)"
        },
        {
          t: "16:30",
          d: "🏡 Arrivée Langon — 16 Rue du Gaz"
        }
      ],
      highlights: [
        "🔋 VE — 2-3 recharges rapides sur autoroute",
        "📱 Utiliser ABRP pour planifier les arrêts",
        "⚡ Tesla Supercharger V3 (Montélimar → Nîmes → Narbonne)"
      ],
      hotelId: "camille-langon",
      locationId: "langon"
    },
    {
      day: 1,
      emoji: "🏡",
      from: "Langon",
      to: "Langon",
      dist: "0 km",
      dur: "-",
      label: "Balade Saint-Macaire + Garonne",
      mapUrl: "https://www.google.com/maps/dir/Langon/Saint-Macaire,+33490/Langon,+33210",
      timeline: [
        { t: "10:00", d: "☕ Petit-déj tranquille chez Camille" },
        { t: "11:00", d: "🏰 Balade Saint-Macaire — village médiéval fortifié (3 km)" },
        { t: "12:30", d: "🍽️ Déjeuner terrasse bords de Garonne" },
        { t: "14:30", d: "🚶 Promenade le long de la Garonne" },
        { t: "17:00", d: "🏡 Retour chez Camille" }
      ],
      highlights: [
        "🏰 Saint-Macaire : ruelles médiévales, église romane avec fresques",
        "🌊 Bords de Garonne — balade facile et agréable",
        "📍 À 3 km de Langon seulement"
      ],
      hotelId: "camille-langon",
      locationId: "langon"
    },
    {
      day: 2,
      emoji: "🏰",
      from: "Langon",
      to: "Langon",
      dist: "~30 km",
      dur: "-",
      label: "Château Roquetaillade + Vignoble Sauternes",
      mapUrl: "https://www.google.com/maps/dir/Langon/Ch%C3%A2teau+de+Roquetaillade,+Mazères/Sauternes,+33210/Langon,+33210",
      timeline: [
        { t: "10:00", d: "🏰 Visite Château de Roquetaillade (XIIe-XIVe siècle)" },
        { t: "12:00", d: "🍷 Dégustation vignoble de Sauternes" },
        { t: "13:30", d: "🍽️ Déjeuner dans le Sauternais" },
        { t: "15:30", d: "🚶 Balade dans les vignes" },
        { t: "17:30", d: "🏡 Retour chez Camille" }
      ],
      highlights: [
        "🏰 Roquetaillade : 2 châteaux forts, même famille depuis 700 ans",
        "🍷 Sauternes : vins liquoreux d'exception (Guiraud, Filhot)",
        "📍 8-12 km de Langon"
      ],
      hotelId: "camille-langon",
      locationId: "langon"
    },
    {
      day: 3,
      emoji: "🚣",
      from: "Langon",
      to: "Langon",
      dist: "~15 km",
      dur: "-",
      label: "Canoë sur le Ciron",
      mapUrl: "https://www.google.com/maps/dir/Langon/Ciron,+Pr%C3%A9chac,+33730/Langon,+33210",
      timeline: [
        { t: "09:30", d: "🚣 Descente du Ciron en canoë (2-3h, eaux calmes)" },
        { t: "12:30", d: "🍽️ Pique-nique en bord de rivière" },
        { t: "14:30", d: "🏊 Baignade lac de Brouqueyran (si beau temps)" },
        { t: "17:00", d: "🏡 Retour chez Camille" }
      ],
      highlights: [
        "🚣 Ciron : eaux calmes, forêt galerie mystérieuse",
        "🏊 Lac de Brouqueyran : baignade + sentier autour du lac",
        "🌿 Nature préservée, ambiance enchantée"
      ],
      hotelId: "camille-langon",
      locationId: "langon"
    },
    {
      day: 4,
      emoji: "⛪",
      from: "Langon",
      to: "Langon",
      dist: "~25 km",
      dur: "-",
      label: "Cité médiévale de Bazas",
      mapUrl: "https://www.google.com/maps/dir/Langon/Bazas,+33430/Langon,+33210",
      timeline: [
        { t: "10:00", d: "⛪ Visite Bazas — cathédrale gothique UNESCO" },
        { t: "11:30", d: "🚶 Place à arcades, ruelles médiévales" },
        { t: "12:30", d: "🥩 Déjeuner — bœuf de Bazas (spécialité locale !)" },
        { t: "14:30", d: "🛒 Boucheries artisanales, produits locaux" },
        { t: "16:00", d: "🏡 Retour chez Camille" }
      ],
      highlights: [
        "⛪ Cathédrale de Bazas — gothique, classée UNESCO",
        "🥩 Bœuf de Bazas — race locale d'exception",
        "🏛️ Place à arcades, ambiance médiévale"
      ],
      hotelId: "camille-langon",
      locationId: "langon"
    },
    {
      day: 5,
      emoji: "🛒",
      from: "Langon",
      to: "Langon",
      dist: "0 km",
      dur: "-",
      label: "Marché de Langon + Lac",
      mapUrl: "https://www.google.com/maps/dir/Langon/Lac+de+Langon,+33210/Langon,+33210",
      timeline: [
        { t: "08:30", d: "🛒 Marché de Langon (vendredi matin !)" },
        { t: "11:00", d: "☕ Café en terrasse, centre-ville" },
        { t: "12:30", d: "🍽️ Déjeuner produits du marché chez Camille" },
        { t: "15:00", d: "🏊 Lac de Brouqueyran — détente, balade" },
        { t: "17:30", d: "🏡 Retour" }
      ],
      highlights: [
        "🛒 Marché vendredi matin : canard, fromage, fruits",
        "🏊 Lac de Brouqueyran pour l'après-midi",
        "🍳 Cuisiner les produits du marché"
      ],
      hotelId: "camille-langon",
      locationId: "langon"
    },
    {
      day: 6,
      emoji: "🚴",
      from: "Langon",
      to: "Langon",
      dist: "~40 km",
      dur: "-",
      label: "Vélo piste Roger Lapébie ou Verdelais",
      mapUrl: "https://www.google.com/maps/dir/Langon/Piste+Roger+Lap%C3%A9bie,+Cr%C3%A9on/Verdelais,+33490/Langon,+33210",
      timeline: [
        { t: "09:30", d: "🚴 Piste cyclable Roger Lapébie (ancienne voie ferrée, ombragée)" },
        { t: "12:00", d: "🍽️ Déjeuner en route" },
        { t: "14:00", d: "⛪ Verdelais — basilique + panorama vallée" },
        { t: "16:00", d: "🍷 Petit domaine viticole sur le retour" },
        { t: "17:30", d: "🏡 Retour chez Camille" }
      ],
      highlights: [
        "🚴 Piste Lapébie : facile, ombragée, ancienne voie ferrée",
        "⛪ Verdelais : basilique, chemin de croix, vue magnifique",
        "🍷 Dégustation sur le retour"
      ],
      hotelId: "camille-langon",
      locationId: "langon"
    },
    {
      day: 7,
      emoji: "🌊",
      from: "Langon",
      to: "Langon",
      dist: "~150 km AR",
      dur: "-",
      label: "Journée Bordeaux ou Arcachon/Dune du Pilat",
      mapUrl: "https://www.google.com/maps/dir/Langon/Bordeaux/Dune+du+Pilat,+La+Teste-de-Buch/Langon,+33210",
      timeline: [
        { t: "09:00", d: "🚗 Départ pour Bordeaux (45 min) ou Arcachon (1h15)" },
        { t: "10:30", d: "🏛️ Option A : Bordeaux — miroir d'eau, Cité du Vin, centre historique" },
        { t: "10:30", d: "🏖️ Option B : Arcachon — Dune du Pilat, huîtres, plage" },
        { t: "12:30", d: "🍽️ Déjeuner sur place" },
        { t: "15:00", d: "🚶 Suite de la visite" },
        { t: "18:00", d: "🏡 Retour chez Camille" }
      ],
      highlights: [
        "🏛️ Bordeaux : 45 min, miroir d'eau, Cité du Vin",
        "🏖️ Arcachon : Dune du Pilat (107 m !), huîtres fraîches",
        "💡 Choisir selon la météo (plage si soleil !)"
      ],
      hotelId: "camille-langon",
      locationId: "langon"
    },
    {
      day: 8,
      emoji: "🍫",
      from: "Langon",
      to: "Langon",
      dist: "~140 km AR",
      dur: "~2h30 route",
      label: "Chocolaterie Duras + Saint-Émilion",
      mapUrl: "https://www.google.com/maps/dir/16+Rue+du+Gaz,+33210+Langon/163+Rue+des+Cavales,+47120+Duras/Saint-%C3%89milion,+33330/16+Rue+du+Gaz,+33210+Langon",
      timeline: [
        { t: "09:00", d: "🚗 Départ Langon → Duras (50 min, direction nord-est)" },
        { t: "09:50", d: "🍫 Maison Guinguet — chocolaterie artisanale (pruneaux, chocolats maison). 163 Rue des Cavales, Duras. Ouvert lun-ven 9h-12h30/14h-18h30. Tél: 05 53 83 72 47" },
        { t: "10:45", d: "🚗 Duras → Saint-Émilion (25 min)" },
        { t: "11:15", d: "🍷 Saint-Émilion — village UNESCO, ruelles pavées, tour du Roy, église monolithe souterraine" },
        { t: "12:30", d: "🍽️ Déjeuner à Saint-Émilion (terrasse place de l'Église)" },
        { t: "14:00", d: "🍷 Dégustation dans un domaine viticole (Saint-Émilion Grand Cru)" },
        { t: "15:30", d: "🚗 Retour Saint-Émilion → Langon (40 min)" },
        { t: "16:30", d: "🧳 Début des valises (retour demain !)" },
        { t: "19:00", d: "🍽️ Dernier dîner avec Camille" }
      ],
      highlights: [
        "🍫 Maison Guinguet : chocolaterie artisanale + pruneaux d'Agen (spécialité depuis 1991)",
        "🍷 Saint-Émilion : village viticole UNESCO, souterrains, dégustations Grand Cru",
        "🧳 Préparer le retour (747 km demain !)"
      ],
      hotelId: "camille-langon",
      locationId: "langon"
    },
    {
      day: 9,
      emoji: "🚗",
      from: "Langon",
      to: "Roquefort-les-Pins",
      dist: "747 km",
      dur: "~9h-9h30 (VE)",
      label: "Retour Langon → Roquefort-les-Pins 🔋",
      mapUrl: "https://www.google.com/maps/dir/16+Rue+du+Gaz,+33210+Langon/70+Chemin+du+P%C3%A8re+Goiran,+06330+Roquefort-les-Pins",
      timeline: [
        {
          t: "07:30",
          d: "🚗 Départ Langon"
        },
        {
          t: "09:30",
          d: "🔌 Recharge #1 — Narbonne/Béziers (~200 km)"
        },
        {
          t: "10:00",
          d: "🚗 Reprise"
        },
        {
          t: "12:00",
          d: "🔌 Recharge #2 + déjeuner — Montpellier/Nîmes (~380 km)"
        },
        {
          t: "12:45",
          d: "🚗 Reprise"
        },
        {
          t: "14:30",
          d: "🔌 Recharge #3 — Aix-en-Provence (~580 km)"
        },
        {
          t: "15:00",
          d: "🚗 Reprise"
        },
        {
          t: "17:00",
          d: "🏠 Arrivée Roquefort — 70 Ch. du Père Goiran"
        }
      ],
      highlights: [
        "🔋 VE — 2-3 recharges rapides sur autoroute",
        "📱 Utiliser ABRP pour planifier les arrêts",
        "⚡ Tesla Supercharger V3 (Narbonne → Nîmes → Aix-en-Provence)",
        "⚠️ Long trajet — partir tôt !"
      ],
      hotelId: "maison-roquefort",
      locationId: "roquefort"
    }
  ],
  hotels: {
    "camille-langon": {
      name: "Chez Camille",
      city: "Langon",
      address: "16 Rue du Gaz, 33210 Langon",
      emoji: "🏡",
      type: "family",
      mapsUrl: "https://www.google.com/maps/search/16+Rue+du+Gaz,+33210+Langon"
    },
    "maison-roquefort": {
      name: "Maison Roquefort",
      city: "Roquefort-les-Pins",
      address: "70 Chemin du Père Goiran, 06330 Roquefort-les-Pins",
      emoji: "🏠",
      type: "home",
      mapsUrl: "https://www.google.com/maps/search/70+Chemin+du+Pere+Goiran,+06330+Roquefort-les-Pins"
    }
  },
  culture: [
    {
      title: "🍷 Le Sauternais — L'or liquide du Bordelais",
      sub: "Sauternes, Barsac, Château d'Yquem • Autour de Langon",
      sections: [
        {
          h: "Le miracle de la pourriture noble",
          p: "Le Sauternes est un accident géographique. Le Ciron, petite rivière froide, se jette dans la Garonne tiède à Barsac. Chaque automne, cette rencontre génère des brouillards matinaux qui font développer le Botrytis cinerea sur les raisins — un champignon qui concentre les sucres au lieu de détruire. Sans ce microclimat unique, pas de Sauternes."
        },
        {
          h: "Château d'Yquem — Le vin le plus cher du monde",
          p: "Premier Cru Supérieur depuis 1855, seul à porter ce titre. Un verre de récolte peut coûter des milliers d'euros. La vendange dure 6 semaines minimum : les vendangeurs passent grain par grain, parfois 10 passages. En année mauvaise, Yquem déclasse toute la récolte — zéro bouteille produite (1964, 1972, 1974). Thomas Jefferson en était déjà fan en 1787."
        },
        {
          h: "Le classement de 1855 — Figé dans le marbre",
          p: "Napoélon III demande un classement pour l'Exposition Universelle. Les courtiers classent les châteaux par prix moyen sur 100 ans. Résultat : un classement qui n'a quasiment pas bougé en 170 ans (1 seule modification : Mouton Rothschild en 1973). Le Sauternais y figure avec ses propres Crus Classés."
        }
      ]
    },
    {
      title: "🏰 Les Bastides — Villes neuves du Moyen Âge",
      sub: "Langon, Bazas, Créon, Sauveterre • XIIIè-XIVe siècle",
      sections: [
        {
          h: "Les bastides — Les \"startups\" médiévales",
          p: "Entre 1250 et 1350, rois de France et d'Angleterre fondent plus de 300 'villes neuves' dans le Sud-Ouest. Plan en damier autour d'une place à arcades, charte de libertés pour attirer les colons. C'était du marketing territorial médiéval : qui offrait les meilleures franchises gagnait la population."
        },
        {
          h: "Bazas — La cathédrale et le bœuf",
          p: "Cathédrale Saint-Jean-Baptiste (XIIIe, UNESCO via les chemins de Compostelle). Sa façade gothique rivalise avec Notre-Dame. Mais Bazas est aussi célèbre pour son bœuf de Bazas — race rustique élevée en plein air, viande marbrée persillée. Chaque jeudi de Carnaval : la Fête du Bœuf Gras depuis le XIIIe siècle."
        },
        {
          h: "La Guerre de Cent Ans ici",
          p: "Langon était en première ligne. La région a changé de mains entre Anglais et Français des dizaines de fois. L'Aquitaine était anglaise depuis le mariage d'Éléonore (1152). Les bastides étaient des postes avancés militaires autant qu'économiques. La bataille de Castillon (1453), à 60 km d'ici, met fin à la présence anglaise en France."
        }
      ]
    },
    {
      title: "🌾 La Garonne — Fleuve nourricier",
      sub: "Commerce, inondations, batellerie • Langon sur Garonne",
      sections: [
        {
          h: "Langon, port fluvial oublié",
          p: "Avant le chemin de fer, Langon était un port majeur de la Garonne. Les vins de Sauternes et du Bazadais partaient en gabarre jusqu'à Bordeaux puis vers l'Angleterre. Le pont de pierre de Langon (1842) a tué le commerce fluvial en rendant la navigation difficile en amont."
        },
        {
          h: "Les crues mémorables",
          p: "La Garonne en crue, c'est terrifiant. Juin 1875 : la plus grande inondation de l'histoire (10m au-dessus du niveau normal à Toulouse, 500 morts). Langon est régulièrement inondée — les marques de crues sur les vieux bâtiments témoignent encore. La dernière grosse crue : février 2021."
        },
        {
          h: "Le canal latéral à la Garonne",
          p: "Construit entre 1838 et 1856, il relie Toulouse à Castets-en-Dorthe (près de Langon) sur 193 km. Il prolonge le Canal du Midi et permet une voie navigable continue de l'Atlantique à la Méditerranée. Aujourd'hui utilisé principalement pour le tourisme fluvial."
        }
      ]
    },
    {
      title: "🍽️ Gastronomie du Sud-Ouest",
      sub: "Foie gras, canard, pruneaux, cannelés • Terroir Gironde",
      sections: [
        {
          h: "Le canard — Roi du Sud-Ouest",
          p: "Magret, confit, foie gras, gésiers, gratons... le canard est à cette région ce que le porc est à l'Alsace : TOUT se mange. Le magret est une invention récente (1959, André Daguin à Auch). Avant, le filet de canard gras était considéré comme un sous-produit du foie gras."
        },
        {
          h: "Le cannelé bordelais — Le mystère des origines",
          p: "Personne ne sait vraiment d'où il vient. Théorie la plus romantique : les religieuses du couvent des Annonciades récupéraient les jaunes d'œufs (les blancs servaient à coller le vin). Moule en cuivre, croûte caramélisée, intérieur moelleux au rhum et vanille. Le vrai cannelé a exactement 8 cannèles (rainures)."
        },
        {
          h: "Agen et ses pruneaux — à 40 km",
          p: "Les moines de Clérac ont ramené le prunier d'Ente de Syrie au XIIe siècle (des croisades). Le climat du Lot-et-Garonne est idéal. Au XIXe : 18 000 tonnes exportées par an. Aujourd'hui le pruneau d'Agen a une IGP, mais 50% de la production est transformée (à l'Armagnac, fourrés, en chocolat)."
        }
      ]
    }
  ],
  lists: [],
  restaurants: []
};
