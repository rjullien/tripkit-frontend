var SEED_LANGON_2026 = {
  trip: {
    id: "langon-2026",
    name: "Langon — Chez Camille",
    emoji: "🏡",
    startDate: "2026-05-25",
    endDate: "2026-06-01",
    routeUrl: "https://www.google.com/maps/dir/Eyguians,+05300/Nyons,+26110/Montpellier,+34000/16+Rue+du+Gaz,+33210+Langon/70+Chemin+du+P%C3%A8re+Goiran,+06330+Roquefort-les-Pins",
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
        days: [1, 6]
      },
      {
        name: "Trajet retour",
        days: [7, 7]
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
      dist: "~700 km",
      dur: "~9h (VE, 2 options de recharge)",
      label: "Trajet Eyguians → Nyons → Langon 🔋",
      mapUrl: "https://www.google.com/maps/dir/Eyguians,+05300/Nyons,+26110/16+Rue+du+Gaz,+33210+Langon",
      timeline: [
        { t: "09:00", d: "🚗 Départ Eyguians (3 Hameaux de Colombes)" },
        { t: "10:18", d: "☕ Petit déjeuner — Café de la Bourse, 5 Place du Dr Bourdongle, Nyons (terrasse sous les arcades, 45 min)" },
        { t: "11:03", d: "🚗 Reprise — CHOISIR OPTION A ou B ci-dessous" },
        { t: "", d: "" },
        { t: "", d: "━━━ OPTION A : Montpellier (arrivée 17h56) ━━━" },
        { t: "11:03", d: "🚗 Nyons → Montpellier Odysseum (1h43)" },
        { t: "12:46", d: "⚡ Supercharger Odysseum — Parking de la Mer, 30 bornes 250kW" },
        { t: "12:46", d: "🍽️ Déjeuner (1h15) : Brasserie Gusto (italien, 15-23€) | Black & White Burger (12-18€) | Under the Sea by Ephemera (immersif, 15-23€)" },
        { t: "14:01", d: "🚗 Montpellier → Langon (A9 → A61 → A62)" },
        { t: "15:31", d: "🔌 Recharge Castelnaudary (30 min)" },
        { t: "16:01", d: "🚗 Reprise" },
        { t: "17:21", d: "🔌 Recharge flash Agen (5 min)" },
        { t: "17:56", d: "🏡 Arrivée Langon — 16 Rue du Gaz" },
        { t: "", d: "" },
        { t: "", d: "━━━ OPTION B : Béziers (arrivée 18:36) ━━━" },
        { t: "11:03", d: "🚗 Nyons → Béziers Villeneuve-lès-Béziers (2h17)" },
        { t: "13:20", d: "⚡ Supercharger Béziers — Av. Jean Monnet, parking Decathlon, 24 bornes 250kW" },
        { t: "13:20", d: "🍽️ Déjeuner (1h15) : La Fermette (trad, 10-20€, ⭐4.2) | Brasserie La Méridienne (dans concession Jeep!, ⭐4.6) | La Pause Méridienne (snacking Decathlon, rapide)" },
        { t: "14:35", d: "🚗 Béziers → Langon (A9 → A61 → A62)" },
        { t: "16:01", d: "🔌 Recharge Castelnaudary (30 min)" },
        { t: "16:31", d: "🚗 Reprise" },
        { t: "17:56", d: "🔌 Recharge flash Agen (5 min)" },
        { t: "18:36", d: "🏡 Arrivée Langon — 16 Rue du Gaz" }
      ],
      highlights: [
        "☕ Petit déj commun : Café de la Bourse, Nyons — terrasse provençale (45 min)",
        "🅰️ Option A (Montpellier) : arrivée 17h56 — Supercharger Odysseum + Brasserie Gusto / Black & White Burger / Under the Sea",
        "🅱️ Option B (Béziers) : arrivée 18h36 — Supercharger Decathlon + La Fermette / La Méridienne / La Pause Méridienne",
        "📱 Utiliser ABRP pour planifier les arrêts"
      ],
      hotelId: "camille-langon",
      locationId: "langon"
    },
    {
      day: 1,
      emoji: "🔨",
      from: "Langon",
      to: "Langon",
      dist: "0 km",
      dur: "-",
      label: "Bricolage maison Camille",
      mapUrl: "https://www.google.com/maps/search/16+Rue+du+Gaz,+33210+Langon",
      timeline: [
        { t: "09:00", d: "☕ Petit-déj tranquille chez Camille" },
        { t: "10:00", d: "🔨 Bricolage maison — travaux avec Camille" },
        { t: "12:30", d: "🍽️ Déjeuner chez Camille" },
        { t: "14:00", d: "🔨 Suite bricolage" },
        { t: "17:00", d: "🏡 Fin de journée tranquille" }
      ],
      highlights: [
        "🔨 Journée bricolage et travaux chez Camille",
        "🛒 Possible passage en magasin bricolage si besoin",
        "🏡 Installation tranquille"
      ],
      hotelId: "camille-langon",
      locationId: "langon"
    },
    {
      day: 2,
      emoji: "🍫",
      from: "Langon",
      to: "Langon",
      dist: "~140 km AR",
      dur: "~2h30 route",
      label: "Chocolaterie Duras + Saint-Émilion",
      mapUrl: "https://www.google.com/maps/dir/16+Rue+du+Gaz,+33210+Langon/163+Rue+des+Cavales,+47120+Duras/Saint-%C3%89milion,+33330/16+Rue+du+Gaz,+33210+Langon",
      timeline: [
        { t: "09:00", d: "🚗 Départ Langon → Duras (50 min, direction nord-est)" },
        { t: "09:50", d: "🍫 Maison Guinguet — chocolaterie artisanale (pruneaux, chocolats maison). 163 Rue des Cavales, Duras. Ouvert lun-sam 9h-12h30/14h-18h30. Tél: 05 53 83 72 47" },
        { t: "10:45", d: "🚗 Duras → Saint-Émilion (25 min)" },
        { t: "11:15", d: "🍷 Saint-Émilion — village UNESCO, ruelles pavées, tour du Roy, église monolithe souterraine" },
        { t: "12:30", d: "🍽️ Déjeuner à Saint-Émilion (terrasse place de l'Église)" },
        { t: "14:00", d: "🍷 Dégustation dans un domaine viticole (Saint-Émilion Grand Cru)" },
        { t: "15:30", d: "🚗 Retour Saint-Émilion → Langon (40 min)" },
        { t: "16:30", d: "🏡 Retour chez Camille" }
      ],
      highlights: [
        "🍫 Maison Guinguet : chocolaterie artisanale + pruneaux d'Agen (spécialité depuis 1991)",
        "🍷 Saint-Émilion : village viticole UNESCO, souterrains, dégustations Grand Cru",
        "📍 Fermé dimanche — mercredi parfait !"
      ],
      hotelId: "camille-langon",
      locationId: "langon"
    },
    {
      day: 3,
      emoji: "🏖️",
      from: "Langon",
      to: "Mimizan Plage",
      dist: "~200 km AR",
      dur: "-",
      label: "Roquetaillade + Sauternes + Mimizan Plage 🌊",
      mapUrl: "https://www.google.com/maps/dir/16+Rue+du+Gaz,+33210+Langon/Ch%C3%A2teau+de+Roquetaillade,+Maz%C3%A8res/Sauternes,+33210/Mimizan+Plage,+40200/16+Rue+du+Gaz,+33210+Langon",
      timeline: [
        { t: "08:30", d: "☕ Petit-déj" },
        { t: "09:00", d: "🏰 Visite Château de Roquetaillade (XIIe-XIVe siècle, 15 min de Langon)" },
        { t: "10:30", d: "🍷 Dégustation Sauternes (Château Guiraud ou Filhot)" },
        { t: "11:30", d: "🚗 Route vers Mimizan Plage (1h30)" },
        { t: "13:00", d: "🍽️ Déjeuner — A Noste (bar-restaurant sur la dune, vue panoramique océan)" },
        { t: "14:30", d: "🏖️ Plage ! Baignade, farniente, surf, paddle" },
        { t: "17:30", d: "🚗 Retour Mimizan → Langon (1h30)" },
        { t: "19:00", d: "🏡 Retour chez Camille" }
      ],
      highlights: [
        "🏰 Roquetaillade : 2 châteaux forts, même famille depuis 700 ans (15 min de Langon)",
        "🍷 Sauternes : dégustation matin — vins liquoreux d’exception",
        "🏖️ Mimizan Plage — 7 plages de sable fin, océan Atlantique",
        "🍽️ A Noste — restaurant panoramique sur la dune",
        "🚗 1h30 Sauternes → Mimizan"
      ],
      hotelId: "camille-langon",
      locationId: "langon"
    },
    {
      day: 4,
      emoji: "🛒",
      from: "Langon",
      to: "Langon",
      dist: "~40 km",
      dur: "-",
      label: "Marché de Langon + Vélo piste Lapébie",
      mapUrl: "https://www.google.com/maps/dir/Langon/Piste+Roger+Lap%C3%A9bie,+Cr%C3%A9on/Verdelais,+33490/Langon,+33210",
      timeline: [
        { t: "08:30", d: "🛒 Marché de Langon (vendredi matin !)" },
        { t: "11:00", d: "☕ Café en terrasse, centre-ville" },
        { t: "12:00", d: "🍽️ Déjeuner produits du marché chez Camille" },
        { t: "14:00", d: "🚴 Piste cyclable Roger Lapébie (ancienne voie ferrée, ombragée)" },
        { t: "16:00", d: "⛪ Verdelais — basilique + panorama vallée" },
        { t: "17:30", d: "🏡 Retour chez Camille" }
      ],
      highlights: [
        "🛒 Marché vendredi matin : canard, fromage, fruits",
        "🚴 Piste Lapébie : facile, ombragée, ancienne voie ferrée",
        "⛪ Verdelais : basilique, chemin de croix, vue magnifique"
      ],
      hotelId: "camille-langon",
      locationId: "langon"
    },
    {
      day: 5,
      emoji: "😌",
      from: "Langon",
      to: "Langon",
      dist: "~10 km",
      dur: "-",
      label: "Jour tranquille — repos & Garonne",
      mapUrl: "https://www.google.com/maps/dir/16+Rue+du+Gaz,+33210+Langon/Garonne+Langon",
      timeline: [
        { t: "09:30", d: "☕ Grasse matinée + petit-déj tranquille" },
        { t: "10:30", d: "🚶 Promenade le long de la Garonne" },
        { t: "12:30", d: "🍽️ Déjeuner terrasse bords de Garonne" },
        { t: "14:30", d: "🏊 Baignade / détente au choix" },
        { t: "17:00", d: "🏡 Retour chez Camille" },
        { t: "19:00", d: "🍽️ Dîner tranquille — dernière soirée avant Bordeaux" }
      ],
      highlights: [
        "😌 Journée repos avant Bordeaux demain",
        "🌊 Bords de Garonne — balade facile",
        "🍽️ Déjeuner terrasse au soleil"
      ],
      hotelId: "camille-langon",
      locationId: "langon"
    },
    {
      day: 6,
      emoji: "🏛️",
      from: "Langon",
      to: "Langon",
      dist: "~90 km AR",
      dur: "-",
      label: "Bordeaux — voir Babeth",
      mapUrl: "https://www.google.com/maps/dir/Langon/Bordeaux/Langon,+33210",
      timeline: [
        { t: "09:30", d: "🚗 Départ Langon → Bordeaux (45 min)" },
        { t: "10:15", d: "🏛️ Bordeaux — miroir d'eau, centre historique, quais" },
        { t: "12:30", d: "🍽️ Déjeuner avec Babeth" },
        { t: "14:30", d: "🚶 Balade Bordeaux (Cité du Vin, Darwin, Chartrons…)" },
        { t: "17:00", d: "🚗 Retour Langon" },
        { t: "17:45", d: "🧳 Début des valises (retour demain !)" },
        { t: "19:00", d: "🍽️ Dernier dîner avec Camille" }
      ],
      highlights: [
        "👩 Voir Babeth !",
        "🏛️ Bordeaux : miroir d'eau, quais, centre UNESCO",
        "🧳 Préparer le retour (747 km demain !)"
      ],
      hotelId: "camille-langon",
      locationId: "langon"
    },
    {
      day: 7,
      emoji: "🚗",
      from: "Langon",
      to: "Roquefort-les-Pins",
      dist: "747 km",
      dur: "~9h-9h30 (VE)",
      label: "Retour Langon → Roquefort-les-Pins 🔋",
      mapUrl: "https://www.google.com/maps/dir/16+Rue+du+Gaz,+33210+Langon/70+Chemin+du+P%C3%A8re+Goiran,+06330+Roquefort-les-Pins",
      timeline: [
        { t: "07:30", d: "🚗 Départ Langon" },
        { t: "09:30", d: "🔌 Recharge #1 — Narbonne/Béziers (~200 km)" },
        { t: "10:00", d: "🚗 Reprise" },
        { t: "12:00", d: "🔌 Recharge #2 + déjeuner — Montpellier/Nîmes (~380 km)" },
        { t: "12:45", d: "🚗 Reprise" },
        { t: "14:30", d: "🔌 Recharge #3 — Aix-en-Provence (~580 km)" },
        { t: "15:00", d: "🚗 Reprise" },
        { t: "17:00", d: "🏠 Arrivée Roquefort — 70 Ch. du Père Goiran" }
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
