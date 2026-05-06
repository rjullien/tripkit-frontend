var SEED_CANADA_ONTARIO_2026 = {
  trip: {
    id: "canada-ontario-2026",
    name: "Canada Ontario & Niagara 2026",
    emoji: "🌊",
    startDate: "2026-08-14",
    endDate: "2026-09-05",
    mapImage: "map-overview.png",
    routeUrl: "https://www.google.com/maps/dir/Montr%C3%A9al,+QC/Qu%C3%A9bec,+QC/Gananoque,+ON/Ottawa,+ON/Toronto,+ON/Niagara+Falls,+ON/Tobermory,+ON/Algonquin+Park,+ON/Montr%C3%A9al,+QC",
    travelers: [
      { name: "René", role: "owner" },
      { name: "Nicole" },
      { name: "Baptiste" }
    ],
    phases: [
      { name: "Vol + Québec", days: [0, 2] },
      { name: "Mille-Îles & Ottawa", days: [3, 6] },
      { name: "Toronto & Niagara", days: [7, 11] },
      { name: "Bruce & Algonquin", days: [12, 15] },
      { name: "Montréal", days: [16, 21] }
    ],
    users: {
      rjullien: { city: "Nice", locationId: "montreal", defaultConf: "rene" }
    }
  },
  days: [
    {
      day: 0, emoji: "✈️", from: "Nice", to: "Montréal", dist: "Vol", dur: "~9h",
      label: "Vol Nice → Montréal + Préparation",
      timeline: [
        { t: "🌅", d: "✈️ Vol Nice → Montréal (14 août)" },
        { t: "Sam", d: "🚗 Location voiture + courses" },
        { t: "PM", d: "👨‍👩‍👦 Retrouvailles avec Baptiste" }
      ],
      highlights: ["✈️ Vol aller", "🚗 Location SUV", "🇨🇦 C'est parti !"],
      hotelId: "montreal", locationId: "montreal"
    },
    {
      day: 1, emoji: "🏰", from: "Montréal", to: "Québec City", dist: "250 km", dur: "2h45",
      label: "Montréal → Québec City",
      mapUrl: "https://www.google.com/maps/dir/Montreal/Quebec+City",
      timeline: [
        { t: "09:30", d: "🚗 Départ Montréal → Québec" },
        { t: "12:30", d: "🏰 Arrivée Vieux-Québec" },
        { t: "13:00", d: "🍽️ Déjeuner Petit-Champlain" },
        { t: "15:00", d: "🚶 Château Frontenac, Terrasse Dufferin, Place Royale" },
        { t: "19:00", d: "🍽️ Dîner Vieux-Québec" }
      ],
      highlights: ["🏰 Vieux-Québec — UNESCO", "📸 Château Frontenac", "🇫🇷 Seule ville fortifiée d'Amérique du Nord"],
      hotelId: "quebec-city", locationId: "quebec-city"
    },
    {
      day: 2, emoji: "🏝️", from: "Québec", to: "Québec", dist: "80 km", dur: "-",
      label: "Île d'Orléans + Chutes Montmorency",
      timeline: [
        { t: "09:30", d: "🏝️ Île d'Orléans — producteurs locaux, cidre, fromage" },
        { t: "12:00", d: "🍽️ Déjeuner sur l'île" },
        { t: "14:30", d: "💧 Chutes Montmorency (83 m — plus hautes que Niagara !)" },
        { t: "16:30", d: "🚶 Retour Québec, balade libre" }
      ],
      highlights: ["🏝️ Île d'Orléans — jardin de Québec", "💧 Montmorency : 83 m (30 m > Niagara !)", "🧀 Cidre, fromage, fraises"],
      hotelId: "quebec-city", locationId: "quebec-city"
    },
    {
      day: 3, emoji: "🚗", from: "Québec City", to: "Gananoque", dist: "450 km", dur: "4h30",
      label: "Québec → Mille-Îles (Gananoque)",
      mapUrl: "https://www.google.com/maps/dir/Quebec+City/Gananoque+ON",
      timeline: [
        { t: "08:30", d: "🚗 Départ vers les Mille-Îles (~4h30)" },
        { t: "11:00", d: "☕ Pause Kingston (fort, waterfront)" },
        { t: "13:00", d: "🏠 Arrivée Gananoque" },
        { t: "14:30", d: "🚶 Village, quais, exploration" },
        { t: "18:00", d: "🍽️ Dîner bord de l'eau" }
      ],
      highlights: ["🏝️ 1 864 îles entre Canada et USA", "🚗 Jour de route — relayer conducteurs", "⛵ Demain : croisière !"],
      hotelId: "mille-iles", locationId: "gananoque"
    },
    {
      day: 4, emoji: "⛵", from: "Gananoque", to: "Gananoque", dist: "30 km", dur: "-",
      label: "Mille-Îles — Croisière & Kayak",
      timeline: [
        { t: "09:30", d: "⛵ Croisière Mille-Îles (2-3h)" },
        { t: "12:30", d: "🍽️ Déjeuner au village" },
        { t: "14:00", d: "🛶 Kayak entre les îles (ou 2e croisière Boldt Castle)" },
        { t: "17:00", d: "📸 Thousand Islands Bridge lookout" },
        { t: "19:00", d: "🍽️ Dîner" }
      ],
      highlights: ["⛵ Croisière — châteaux sur les îles", "🏰 Boldt Castle (côté US, passeport !)", "🛶 Kayak eaux calmes entre les îles"],
      hotelId: "mille-iles", locationId: "gananoque"
    },
    {
      day: 5, emoji: "🏛️", from: "Gananoque", to: "Ottawa", dist: "200 km", dur: "2h15",
      label: "Mille-Îles → Ottawa",
      mapUrl: "https://www.google.com/maps/dir/Gananoque+ON/Ottawa",
      timeline: [
        { t: "09:30", d: "🚗 Route vers Ottawa" },
        { t: "12:00", d: "🏛️ Arrivée Ottawa — Colline du Parlement" },
        { t: "13:00", d: "🍽️ Déjeuner marché ByWard" },
        { t: "14:30", d: "🏛️ Parlement (visite gratuite), canal Rideau" },
        { t: "17:00", d: "🏛️ Musée des Beaux-Arts ou War Museum" },
        { t: "19:00", d: "🍽️ Dîner ByWard Market" }
      ],
      highlights: ["🏛️ Parlement du Canada — capitale fédérale", "🏛️ Canal Rideau — UNESCO", "🍺 Marché ByWard — restos, brasseries"],
      hotelId: "ottawa", locationId: "ottawa"
    },
    {
      day: 6, emoji: "🏛️", from: "Ottawa", to: "Ottawa", dist: "20 km", dur: "-",
      label: "Ottawa — Musées & Culture",
      timeline: [
        { t: "09:30", d: "🏛️ Musée canadien de l'Histoire (Gatineau)" },
        { t: "12:00", d: "🍽️ Déjeuner (Queue de castor = BeaverTails !)" },
        { t: "14:00", d: "🚶 Promenade canal Rideau + Sussex Drive" },
        { t: "16:00", d: "📸 Rideau Falls, Rockcliffe Park" },
        { t: "18:00", d: "🍽️ Dîner Elgin Street" }
      ],
      highlights: ["🏛️ Musée de l'Histoire — le meilleur du Canada", "🦫 BeaverTails — pâtisserie iconique", "🌳 Ottawa verte et agréable en août"],
      hotelId: "ottawa", locationId: "ottawa"
    },
    {
      day: 7, emoji: "🏙️", from: "Ottawa", to: "Toronto", dist: "450 km", dur: "4h30",
      label: "Ottawa → Toronto",
      mapUrl: "https://www.google.com/maps/dir/Ottawa/Toronto",
      timeline: [
        { t: "08:30", d: "🚗 Départ Ottawa → Toronto (~4h30)" },
        { t: "12:00", d: "☕ Pause déjeuner en route" },
        { t: "13:30", d: "🏙️ Arrivée Toronto" },
        { t: "15:00", d: "🗼 CN Tower (553 m !)" },
        { t: "17:00", d: "🚶 Waterfront, Harbourfront" },
        { t: "19:00", d: "🍽️ Dîner Distillery District" }
      ],
      highlights: ["🗼 CN Tower — 553 m, vue sur le lac Ontario", "🏙️ Toronto — plus grande ville du Canada", "🍺 Distillery District — briques & brasseries"],
      hotelId: "toronto", locationId: "toronto"
    },
    {
      day: 8, emoji: "🏙️", from: "Toronto", to: "Toronto", dist: "20 km", dur: "-",
      label: "Toronto — Journée exploration",
      timeline: [
        { t: "09:30", d: "🏙️ Kensington Market + Chinatown" },
        { t: "11:30", d: "☕ Café sur Queen West" },
        { t: "12:30", d: "🍽️ Déjeuner St. Lawrence Market (samedi = farmers market)" },
        { t: "14:00", d: "⛴️ Ferry → Toronto Islands (plages, vue skyline)" },
        { t: "17:00", d: "🏙️ Retour, quartier Yorkville ou Dundas Sq" },
        { t: "19:30", d: "🍽️ Dîner Little Italy ou Ossington" }
      ],
      highlights: ["🏝️ Toronto Islands — plage + vue skyline", "🛍️ Kensington Market — boho, vintage, foodie", "🌆 Ville multiculturelle vibrante"],
      hotelId: "toronto", locationId: "toronto"
    },
    {
      day: 9, emoji: "🏙️", from: "Toronto", to: "Toronto", dist: "20 km", dur: "-",
      label: "Toronto — Suite",
      timeline: [
        { t: "10:00", d: "🏛️ Royal Ontario Museum (ROM) ou Art Gallery (AGO)" },
        { t: "12:30", d: "🍽️ Brunch Leslieville ou Riverside" },
        { t: "14:00", d: "🍺 Brasseries artisanales (Steam Whistle, Bellwoods)" },
        { t: "16:00", d: "🚶 The Path (ville souterraine) ou Graffiti Alley" },
        { t: "19:00", d: "🍽️ Dernier dîner Toronto" }
      ],
      highlights: ["🏛️ ROM ou AGO — musées world-class", "🍺 Craft beer scene massive", "🎨 Graffiti Alley — street art"],
      hotelId: "toronto", locationId: "toronto"
    },
    {
      day: 10, emoji: "🌊", from: "Toronto", to: "Niagara Falls", dist: "130 km", dur: "1h30",
      label: "Toronto → NIAGARA FALLS !",
      mapUrl: "https://www.google.com/maps/dir/Toronto/Niagara+Falls+Canada",
      timeline: [
        { t: "09:00", d: "🚗 Route vers Niagara (~1h30)" },
        { t: "10:30", d: "🌊 ARRIVÉE — vue des chutes !" },
        { t: "11:00", d: "🚢 Hornblower Cruise (bateau au pied des chutes)" },
        { t: "12:30", d: "🍽️ Déjeuner avec vue sur les chutes" },
        { t: "14:00", d: "🌀 Journey Behind the Falls (tunnels derrière la chute)" },
        { t: "16:00", d: "🚶 Promenade bord des chutes, Table Rock" },
        { t: "20:00", d: "🌈 Illumination nocturne des chutes !" }
      ],
      highlights: ["🌊 NIAGARA FALLS — 57 m, 2 800 m³/s !", "🚢 Hornblower — douche garantie 💦", "🌈 Illumination couleurs la nuit"],
      hotelId: "niagara", locationId: "niagara"
    },
    {
      day: 11, emoji: "🍷", from: "Niagara Falls", to: "Niagara Falls", dist: "50 km", dur: "-",
      label: "Niagara-on-the-Lake + Vignobles",
      timeline: [
        { t: "09:30", d: "🚗 Niagara-on-the-Lake (30 min)" },
        { t: "10:00", d: "🏘️ Village victorien — boutiques, fleurs" },
        { t: "11:30", d: "🍷 Route des vins — Inniskillin (ice wine !)" },
        { t: "13:00", d: "🍽️ Déjeuner dans un domaine viticole" },
        { t: "15:00", d: "🍷 2ème domaine (Peller Estates ou Jackson-Triggs)" },
        { t: "17:00", d: "🌊 Retour chutes — Whirlpool Aero Car" },
        { t: "19:00", d: "🍽️ Dîner" }
      ],
      highlights: ["🍷 Ice wine — spécialité canadienne !", "🏘️ Niagara-on-the-Lake — village le plus charmant d'Ontario", "🌀 Whirlpool — tourbillon géant en aval"],
      hotelId: "niagara", locationId: "niagara"
    },
    {
      day: 12, emoji: "🏖️", from: "Niagara Falls", to: "Tobermory", dist: "300 km", dur: "3h30",
      label: "Niagara → Bruce Peninsula / Tobermory",
      mapUrl: "https://www.google.com/maps/dir/Niagara+Falls+Canada/Tobermory+ON",
      timeline: [
        { t: "08:30", d: "🚗 Route vers Tobermory (~3h30)" },
        { t: "12:00", d: "🍽️ Déjeuner en route" },
        { t: "13:00", d: "🏖️ Arrivée Tobermory — village de pêcheurs" },
        { t: "14:30", d: "🚶 Petit port, eaux turquoise, bateau à fond de verre" },
        { t: "16:00", d: "🏊 Indian Head Cove ou baignade" },
        { t: "19:00", d: "🍽️ Fish & chips au port" }
      ],
      highlights: ["🏖️ Tobermory — eaux turquoise façon Caraïbes !", "🚢 Bateaux à fond de verre (épaves visibles)", "🏊 Baignade dans des eaux cristallines"],
      hotelId: "tobermory", locationId: "tobermory"
    },
    {
      day: 13, emoji: "🏞️", from: "Tobermory", to: "Tobermory", dist: "30 km", dur: "-",
      label: "Bruce Peninsula — The Grotto & Randos",
      timeline: [
        { t: "08:00", d: "🥾 Parc national Bruce Peninsula — The Grotto (arriver tôt !)" },
        { t: "10:00", d: "🏊 Baignade The Grotto (grotte + eau turquoise)" },
        { t: "11:30", d: "🥾 Sentier Georgian Bay (Indian Head)" },
        { t: "13:00", d: "🍽️ Pique-nique" },
        { t: "14:30", d: "🏖️ Cyprus Lake ou Singing Sands Beach" },
        { t: "17:00", d: "🚶 Tobermory village, coucher de soleil Big Tub Harbour" },
        { t: "19:00", d: "🍽️ Dîner Tobermory" }
      ],
      highlights: ["🏊 The Grotto — la plus belle piscine naturelle du Canada", "🥾 Bruce Trail — sentier de 900 km (juste un bout !)", "⚠️ Réserver le créneau Grotto à l'avance"],
      hotelId: "tobermory", locationId: "tobermory"
    },
    {
      day: 14, emoji: "🌲", from: "Tobermory", to: "Algonquin Park", dist: "350 km", dur: "4h",
      label: "Tobermory → Algonquin Park",
      mapUrl: "https://www.google.com/maps/dir/Tobermory+ON/Algonquin+Park",
      timeline: [
        { t: "08:30", d: "🚗 Route vers Algonquin (~4h)" },
        { t: "12:30", d: "🍽️ Déjeuner Huntsville" },
        { t: "14:00", d: "🌲 Arrivée Algonquin — Highway 60 corridor" },
        { t: "15:00", d: "🥾 Sentier Lookout Trail (vue sur la canopée)" },
        { t: "17:00", d: "🦌 Observation faune (orignal au crépuscule !)" },
        { t: "19:00", d: "🍽️ Dîner lodge" }
      ],
      highlights: ["🌲 Algonquin — 7 600 km² de forêt sauvage", "🦌 Orignaux, castors, huards", "🍁 Paysage canadien iconique (même si pas automne !)"],
      hotelId: "algonquin", locationId: "algonquin"
    },
    {
      day: 15, emoji: "🛶", from: "Algonquin", to: "Algonquin", dist: "50 km", dur: "-",
      label: "Algonquin Park — Canoë & Nature",
      timeline: [
        { t: "07:00", d: "🦌 Safari orignal (meilleur tôt le matin !)" },
        { t: "09:00", d: "🛶 Location canoë — Canoe Lake ou Opeongo Lake" },
        { t: "12:00", d: "🍽️ Pique-nique sur une île" },
        { t: "14:00", d: "🥾 Sentier Beaver Pond ou Track & Tower" },
        { t: "16:30", d: "🏞️ Algonquin Visitor Centre (expo, vue panoramique)" },
        { t: "19:00", d: "🍽️ Dîner" }
      ],
      highlights: ["🛶 Canoë — L'EXPÉRIENCE canadienne par excellence", "🦌 Orignaux au petit matin", "🏞️ Lacs, forêts, silence absolu"],
      hotelId: "algonquin", locationId: "algonquin"
    },
    {
      day: 16, emoji: "🚗", from: "Algonquin", to: "Montréal", dist: "350 km", dur: "3h30",
      label: "Algonquin → Montréal",
      mapUrl: "https://www.google.com/maps/dir/Algonquin+Park/Montreal",
      timeline: [
        { t: "09:00", d: "🚗 Route retour vers Montréal (~3h30)" },
        { t: "12:30", d: "🏙️ Arrivée Montréal" },
        { t: "13:00", d: "🚗 Retour voiture de location" },
        { t: "15:00", d: "🏙️ Installation — début séjour Montréal" },
        { t: "19:00", d: "🍽️ Dîner avec Baptiste — La Banquise (poutine !)" }
      ],
      highlights: ["🏙️ Retour Montréal — 4 jours avec Baptiste", "🍟 La Banquise — poutine culte 24h", "🚗 Fin du road trip !"],
      hotelId: "montreal-fin", locationId: "montreal"
    },
    {
      day: 17, emoji: "🏙️", from: "Montréal", to: "Montréal", dist: "0 km", dur: "-",
      label: "Montréal avec Baptiste — Plateau & Mile End",
      timeline: [
        { t: "09:30", d: "🥯 Bagels St-Viateur ou Fairmount (le grand débat !)" },
        { t: "11:00", d: "🚶 Plateau Mont-Royal — escaliers, street art" },
        { t: "12:30", d: "🍽️ Schwartz's Deli (smoked meat, cash only, file d'attente)" },
        { t: "14:30", d: "☕ Mile End — cafés, librairies, hipster vibes" },
        { t: "16:00", d: "🏔️ Mont-Royal — vue 360° sur la ville" },
        { t: "19:00", d: "🍽️ Au Pied de Cochon (poutine au foie gras !)" }
      ],
      highlights: ["🥯 Guerre des bagels : St-Viateur vs Fairmount", "🥩 Schwartz's — smoked meat depuis 1928", "🏔️ Mont-Royal — coucher de soleil panoramique"],
      hotelId: "montreal-fin", locationId: "montreal"
    },
    {
      day: 18, emoji: "🏙️", from: "Montréal", to: "Montréal", dist: "0 km", dur: "-",
      label: "Montréal — Vieux-Port & Culture",
      timeline: [
        { t: "10:00", d: "⛪ Basilique Notre-Dame (Chapelle Sixtine du Nouveau Monde)" },
        { t: "11:30", d: "🚶 Vieux-Montréal — Place Jacques-Cartier, port" },
        { t: "13:00", d: "🍽️ Déjeuner terrasse Vieux-Port" },
        { t: "15:00", d: "🎵 Tam-tams du Mont-Royal (si dimanche) ou musée" },
        { t: "17:00", d: "🏙️ RÉSO (ville souterraine, 33 km !)" },
        { t: "19:30", d: "🍽️ Dîner — choix Baptiste" }
      ],
      highlights: ["⛪ Notre-Dame — plafond bleu étoilé", "🏙️ Vieux-Port — charme européen", "🎵 Tam-tams si dimanche (percussions spontanées)"],
      hotelId: "montreal-fin", locationId: "montreal"
    },
    {
      day: 19, emoji: "🍽️", from: "Montréal", to: "Montréal", dist: "0 km", dur: "-",
      label: "Montréal — Food Tour & Quartiers",
      timeline: [
        { t: "10:00", d: "🛒 Marché Jean-Talon (Petite Italie)" },
        { t: "11:30", d: "🍽️ Déjeuner Petite Italie" },
        { t: "14:00", d: "🏙️ Quartier DIX30 ou Parc Jean-Drapeau (Biosphère)" },
        { t: "16:00", d: "☕ Café détente, shopping" },
        { t: "19:30", d: "🍽️ Dîner d'adieu — resto special avec Baptiste" }
      ],
      highlights: ["🛒 Marché Jean-Talon — le meilleur d'Amérique du Nord", "🍕 Petite Italie — pizza, gelato, espresso", "💫 Dernier dîner ensemble"],
      hotelId: "montreal-fin", locationId: "montreal"
    },
    {
      day: 20, emoji: "🛍️", from: "Montréal", to: "Montréal", dist: "0 km", dur: "-",
      label: "Montréal — Dernier jour",
      timeline: [
        { t: "10:00", d: "🛍️ Shopping Sainte-Catherine ou artisans" },
        { t: "12:00", d: "🍟 Dernière poutine (obligatoire)" },
        { t: "14:00", d: "📦 Valises, organisation retour" },
        { t: "16:00", d: "🚶 Dernière balade quartier préféré" },
        { t: "19:00", d: "🍽️ Dernière soirée Montréal" }
      ],
      highlights: ["🛍️ Souvenirs + sirop d'érable", "🍟 Dernière poutine !", "👋 Au revoir Montréal..."],
      hotelId: "montreal-fin", locationId: "montreal"
    },
    {
      day: 21, emoji: "✈️", from: "Montréal", to: "Nice", dist: "Vol", dur: "~8h",
      label: "Vol retour Montréal → Nice",
      timeline: [
        { t: "🌅", d: "✈️ Vol Montréal → Nice" }
      ],
      highlights: ["✈️ Retour avec des souvenirs plein la tête", "🌊 Niagara, check ✓"],
      hotelId: "maison", locationId: "nice"
    }
  ],
  hotels: [
    { id: "montreal", name: "Hébergement Montréal (arrivée)", city: "Montréal", emoji: "🏙️", type: "hotel", booked: false, note: "À réserver — 1 nuit (J1)" },
    { id: "quebec-city", name: "Hébergement Québec", city: "Québec City", emoji: "🏰", type: "hotel", booked: false, note: "À réserver — 2 nuits (J2-J3)" },
    { id: "mille-iles", name: "Hébergement Mille-Îles", city: "Gananoque", emoji: "⛵", type: "hotel", booked: false, note: "À réserver — 2 nuits (J4-J5)" },
    { id: "ottawa", name: "Hébergement Ottawa", city: "Ottawa", emoji: "🏛️", type: "hotel", booked: false, note: "À réserver — 2 nuits (J6-J7)" },
    { id: "toronto", name: "Hébergement Toronto", city: "Toronto", emoji: "🏙️", type: "hotel", booked: false, note: "À réserver — 3 nuits (J8-J10)" },
    { id: "niagara", name: "Hébergement Niagara Falls", city: "Niagara Falls", emoji: "🌊", type: "hotel", booked: false, note: "À réserver — 2 nuits (J11-J12)" },
    { id: "tobermory", name: "Hébergement Tobermory", city: "Tobermory", emoji: "🏖️", type: "hotel", booked: false, note: "À réserver — 2 nuits (J13-J14)" },
    { id: "algonquin", name: "Hébergement Algonquin", city: "Algonquin Park", emoji: "🌲", type: "hotel", booked: false, note: "À réserver — 2 nuits (J15-J16)" },
    { id: "montreal-fin", name: "Hébergement Montréal (fin)", city: "Montréal", emoji: "🏙️", type: "hotel", booked: false, note: "À réserver — 5 nuits (J17-J21)" },
    { id: "maison", name: "🏠 Maison", city: "Nice", emoji: "🏠", type: "home" }
  ],
  lists: [],
  restaurants: [],
  culture: [
    {
      title: "🏰 Québec — Berceau de la Nouvelle-France",
      sub: "400 ans d'histoire française en Amérique • Vieux-Québec UNESCO",
      sections: [
        {
          h: "La seule ville fortifiée d'Amérique du Nord",
          p: "Québec est la seule ville au nord du Mexique à avoir conservé ses fortifications. Les remparts de 4,6 km datent du XVIIe siècle, renforcés par les Britanniques après la Conquête de 1759. Le Vieux-Québec est inscrit au patrimoine mondial UNESCO depuis 1985 — premier centre urbain nord-américain à recevoir cette distinction."
        },
        {
          h: "La Bataille des Plaines d'Abraham (1759)",
          p: "Le 13 septembre 1759, le général Wolfe et ses 4 500 hommes escaladent les falaises de nuit. La bataille ne dure que 15 minutes mais change l'histoire du continent. Montcalm et Wolfe meurent tous les deux. La France perd le Canada. Aujourd'hui c'est un parc urbain de 108 hectares — un des plus grands parcs urbains au monde, plus grand que Central Park."
        },
        {
          h: "Le Château Frontenac — L'hôtel le plus photographié au monde",
          p: "Construit en 1893 par le Canadien Pacifique, ce château-hôtel domine le Cap Diamant à 54 mètres au-dessus du fleuve. C'est ici que Churchill et Roosevelt ont planifié le débarquement de Normandie en 1943-44 (Conférences de Québec). 611 chambres, 18 étages, et une vue qui coupe le souffle sur le Saint-Laurent."
        },
        {
          h: "Le français au Québec — Résistance culturelle",
          p: "Le Québec compte 8,5 millions d'habitants dont 80% francophones. La loi 101 (1977) fait du français la seule langue officielle. Le québécois n'est pas du 'mauvais français' — c'est une évolution parallèle de la langue depuis 1763, avec des archaïsmes du XVIIe siècle ('icitte', 'astheure') et des néologismes créatifs ('courriel' avant 'email', 'magasiner' pour 'shopping')."
        }
      ]
    },
    {
      title: "⛵ Les Mille-Îles — Archipel des milliardaires",
      sub: "1 864 îles entre Ontario et New York • Fleuve Saint-Laurent",
      sections: [
        {
          h: "1 864 îles, une règle stricte",
          p: "Pour être une 'île' officiellement : minimum 1 pied carré de terre au-dessus de l'eau 365 jours par an + au moins un arbre vivant. Certaines font 100 km², d'autres à peine la taille d'une maison. Les plus petites ont littéralement UN arbre dessus — et elles comptent."
        },
        {
          h: "Boldt Castle — Un amour tragique",
          p: "George Boldt, propriétaire du Waldorf-Astoria NYC, construit un château de 120 pièces sur Heart Island pour sa femme Louise. En 1904, elle meurt subitement. Il arrête tout : 300 ouvriers renvoyés, le château abandonné inachevé pendant 73 ans. Aujourd'hui restauré, on peut le visiter côté américain (passeport obligatoire)."
        },
        {
          h: "La vinaigrette Thousand Islands",
          p: "Oui, la sauce doit son nom à CET archipel. La légende : Sophia LaLonde, femme d'un guide de pêche local, servait cette sauce rose aux touristes au début du 1900. Un acteur de Broadway la goûte, l'adore, ramène la recette à son hôtel — le Waldorf-Astoria de George Boldt. Boucle bouclée."
        }
      ]
    },
    {
      title: "🏛️ Ottawa — Capitale bilingue et biculturelle",
      sub: "Parlement, Canal Rideau UNESCO, ByWard Market",
      sections: [
        {
          h: "Pourquoi Ottawa ? Le compromis de la Reine Victoria",
          p: "En 1857, ni Montréal (trop française), ni Toronto (trop anglaise), ni Kingston, ni Québec ne font l'unanimité. Victoria choisit Bytown — petit village forestier sur la frontière Ontario/Québec. Raison stratégique : loin de la frontière américaine (leçon de 1812). La ville est renommée Ottawa, mot algonquin signifiant 'commercer'."
        },
        {
          h: "Le Canal Rideau — Plus vieille voie navigable d'Amérique du Nord",
          p: "202 km entre Ottawa et Kingston, construit en 1826-1832 par le Colonel By (d'où 'Bytown'). Objectif militaire : route d'approvisionnement alternative si les Américains coupent le Saint-Laurent. Jamais utilisé militairement — devenu récréatif. UNESCO depuis 2007. En hiver, 7,8 km deviennent la plus grande patinoire du monde."
        },
        {
          h: "Le bilinguisme en action",
          p: "Ottawa est la seule grande ville canadienne officiellement bilingue au quotidien. 37% de francophones (Gatineau juste en face), panneaux en deux langues, fonctionnaires fédéraux qui switchent de langue mid-phrase ('franglais' fédéral). Le Parlement débat dans les deux langues en temps réel — traduction simultanée obligatoire."
        }
      ]
    },
    {
      title: "🏙️ Toronto — Mégalopole multiculturelle",
      sub: "6,7M habitants • Plus grande ville du Canada • 200+ langues",
      sections: [
        {
          h: "La ville la plus diverse au monde",
          p: "51% des Torontois sont nés à l'étranger (record mondial pour une grande ville). Plus de 200 langues parlées. Le quartier de Scarborough à lui seul a 3 Chinatowns et 2 Little Indias. Toronto accueille 100 000 immigrants par an — c'est le principal moteur de croissance du Canada."
        },
        {
          h: "La CN Tower — 553 mètres d'histoire",
          p: "Plus haute structure autoportante du monde pendant 34 ans (1975-2010, détrônée par Burj Khalifa). Construite par Canadian National Railway pour résoudre les interférences TV/radio des nouveaux gratte-ciels. Le plancher de verre à 342m : 2,5 cm d'épaisseur, supporte 14 hippopotames. L'EdgeWalk à 356m : marche extérieure sans main courante (harnaché)."
        },
        {
          h: "Kensington Market — Le village bohème",
          p: "Ancien quartier juif d'Europe de l'Est (années 1920), devenu portugais (1950), puis caribéen (1970), puis le bazar multiculturel actuel. Pas de chaîne, pas de Starbucks — interdit par pression communautaire. Vintage, street food du monde entier, murales, et une atmosphère qu'aucun autre quartier canadien ne réplique."
        }
      ]
    },
    {
      title: "🌊 Niagara Falls — La force de la nature",
      sub: "3 160 tonnes d'eau/seconde • Frontière USA-Canada",
      sections: [
        {
          h: "Des chiffres vertigineux",
          p: "Les Horseshoe Falls (côté canadien, les plus impressionnantes) : 57 mètres de haut, 790 mètres de large. 3 160 tonnes d'eau par seconde en été. Mais ce n'est que la moitié — 50% du débit est détourné dans des tunnels pour l'hydroélectricité. La nuit, c'est 75% détourné. Les chutes reculent de 30 cm par an par érosion."
        },
        {
          h: "Les daredevils — Folie humaine",
          p: "Annie Edson Taylor, institutrice de 63 ans, est la première à survivre au plongeon en tonneau (1901). Depuis : 16 personnes ont tenté (5 morts). Un garçon de 7 ans a survécu sans protection en 1960 — aspiré par accident. Traversée sur fil par Blondin en 1859 : il s'arrêtait au milieu pour cuisiner une omelette. C'est illégal aujourd'hui (10 000$ d'amende)."
        },
        {
          h: "L'hydroélectricité — Nikola Tesla's legacy",
          p: "Tesla et Westinghouse construisent la première grande centrale AC au monde ici en 1895. L'électricité est transmise jusqu'à Buffalo (40 km) — prouvant la supériorité du courant alternatif sur le courant continu d'Edison. Aujourd'hui Niagara produit 4,4 GW — assez pour alimenter 3,8 millions de foyers."
        }
      ]
    },
    {
      title: "🌲 Algonquin Park — Le Grand Nord accessible",
      sub: "7 653 km² de nature sauvage • Créé en 1893 • 2 400 lacs",
      sections: [
        {
          h: "Le parc qui a inventé l'écotourisme canadien",
          p: "Troisième plus vieux parc provincial du Canada (1893). Objectif original : protéger les sources de 5 rivières majeures. 7 653 km² — plus grand que le Delaware. 2 400 lacs, 1 200 km de rivières. C'est ici que Tom Thomson (mentor du Groupe des Sept) a peint ses chefs-d'œuvre avant de mourir mystérieusement en 1917."
        },
        {
          h: "Les loups d'Algonquin",
          p: "Algonquin abrite la plus grande population de loups de l'Est (Canis lycaon) — une espèce distincte, endémique, en danger. Chaque jeudi d'août, le parc organise des 'wolf howls' : un naturaliste hurle et les meutes répondent. Record : 2 000 personnes silencieuses dans la nuit, écoutant les loups. Taux de succès ~80%."
        },
        {
          h: "Le Groupe des Sept — L'art national canadien",
          p: "Sept peintres (1920-1933) décident que l'art canadien doit refléter le paysage canadien, pas imiter l'Europe. Algonquin est leur terrain de jeu principal. Leurs toiles aux couleurs saturées — automne flamboyant, pins tourmentés, lacs miroirs — définissent encore aujourd'hui l'imaginaire visuel du Canada. Leurs œuvres valent des millions."
        }
      ]
    },
    {
      title: "🏙️ Montréal — La métropole créative",
      sub: "1,8M habitants • Deuxième ville francophone du monde • Festivals",
      sections: [
        {
          h: "Deuxième ville francophone au monde (après Kinshasa)",
          p: "Montréal n'est plus la première ville francophone après Paris depuis que Kinshasa (17M) l'a dépassée. Mais c'est la seule grande ville bilingue 'par la rue' — tu passes du français à l'anglais en traversant le boulevard Saint-Laurent. Le Mile End concentre artistes, startups et les meilleurs bagels du monde (St-Viateur vs Fairmount, guerre éternelle)."
        },
        {
          h: "La ville souterraine — RÉSO",
          p: "33 km de tunnels reliant 10 stations de métro, 2 gares, 1 600 commerces. Plus grand complexe souterrain au monde. Né de la nécessité : -30°C en hiver, il fallait pouvoir vivre sans sortir. 500 000 personnes y transitent quotidiennement. On peut y faire ses courses, aller au cinéma, travailler et manger sans voir le ciel."
        },
        {
          h: "Capitale mondiale des festivals",
          p: "Jazz Fest (le plus grand au monde, 2M de visiteurs), Juste pour Rire (le plus grand festival d'humour), FrancoFolies, Osheaga, Heavy MTL, POP Montréal... De mai à septembre, il y a un festival chaque semaine. Record Guinness : 'plus de festivals par habitant que n'importe quelle ville'. Montréal est classée Ville UNESCO de Design depuis 2006."
        },
        {
          h: "La poutine — Comfort food national",
          p: "Frites + fromage en grains (qui 'squeak' sous la dent) + sauce brune. Inventée en 1957 au Québec rural, longtemps méprisée par la haute gastronomie. Aujourd'hui déclinée en 100 variantes (foie gras, homard, smoked meat). La Banquise (ouverte 24h) en propose 30 sortes. Règle d'or : le fromage doit être frais du jour, sinon ce n'est pas de la vraie poutine."
        }
      ]
    }
  ]
};
