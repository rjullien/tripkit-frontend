var SEED_CANADA_2026 = {
  trip: {
    id: "canada-2026",
    name: "Canada Maritimes 2026",
    emoji: "🍁",
    startDate: "2026-08-14",
    endDate: "2026-09-05",
    mapImage: "map-overview.png",
    routeUrl: "https://www.google.com/maps/dir/Montr%C3%A9al,+QC/Qu%C3%A9bec,+QC/Tadoussac,+QC/Rimouski,+QC/Sainte-Anne-des-Monts,+QC/Perc%C3%A9,+QC/Parc+national+Forillon,+QC/Campbellton,+NB/Hopewell+Cape,+NB/Charlottetown,+PE/Halifax,+NS/Baddeck,+NS/Moncton,+NB/Rivi%C3%A8re-du-Loup,+QC/Montr%C3%A9al,+QC",
    travelers: [
      { name: "René", role: "owner" },
      { name: "Nicole" },
      { name: "Baptiste" }
    ],
    phases: [
      { name: "Vol + Montréal", days: [0, 1] },
      { name: "Québec & Tadoussac", days: [2, 4] },
      { name: "Gaspésie", days: [5, 9] },
      { name: "Nouveau-Brunswick & Fundy", days: [10, 12] },
      { name: "PEI & Nouvelle-Écosse", days: [13, 17] },
      { name: "Retour", days: [18, 21] }
    ],
    users: {
      rjullien: {
        city: "Nice",
        locationId: "montreal",
        defaultConf: "rene"
      }
    }
  },
  days: [
    {
      day: 0,
      emoji: "✈️",
      from: "Nice",
      to: "Montréal",
      dist: "Vol",
      dur: "~9h",
      label: "Vol Nice → Montréal",
      timeline: [
        { t: "🌅", d: "✈️ Vol Nice → Montréal" },
        { t: "PM", d: "🏠 Arrivée, installation" }
      ],
      highlights: ["✈️ Vol direct ou escale", "🇨🇦 Bienvenue au Canada !"],
      hotelId: "montreal",
      locationId: "montreal"
    },
    {
      day: 1,
      emoji: "🏙️",
      from: "Montréal",
      to: "Montréal",
      dist: "0 km",
      dur: "-",
      label: "Montréal — Préparation",
      timeline: [
        { t: "10:00", d: "🚗 Location voiture" },
        { t: "11:30", d: "🛒 Courses (IGA, Costco)" },
        { t: "14:00", d: "🏙️ Retrouvailles Baptiste + Emma" },
        { t: "18:00", d: "🍽️ Dîner Montréal" }
      ],
      highlights: [
        "🚗 Récupérer le SUV",
        "🛒 Courses route (snacks, eau, glacière)",
        "👨‍👩‍👦 Retrouvailles avec Baptiste & Emma"
      ],
      hotelId: "montreal",
      locationId: "montreal"
    },
    {
      day: 2,
      emoji: "🏰",
      from: "Montréal",
      to: "Québec City",
      dist: "250 km",
      dur: "2h45",
      label: "Montréal → Québec City",
      mapUrl: "https://www.google.com/maps/dir/Montreal/Quebec+City",
      timeline: [
        { t: "09:00", d: "🚗 Départ Montréal → Québec" },
        { t: "12:00", d: "🏰 Arrivée Québec — Vieux-Québec" },
        { t: "13:00", d: "🍽️ Déjeuner Vieux-Québec" },
        { t: "15:00", d: "🚶 Château Frontenac, terrasse Dufferin" },
        { t: "18:00", d: "🍽️ Dîner quartier Petit-Champlain" }
      ],
      highlights: [
        "🏰 Vieux-Québec — joyau UNESCO",
        "📸 Château Frontenac iconique",
        "🇫🇷 Seule ville fortifiée d'Amérique du Nord"
      ],
      hotelId: "quebec-city",
      locationId: "quebec-city"
    },
    {
      day: 3,
      emoji: "🏝️",
      from: "Québec City",
      to: "Québec City",
      dist: "80 km",
      dur: "-",
      label: "Île d'Orléans + Chutes Montmorency",
      timeline: [
        { t: "09:30", d: "🏝️ Île d'Orléans — tour de l'île, producteurs locaux" },
        { t: "12:00", d: "🍽️ Déjeuner sur l'île (cidre, fromage, fraises)" },
        { t: "14:30", d: "💧 Chutes Montmorency (83 m, plus hautes que Niagara !)" },
        { t: "16:30", d: "🚶 Retour Québec, balade libre" }
      ],
      highlights: [
        "🏝️ Île d'Orléans — le jardin de Québec",
        "💧 Chutes Montmorency — 83 m (30 m > Niagara !)",
        "🧀 Producteurs : cidre, fromage, fraises"
      ],
      hotelId: "quebec-city",
      locationId: "quebec-city"
    },
    {
      day: 4,
      emoji: "🐋",
      from: "Québec City",
      to: "Tadoussac",
      dist: "220 km",
      dur: "2h45",
      label: "Québec → Tadoussac — BALEINES !",
      mapUrl: "https://www.google.com/maps/dir/Quebec+City/Tadoussac",
      timeline: [
        { t: "08:30", d: "🚗 Départ → Tadoussac (route 138 panoramique)" },
        { t: "11:30", d: "🏠 Arrivée Tadoussac" },
        { t: "13:00", d: "🐋 Croisière baleines (zodiac ou bateau)" },
        { t: "16:00", d: "☕ Village de Tadoussac, fjord du Saguenay" },
        { t: "18:30", d: "🍽️ Dîner fruits de mer" }
      ],
      highlights: [
        "🐋 Baleines ! Bélugas + baleines à bosse + rorquals",
        "🌊 Fjord du Saguenay — spectaculaire",
        "⚠️ RÉSERVER la croisière baleines à l'avance"
      ],
      hotelId: "tadoussac",
      locationId: "tadoussac"
    },
    {
      day: 5,
      emoji: "🌊",
      from: "Tadoussac",
      to: "Rimouski",
      dist: "300 km",
      dur: "3h30",
      label: "Tadoussac → Rimouski",
      mapUrl: "https://www.google.com/maps/dir/Tadoussac/Rimouski",
      timeline: [
        { t: "09:00", d: "🚗 Départ côte du Saint-Laurent" },
        { t: "10:30", d: "📸 Arrêts phares + points de vue" },
        { t: "12:30", d: "🍽️ Déjeuner en route" },
        { t: "14:30", d: "🏠 Arrivée Rimouski" },
        { t: "16:00", d: "🚶 Bord de mer, centre-ville" }
      ],
      highlights: [
        "🗼 Phares du Saint-Laurent (Pointe-au-Père)",
        "🌊 Fleuve immense — on ne voit pas l'autre rive !",
        "📸 Route panoramique côtière"
      ],
      hotelId: "rimouski",
      locationId: "rimouski"
    },
    {
      day: 6,
      emoji: "⛰️",
      from: "Rimouski",
      to: "Sainte-Anne-des-Monts",
      dist: "230 km",
      dur: "2h45",
      label: "Rimouski → Entrée Gaspésie",
      mapUrl: "https://www.google.com/maps/dir/Rimouski/Sainte-Anne-des-Monts",
      timeline: [
        { t: "09:00", d: "🚗 Départ vers la Gaspésie" },
        { t: "11:30", d: "⛰️ Parc de la Gaspésie — Chic-Chocs" },
        { t: "12:30", d: "🍽️ Déjeuner" },
        { t: "14:00", d: "🥾 Randonnée (Mont Albert ou sentier plus court)" },
        { t: "17:00", d: "🏠 Installation Sainte-Anne-des-Monts" }
      ],
      highlights: [
        "⛰️ Parc de la Gaspésie — montagnes Chic-Chocs",
        "🦌 Caribous, orignaux possibles",
        "🌲 Entrée dans la vraie Gaspésie sauvage"
      ],
      hotelId: "ste-anne",
      locationId: "ste-anne"
    },
    {
      day: 7,
      emoji: "🏖️",
      from: "Sainte-Anne-des-Monts",
      to: "Percé",
      dist: "250 km",
      dur: "3h",
      label: "Route côtière → Percé",
      mapUrl: "https://www.google.com/maps/dir/Sainte-Anne-des-Monts/Perce",
      timeline: [
        { t: "09:00", d: "🚗 Route côtière gaspésienne (132)" },
        { t: "10:30", d: "📸 Arrêts villages de pêcheurs, phares" },
        { t: "12:30", d: "🍽️ Déjeuner poissonnerie locale" },
        { t: "15:00", d: "🪨 Arrivée Percé — premier aperçu du Rocher !" },
        { t: "18:00", d: "🍽️ Dîner face au Rocher Percé" }
      ],
      highlights: [
        "🪨 Premier aperçu du Rocher Percé !",
        "🏖️ Route côtière spectaculaire",
        "🐟 Villages de pêcheurs authentiques"
      ],
      hotelId: "perce",
      locationId: "perce"
    },
    {
      day: 8,
      emoji: "🪨",
      from: "Percé",
      to: "Percé",
      dist: "0 km",
      dur: "-",
      label: "Percé — Rocher + Île Bonaventure",
      timeline: [
        { t: "08:30", d: "🚢 Bateau → Île Bonaventure" },
        { t: "09:30", d: "🐦 Colonie de fous de Bassan (110 000 oiseaux !)" },
        { t: "12:00", d: "🚶 Sentier tour de l'île" },
        { t: "13:30", d: "🚢 Retour continent" },
        { t: "15:00", d: "🪨 Géoparc, marche vers le Rocher à marée basse" },
        { t: "19:00", d: "🍽️ Homard frais !" }
      ],
      highlights: [
        "🐦 Île Bonaventure — 110 000 fous de Bassan !",
        "🪨 Rocher Percé — icône de la Gaspésie",
        "🦞 HOMARD obligatoire ce soir"
      ],
      hotelId: "perce",
      locationId: "perce"
    },
    {
      day: 9,
      emoji: "🌊",
      from: "Percé",
      to: "Forillon",
      dist: "90 km",
      dur: "1h15",
      label: "Percé → Parc Forillon",
      mapUrl: "https://www.google.com/maps/dir/Perce/Forillon+National+Park",
      timeline: [
        { t: "09:00", d: "🚗 Départ vers Forillon" },
        { t: "10:00", d: "⛰️ Parc Forillon — le bout du monde" },
        { t: "10:30", d: "🥾 Randonnée Cap Bon-Ami ou Cap Gaspé" },
        { t: "13:00", d: "🍽️ Pique-nique dans le parc" },
        { t: "15:00", d: "🐳 Observation phoques + baleines depuis la côte" },
        { t: "17:00", d: "🏠 Installation hébergement" }
      ],
      highlights: [
        "⛰️ Forillon — « le bout du monde »",
        "🐳 Phoques et baleines depuis la côte",
        "🥾 Sentiers falaises avec vue 360°"
      ],
      hotelId: "forillon",
      locationId: "forillon"
    },
    {
      day: 10,
      emoji: "🚗",
      from: "Forillon",
      to: "Campbellton NB",
      dist: "300 km",
      dur: "3h30",
      label: "Forillon → Nouveau-Brunswick",
      mapUrl: "https://www.google.com/maps/dir/Forillon+National+Park/Campbellton+NB",
      timeline: [
        { t: "09:00", d: "🚗 Traversée Gaspésie → Nouveau-Brunswick" },
        { t: "12:30", d: "🍽️ Déjeuner en route" },
        { t: "14:00", d: "🏠 Arrivée Campbellton" },
        { t: "15:30", d: "🚶 Balade, détente" }
      ],
      highlights: [
        "🗺️ Traversée vers le Nouveau-Brunswick",
        "🌲 Paysages forêts et rivière Restigouche",
        "💤 Jour de transfert — repos"
      ],
      hotelId: "campbellton",
      locationId: "campbellton"
    },
    {
      day: 11,
      emoji: "🚗",
      from: "Campbellton",
      to: "Hopewell Cape",
      dist: "400 km",
      dur: "4h30",
      label: "Campbellton → Baie de Fundy",
      mapUrl: "https://www.google.com/maps/dir/Campbellton+NB/Hopewell+Cape+NB",
      timeline: [
        { t: "08:30", d: "🚗 Route vers Fundy (~4h30)" },
        { t: "12:00", d: "🍽️ Déjeuner Moncton" },
        { t: "14:00", d: "🌊 Arrivée Hopewell Rocks" },
        { t: "15:00", d: "🪨 Visite Hopewell Rocks (vérifier horaire marée !)" },
        { t: "18:00", d: "🍽️ Dîner local" }
      ],
      highlights: [
        "🌊 Baie de Fundy — marées les plus hautes du monde (+16 m !)",
        "🪨 Hopewell Rocks — pots de fleurs géants",
        "⚠️ Vérifier horaires des marées (marcher au fond à marée basse !)"
      ],
      hotelId: "fundy",
      locationId: "fundy"
    },
    {
      day: 12,
      emoji: "🌊",
      from: "Hopewell Cape",
      to: "Hopewell Cape",
      dist: "50 km",
      dur: "-",
      label: "Journée Baie de Fundy",
      timeline: [
        { t: "06:00", d: "🌊 Marée basse Hopewell Rocks (si pas fait hier)" },
        { t: "09:30", d: "🥾 Fundy Trail Parkway — sentiers côtiers" },
        { t: "12:30", d: "🍽️ Déjeuner" },
        { t: "14:00", d: "🚣 Kayak de mer (si dispo) ou plage" },
        { t: "17:00", d: "🌊 Observer la marée montante" }
      ],
      highlights: [
        "🌊 Marée qui monte de 16 m en 6h !",
        "🚣 Kayak possible à marée haute",
        "🥾 Fundy Trail — sentiers spectaculaires"
      ],
      hotelId: "fundy",
      locationId: "fundy"
    },
    {
      day: 13,
      emoji: "🌉",
      from: "Hopewell Cape",
      to: "Charlottetown PEI",
      dist: "200 km",
      dur: "2h30",
      label: "Fundy → Île-du-Prince-Édouard",
      mapUrl: "https://www.google.com/maps/dir/Hopewell+Cape+NB/Charlottetown+PEI",
      timeline: [
        { t: "09:30", d: "🚗 Départ vers PEI" },
        { t: "10:30", d: "🌉 Pont de la Confédération (13 km !)" },
        { t: "11:00", d: "🏝️ Bienvenue à l'Île-du-Prince-Édouard !" },
        { t: "12:00", d: "🍽️ Déjeuner Charlottetown" },
        { t: "14:00", d: "🏖️ Plages de sable rouge" },
        { t: "18:00", d: "🦞 HOMARD — lobster supper traditionnel !" }
      ],
      highlights: [
        "🌉 Pont de la Confédération — 13 km au-dessus de la mer !",
        "🏖️ Plages de sable rouge uniques",
        "🦞 Lobster supper — tradition PEI"
      ],
      hotelId: "charlottetown",
      locationId: "charlottetown"
    },
    {
      day: 14,
      emoji: "🏖️",
      from: "Charlottetown",
      to: "Charlottetown",
      dist: "100 km",
      dur: "-",
      label: "PEI — Plages, Anne, homard",
      timeline: [
        { t: "09:30", d: "🏠 Anne of Green Gables Heritage Place" },
        { t: "11:30", d: "🏖️ Parc national PEI — plages Cavendish" },
        { t: "13:00", d: "🍽️ Fish & chips sur la plage" },
        { t: "15:00", d: "🚶 Charlottetown — waterfront, artisans" },
        { t: "19:00", d: "🍽️ Dîner fruits de mer (Claddagh Room ou Lobster on the Wharf)" }
      ],
      highlights: [
        "📚 Anne of Green Gables — icône littéraire canadienne",
        "🏖️ Plages de sable rouge + falaises",
        "🦞 Meilleur homard du Canada (pas de débat)"
      ],
      hotelId: "charlottetown",
      locationId: "charlottetown"
    },
    {
      day: 15,
      emoji: "⚓",
      from: "Charlottetown",
      to: "Halifax",
      dist: "300 km",
      dur: "3h30",
      label: "PEI → Halifax",
      mapUrl: "https://www.google.com/maps/dir/Charlottetown+PEI/Halifax+NS",
      timeline: [
        { t: "09:00", d: "🚗 Départ PEI → Halifax" },
        { t: "10:00", d: "⛴️ Ferry Wood Islands → Caribou (si ce trajet)" },
        { t: "12:30", d: "🏙️ Arrivée Halifax" },
        { t: "13:00", d: "🍽️ Déjeuner waterfront" },
        { t: "15:00", d: "⚓ Halifax — waterfront, Citadelle, brasseries" },
        { t: "18:00", d: "🍽️ Dîner (brasseries locales)" }
      ],
      highlights: [
        "⚓ Halifax — ville portuaire vibrante",
        "🍺 Brasseries artisanales (Alexander Keith's 1820)",
        "🏛️ Citadelle, musée Maritime de l'Atlantique"
      ],
      hotelId: "halifax",
      locationId: "halifax"
    },
    {
      day: 16,
      emoji: "🗼",
      from: "Halifax",
      to: "Cape Breton",
      dist: "300 km",
      dur: "3h30",
      label: "Halifax → Cape Breton",
      mapUrl: "https://www.google.com/maps/dir/Halifax/Baddeck+NS",
      timeline: [
        { t: "08:00", d: "🚗 Départ tôt (route longue)" },
        { t: "09:30", d: "🗼 Arrêt Peggy's Cove — phare iconique" },
        { t: "11:00", d: "🚗 Reprise route vers Cape Breton" },
        { t: "14:00", d: "🏠 Arrivée Baddeck" },
        { t: "15:30", d: "🚶 Baddeck — village charmant, Alexander Graham Bell" },
        { t: "18:00", d: "🍽️ Dîner local" }
      ],
      highlights: [
        "🗼 Peggy's Cove — LE phare le plus photographié du Canada",
        "🏝️ Cape Breton Island — début de l'aventure",
        "📞 Baddeck — musée Alexander Graham Bell"
      ],
      hotelId: "cape-breton",
      locationId: "cape-breton"
    },
    {
      day: 17,
      emoji: "🛤️",
      from: "Cape Breton",
      to: "Cape Breton",
      dist: "300 km",
      dur: "Boucle",
      label: "CABOT TRAIL — La plus belle route du Canada",
      timeline: [
        { t: "08:00", d: "🚗 Départ boucle Cabot Trail (sens horaire)" },
        { t: "09:30", d: "⛰️ Skyline Trail — rando vue plongeante sur l'océan" },
        { t: "12:00", d: "🍽️ Déjeuner Meat Cove ou Pleasant Bay" },
        { t: "14:00", d: "📸 Arrêts points de vue (trop nombreux !)" },
        { t: "16:00", d: "🐋 Observation baleines depuis la côte" },
        { t: "18:30", d: "🍽️ Dîner Ingonish ou retour Baddeck" }
      ],
      highlights: [
        "🛤️ CABOT TRAIL — 300 km de pure beauté",
        "⛰️ Skyline Trail — incontournable",
        "🐋 Baleines possibles depuis la côte !",
        "📸 Plus belle route scenic du Canada"
      ],
      hotelId: "cape-breton",
      locationId: "cape-breton"
    },
    {
      day: 18,
      emoji: "🚗",
      from: "Cape Breton",
      to: "Moncton NB",
      dist: "480 km",
      dur: "5h",
      label: "Cape Breton → Moncton (retour)",
      mapUrl: "https://www.google.com/maps/dir/Baddeck+NS/Moncton+NB",
      timeline: [
        { t: "08:00", d: "🚗 Longue route retour (~5h)" },
        { t: "12:00", d: "🍽️ Déjeuner en route" },
        { t: "14:00", d: "🏠 Arrivée Moncton" },
        { t: "15:00", d: "💤 Repos / balade libre" }
      ],
      highlights: [
        "🚗 Jour de transfert — 5h de route",
        "💤 Repos mérité après Cabot Trail",
        "🗺️ Trans-Canadienne"
      ],
      hotelId: "moncton",
      locationId: "moncton"
    },
    {
      day: 19,
      emoji: "🚗",
      from: "Moncton",
      to: "Rivière-du-Loup",
      dist: "500 km",
      dur: "5h",
      label: "Moncton → Rivière-du-Loup (retour)",
      mapUrl: "https://www.google.com/maps/dir/Moncton+NB/Riviere-du-Loup+QC",
      timeline: [
        { t: "08:00", d: "🚗 Départ → Rivière-du-Loup (~5h)" },
        { t: "12:00", d: "🍽️ Déjeuner en route" },
        { t: "14:00", d: "🏠 Arrivée Rivière-du-Loup" },
        { t: "15:30", d: "🚶 Bord du Saint-Laurent, coucher de soleil" }
      ],
      highlights: [
        "🚗 Jour de transfert — retour vers Montréal",
        "🌅 Coucher de soleil sur le Saint-Laurent",
        "🦞 Dernier homard avant Montréal ?"
      ],
      hotelId: "riviere-du-loup",
      locationId: "riviere-du-loup"
    },
    {
      day: 20,
      emoji: "🚗",
      from: "Rivière-du-Loup",
      to: "Montréal",
      dist: "470 km",
      dur: "4h30",
      label: "Rivière-du-Loup → Montréal",
      mapUrl: "https://www.google.com/maps/dir/Riviere-du-Loup+QC/Montreal",
      timeline: [
        { t: "09:00", d: "🚗 Dernier trajet → Montréal" },
        { t: "13:30", d: "🏙️ Arrivée Montréal" },
        { t: "14:00", d: "🚗 Retour voiture location" },
        { t: "16:00", d: "🏙️ Dernière soirée Montréal" },
        { t: "19:00", d: "🍽️ Dîner d'adieu avec Baptiste & Emma" }
      ],
      highlights: [
        "🏙️ Retour à Montréal",
        "🚗 Rendu voiture de location",
        "🍽️ Dernier dîner ensemble"
      ],
      hotelId: "montreal-retour",
      locationId: "montreal"
    },
    {
      day: 21,
      emoji: "✈️",
      from: "Montréal",
      to: "Nice",
      dist: "Vol",
      dur: "~8h",
      label: "Vol retour Montréal → Nice",
      timeline: [
        { t: "🌅", d: "✈️ Vol Montréal → Nice" },
        { t: "PM", d: "🏠 Arrivée Nice" }
      ],
      highlights: ["✈️ Retour avec des souvenirs plein la tête", "🦞 ~4700 km parcourus, 3+ homards mangés"],
      hotelId: "maison",
      locationId: "nice"
    }
  ],
  hotels: [
    { id: "montreal", name: "Hébergement Montréal", city: "Montréal", emoji: "🏙️", type: "hotel", booked: false, note: "À réserver — 2 nuits (J1-J2)" },
    { id: "quebec-city", name: "Hébergement Québec", city: "Québec City", emoji: "🏰", type: "hotel", booked: false, note: "À réserver — 2 nuits (J3-J4)" },
    { id: "tadoussac", name: "Hébergement Tadoussac", city: "Tadoussac", emoji: "🐋", type: "hotel", booked: false, note: "À réserver — 1 nuit (J5)" },
    { id: "rimouski", name: "Hébergement Rimouski", city: "Rimouski", emoji: "🌊", type: "hotel", booked: false, note: "À réserver — 1 nuit (J6)" },
    { id: "ste-anne", name: "Hébergement Ste-Anne-des-Monts", city: "Sainte-Anne-des-Monts", emoji: "⛰️", type: "hotel", booked: false, note: "À réserver — 1 nuit (J7)" },
    { id: "perce", name: "Hébergement Percé", city: "Percé", emoji: "🪨", type: "hotel", booked: false, note: "À réserver — 2 nuits (J8-J9)" },
    { id: "forillon", name: "Hébergement Forillon", city: "Gaspé", emoji: "🌊", type: "hotel", booked: false, note: "À réserver — 1 nuit (J10)" },
    { id: "campbellton", name: "Hébergement Campbellton", city: "Campbellton", emoji: "🌲", type: "hotel", booked: false, note: "À réserver — 1 nuit (J11)" },
    { id: "fundy", name: "Hébergement Baie de Fundy", city: "Hopewell Cape", emoji: "🌊", type: "hotel", booked: false, note: "À réserver — 2 nuits (J12-J13)" },
    { id: "charlottetown", name: "Hébergement Charlottetown", city: "Charlottetown", emoji: "🏖️", type: "hotel", booked: false, note: "À réserver — 2 nuits (J14-J15)" },
    { id: "halifax", name: "Hébergement Halifax", city: "Halifax", emoji: "⚓", type: "hotel", booked: false, note: "À réserver — 1 nuit (J16)" },
    { id: "cape-breton", name: "Hébergement Cape Breton", city: "Baddeck", emoji: "🛤️", type: "hotel", booked: false, note: "À réserver — 2 nuits (J17-J18)" },
    { id: "moncton", name: "Hébergement Moncton", city: "Moncton", emoji: "🚗", type: "hotel", booked: false, note: "À réserver — 1 nuit (J19)" },
    { id: "riviere-du-loup", name: "Hébergement Rivière-du-Loup", city: "Rivière-du-Loup", emoji: "🌅", type: "hotel", booked: false, note: "À réserver — 1 nuit (J20)" },
    { id: "montreal-retour", name: "Hébergement Montréal (retour)", city: "Montréal", emoji: "🏙️", type: "hotel", booked: false, note: "À réserver — 1 nuit (J21)" },
    { id: "maison", name: "🏠 Maison", city: "Nice", emoji: "🏠", type: "home" }
  ],
  lists: [],
  restaurants: [],
  culture: [
    {
      title: "🐋 Tadoussac — Capitale mondiale des baleines",
      sub: "Confluence Saguenay + Saint-Laurent • 13 espèces de cétacés",
      sections: [
        {
          h: "Pourquoi les baleines viennent ICI",
          p: "Le fjord du Saguenay se jette dans le Saint-Laurent en créant un upwelling — l'eau froide des profondeurs remonte et concentre le krill en surface. C'est un buffet à volonté pour les baleines. Résultat : 13 espèces fréquentent ces eaux, dont les bélugas (résidents permanents, ~900 individus) et les rorquals bleus (plus grands animaux ayant jamais existé, 30 mètres, 170 tonnes)."
        },
        {
          h: "Tadoussac — Plus vieux village du Canada",
          p: "Premier poste de traite français en 1600 (avant Québec !). Pierre de Chauvin y construit la première maison européenne du Canada. Aujourd'hui 800 habitants permanents, mais 300 000 visiteurs/an pour les baleines. L'Hôtel Tadoussac (le toit rouge emblématique) date de 1864."
        },
        {
          h: "Les bélugas du Saint-Laurent — Population unique et menacée",
          p: "Ces bélugas sont la population la plus au sud au monde — isolée depuis 10 000 ans (fin de l'ère glaciaire). Autrefois 10 000, aujourd'hui ~900. Menaces : pollution chimique (BPC), bruit maritime, réchauffement. Un programme de photo-identification suit chaque individu. Vitesse max bateaux réduite à 15 nœuds dans leur habitat."
        }
      ]
    },
    {
      title: "⛰️ Gaspésie — Le bout du monde québécois",
      sub: "Péninsule isolée • Rocher Percé • Fous de Bassan • Monts Chic-Chocs",
      sections: [
        {
          h: "Le Rocher Percé — Emblème du Québec",
          p: "Rocher calcaire de 88 m de haut, 438 m de long, percé d'une arche naturelle de 15 m. Il pesait 5 millions de tonnes et perd 300 tonnes par an à l'érosion. En 1845, il avait 2 arches — la seconde s'est effondrée. On prédit que l'arche actuelle tombera d'ici 400 ans. Accès à pied uniquement à marée basse (interdit de grimper depuis 2016)."
        },
        {
          h: "Île Bonaventure — Fou de Bassan City",
          p: "116 000 fous de Bassan — la plus grande colonie accessible au monde. Ces oiseaux plongent à 120 km/h, ont 1,8 m d'envergure, et reviennent EXACTEMENT au même nid chaque année (couple à vie). Le sentier fait le tour de l'île (6 km), l'arrivée sur la colonie est un choc sensoriel : le bruit, l'odeur, 50 000 oiseaux dans ton champ de vision."
        },
        {
          h: "Les Chic-Chocs — Montagnes oubliées",
          p: "Les Chic-Chocs sont la continuation nord des Appalaches au Québec (1 270 m max). Toundra arctique au sommet — les seuls caribous au sud du 49° parallèle vivent ici (harde de la Gaspésie, 30 individus, en danger critique). Mot micmac 'Chic-Chocs' = 'mur infranchissable'. Les sentiers du Parc national de la Gaspésie offrent des vues sur le fleuve à couper le souffle."
        },
        {
          h: "Jacques Cartier — 'Je vois le Canada'",
          p: "En 1534, Cartier plante une croix à Gaspé et réclame le territoire pour la France. Le mot 'Canada' vient d'un malentendu : le chef iroquois Donnacona désigne son village ('kanata' = village). Cartier croit que c'est le nom du pays. 500 ans plus tard, le nom est resté."
        }
      ]
    },
    {
      title: "🌊 Baie de Fundy — Les plus hautes marées du monde",
      sub: "Nouveau-Brunswick • 16 m de marnage • Hopewell Rocks",
      sections: [
        {
          h: "16 mètres de marnage — Un immeuble de 5 étages",
          p: "Deux fois par jour, 160 milliards de tonnes d'eau entrent et sortent de la baie. Plus d'eau que le débit combiné de toutes les rivières du monde. La forme en entonnoir de la baie (270 km de long, se rétrécit de 100 km à 35 km) amplifie les marées par résonance. Record : 21,6 m en 1869 (tempête + grande marée)."
        },
        {
          h: "Hopewell Rocks — Les pots de fleurs géants",
          p: "Ces formations rocheuses à base érodée ressemblent à d'énormes pots de fleurs (arbres au sommet). À marée basse : on marche sur le fond océanique entre ces monolithes de 15 m. 6 heures plus tard : l'eau les recouvre jusqu'aux arbres, on fait du kayak au même endroit. C'est la démonstration la plus visuelle de la puissance de Fundy."
        },
        {
          h: "Le mascaret — Surfer la marée",
          p: "Quand la marée monte, elle remonte les rivières en une vague continue (mascaret). Sur la Petitcodiac River à Moncton, le mascaret peut atteindre 2 m de haut. Des surfeurs viennent du monde entier pour surfer cette vague qui avance pendant 30 km sans s'arrêter. Meilleure saison : équinoxes (mars et septembre)."
        }
      ]
    },
    {
      title: "🏖️ Île-du-Prince-Édouard — Le jardin du Golfe",
      sub: "Plus petite province • Anne aux pignons verts • Plages rouges",
      sections: [
        {
          h: "Anne of Green Gables — Phénomène culturel mondial",
          p: "Lucy Maud Montgomery publie 'Anne… la Maison aux pignons verts' en 1908. Vendu à 50 millions d'exemplaires, traduit en 36 langues. Le Japon est OBSEDÉ : 'Akage no An' est au programme scolaire, 15 000 touristes japonais visitent Cavendish chaque année. La 'Green Gables Heritage Place' reçoit 300 000 visiteurs/an — plus que la population totale de l'île (170 000)."
        },
        {
          h: "Le pont de la Confédération — Plus long pont sur eau glacée",
          p: "12,9 km reliant l'île au continent depuis 1997. Coût : 1 milliard $. Avant : uniquement ferry (et bloquage hivernal). Défi technique : la glace exerce une pression latérale monstrueuse, donc les piliers sont en forme de cône inversé pour briser la glace. Péage : 49,50$ mais uniquement en SORTANT de l'île (pour pas décourager les touristes d'y aller)."
        },
        {
          h: "Les falaises et plages rouges",
          p: "Le grès rouge de l'île a 250 millions d'années (Période Permienne). Riche en oxyde de fer, il donne aux falaises et plages une couleur rouille saisissante, surtout au coucher du soleil. L'érosion est rapide : 1 m/an sur certaines falaises. Des maisons construites à 50 m du bord dans les années 1960 sont aujourd'hui au bord de l'effondrement."
        },
        {
          h: "Capitale canadienne du homard",
          p: "L'Île produit 60% des homards du Canada. Saison de pêche : mai-juin et août-octobre. 1 200 pêcheurs pour 170 000 habitants. Le 'lobster supper' (homard bouilli avec épis de maïs et pomme de terre) coûte 35-50$ dans les cantines communautaires — impossible de manger du homard aussi frais et aussi peu cher ailleurs dans le monde."
        }
      ]
    },
    {
      title: "🌿 Acadie — Le peuple résilient",
      sub: "Nouveau-Brunswick francophone • Grand Dérangement • Culture unique",
      sections: [
        {
          h: "Le Grand Dérangement (1755) — Nettoyage ethnique oublié",
          p: "Les Britanniques déportent 11 500 Acadiens (sur 14 000) en 1755-1764. Fermes brûlées, familles séparées, navires vers la Louisiane, la France, les colonies anglaises. 1/3 meurt en route. Ceux arrivés en Louisiane deviennent les Cajuns (Acadian → 'Cadien → Cajun). Certains reviennent 30 ans plus tard — leurs terres sont occupées par des colons anglais."
        },
        {
          h: "Le français acadien — Cousin méconnu",
          p: "Différent du québécois ! Le français acadien conserve des formes du XVIe siècle (avant la standardisation de Louis XIV). 'J'avons' au lieu de 'nous avons', 'point' au lieu de 'pas' (comme au XVIe). Le chiac (sud-est NB) mélange français/anglais de façon unique : 'J'ai drive mon car back à la maison'. Longtemps stigmatisé, aujourd'hui célébré dans la musique et la littérature."
        },
        {
          h: "Le drapeau acadien et le Tintamarre",
          p: "Drapeau tricolore français + étoile jaune (Stella Maris, patronne des marins). Le 15 août (Fête nationale acadienne), toute la communauté sort dans la rue en faisant le maximum de bruit avec casseroles, klaxons, instruments — le Tintamarre. Symbolique : 'on est encore là, on fait du bruit, on ne se taira plus'. Le plus grand à Caraquet rassemble 20 000 personnes."
        }
      ]
    },
    {
      title: "🏙️ Montréal — Retour à la métropole",
      sub: "Fin du voyage • Dernières découvertes",
      sections: [
        {
          h: "Le Vieux-Montréal — 400 ans d'architecture",
          p: "Fondée en 1642 sous le nom de Ville-Marie. Le Vieux-Port conserve les bâtiments de la Nouvelle-France (pavés, maisons en pierre grise, églises). La basilique Notre-Dame (1829) a inspiré Sacré-Cœur à Paris. Céline Dion s'y est mariée en 1994 (cérémonie télévisée). L'intérieur bleu et or est spectaculaire — entrée 10$."
        },
        {
          h: "Bagels montréalais vs New York",
          p: "Guerre éternelle. Différences clés : le bagel montréalais est bouillis dans l'eau sucrée au miel (pas salée), cuit au four à bois, plus petit, plus dense, plus sucré, avec un plus grand trou. St-Viateur (1957) vs Fairmount (1919) : les deux ouverts 24h/24, les deux prétendent être les meilleurs. Conseil : prendre les deux, trancher est impossible."
        },
        {
          h: "Marché Jean-Talon — Le plus grand marché à ciel ouvert du Canada",
          p: "Ouvert en 1933, c'est le cœur gastronomique de Montréal. Producteurs locaux (siège d'érable frais en mars, tomates du Québec en août), fromageries, boucheries, épiceries du monde. Le samedi matin, toute la ville y converge. Conseil : goûter aux 'fromages en grains' frais (le 'squick-squick' du fromage à poutine parfait)."
        }
      ]
    }
  ]
};
