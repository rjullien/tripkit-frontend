var SEED_USA_2026 = {
  trip: {
    id: "usa-2026",
    name: "Road Trip USA 2026",
    emoji: "🇺🇸",
    routeUrl: "https://www.google.com/maps/dir/Los+Angeles,+CA/Las+Vegas,+NV/Chloride,+AZ/Grand+Canyon+Village,+AZ/Page,+AZ/Mesquite,+NV/Las+Vegas,+NV/Montreal,+QC,+Canada",
    mapImage: "map-overview-v2.jpg",
    startDate: "2026-04-16",
    endDate: "2026-05-06",
    travelers: [
      {
        name: "René",
        role: "owner"
      },
      {
        name: "Nicole"
      },
      {
        name: "Alexandre"
      },
      {
        name: "Dinah"
      },
      {
        name: "Laurine",
        leaveDate: "2026-04-27"
      }
    ],
    phases: [
      {
        name: "Road Trip (5)",
        days: [
          0,
          4
        ]
      },
      {
        name: "Google Next",
        days: [
          4,
          7
        ]
      },
      {
        name: "Road Trip (4)",
        days: [
          7,
          13
        ]
      },
      {
        name: "Montréal",
        days: [
          14,
          19
        ]
      }
    ],
    sharedLinks: [
      {
        url: "https://www.airbnb.fr/s/guidebooks?refinement_paths%5B%5D=%2Fguidebooks%2F3780102",
        label: "📍 Airbnb Guidebook",
        hotels: [
          "airbnb-page",
          "virgin-river-casino-hotel",
          "reilly-s-zion-hideaway",
          "ruby-s-inn"
        ]
      }
    ],
    users: {
      rjullien: {
        city: "Nice",
        locationId: "preparatifs",
        defaultConf: "rene"
      },
      "laurine-rol": {
        city: "Nice",
        locationId: "preparatifs",
        defaultConf: "laurine"
      },
      apej06: {
        city: "Paris",
        locationId: null
      },
      dinahdfrsn: {
        city: "Paris",
        locationId: null
      },
      BaptTF: {
        city: "Montréal",
        locationId: "montreal",
        startDay: 16,
        skipDays: [
          0
        ]
      },
      EmmaTF: {
        city: "Montréal",
        locationId: "montreal",
        startDay: 16,
        skipDays: [
          0
        ]
      },
      jlncamille: {
        city: "Langon",
        locationId: null,
        skipDays: [
          0
        ]
      }
    }
  },
  days: [
    {
      day: 0,
      emoji: "🧳",
      from: "Nice / Paris",
      to: "Préparatifs",
      dist: "0 km",
      dur: "-",
      label: "Veille de départ — Checklist & valises",
      timeline: [
        {
          t: "🌅",
          d: "Journée libre — derniers préparatifs"
        },
        {
          t: "18:00",
          d: "📦 Boucler les valises"
        },
        {
          t: "20:00",
          d: "📄 Vérifier documents (passeport, ESTA, billets)"
        },
        {
          t: "21:00",
          d: "📱 Téléphone chargé 100% + réveil tôt !"
        },
        {
          t: "22:00",
          d: "😴 Coucher tôt — grosse journée demain !"
        }
      ],
      highlights: [
        "✅ Chaussures de rando (OBLIGATOIRE)",
        "✅ Gourde + crème solaire SPF50+",
        "✅ Adaptateur prise US (Type A/B)",
        "✅ Glacière souple pliable",
        "⚠️ Dinah = passeport US, pas besoin d'ESTA",
        "🧳 <a href=\"checklist.html\">✅ Ma checklist valise (interactive)</a>",
        "🖨️ <a href=\"checklist-valise-rene-nicole.html\">Version imprimable René+Nicole</a> · <a href=\"checklist-valise-alex-dinah.html\">Alex+Dinah</a> · <a href=\"checklist-valise-laurine.html\">Laurine</a>"
      ],
      hotelId: "maison",
      locationId: "preparatifs",
      heroImages: {
        Nice: "https://images.unsplash.com/photo-1491166617655-0723a0999cfc?w=600&q=70",
        Paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=70",
        "Montréal": "https://images.unsplash.com/photo-1519178614-68673b201f36?w=600&q=70",
        Langon: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=600&q=70",
        _default: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=70"
      }
    },
    {
      day: 1,
      emoji: "✈️",
      from: "Las Vegas",
      to: "Chloride, AZ",
      dist: "141 km",
      dur: "1h35",
      label: "Arrivée Las Vegas → Chloride",
      mapUrl: "https://www.google.com/maps/dir/?api=1&destination=9827+2nd+Street,+Chloride,+AZ+86431",
      timeline: [
        {
          t: "04:45",
          d: "⏰ Réveil !"
        },
        {
          t: "05:15",
          d: "🚗 Anna arrive — VTC → Aéroport Nice T1"
        },
        {
          t: "07:20",
          d: "✈️ BA339 NCE→LHR — départ Nice T1 (René 16D, Nicole 29C, Laurine 21C)"
        },
        {
          t: "08:35",
          d: "🛬 Arrivée Londres Heathrow T5 <span style=\"opacity:.5\">(09:35 🇫🇷)</span>"
        },
        {
          t: "",
          d: "⏳ Correspondance 3h40 — duty free, café, stretching!"
        },
        {
          t: "11:00",
          d: "✈️ AF3581 CDG→Minneapolis — départ Paris T2E (Alex 51C, Dinah 51D) <span style=\"opacity:.5\">(11:00 🇫🇷)</span>"
        },
        {
          t: "12:15",
          d: "✈️ BA271 LHR→LAS — départ T5 (René 41A, Nicole 39C, Laurine 39E) <span style=\"opacity:.5\">(13:15 🇫🇷)</span>"
        },
        {
          t: "13:20",
          d: "🛬 Alex+Dinah arrivent Minneapolis <span style=\"opacity:.5\">(20:20 🇫🇷)</span>"
        },
        {
          t: "",
          d: "⏳ Correspondance 2h — immigration US + transit"
        },
        {
          t: "16:24",
          d: "✈️ AF2664 MSP→LAS — Alex+Dinah repartent <span style=\"opacity:.5\">(23:24 🇫🇷)</span>"
        },
        {
          t: "14:35",
          d: "🛬 Arrivée LAS groupe Nice! <span style=\"opacity:.5\">(23:35 🇫🇷)</span> — 🇺🇸 Bienvenue!"
        },
        {
          t: "15:30",
          d: "🚗 Récupération voiture Alamo (Skip the Counter!)"
        },
        {
          t: "16:00",
          d: "🛒 <a href=\"courses.html\">Courses Vons</a> — stock 3 jours + glacière !"
        },
        {
          t: "17:47",
          d: "🛬 Arrivée LAS Alex+Dinah! <span style=\"opacity:.5\">(02:47+1 🇫🇷)</span>"
        },
        {
          t: "18:50",
          d: "✅ DÉPART vers Chloride — tout le monde réuni! (pickup groupe Paris T1)"
        },
        {
          t: "20:25",
          d: "🏠 Arrivée Chloride"
        },
        {
          t: "20:45",
          d: "🍽️ Dîner (préparé sur place)",
          restaurantRef: 1
        }
      ],
      highlights: [
        "Ghost town Route 66 (300 habitants)",
        "Silence absolu vs Kingman (100 trains/jour)",
        "Fresques psychédéliques de Roy Purcell"
      ],
      hotelId: "shep-s-miners-inn",
      locationId: "chloride-az",
      heroImage: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&q=70",
      cards: [
        {
          type: "rental-pickup",
          title: "🎫 Pick-up Ticket Alamo",
          data: {
            confirmation: "[en DB]",
            ticketImage: "alamo-ticket.jpg",
            steps: [
              "Suivre **Baggage Claim** → sortir",
              "Prendre la **navette Shuttle Bus**",
              "Aller au parking Alamo → zone **Standard SUV**",
              "**Clés dans la voiture** → choisir le SUV",
              "À la gate : **montrer ce ticket** + permis Nicole + CB Visa ••••1278"
            ]
          }
        }
      ]
    },
    {
      day: 2,
      emoji: "🏜️",
      from: "Chloride",
      to: "Grand Canyon",
      dist: "315 km",
      dur: "3h20",
      label: "Grand Canyon South Rim",
      mapUrl: "https://www.google.com/maps/dir/?api=1&destination=Grand+Canyon+Village,+AZ&waypoints=Kingman,+AZ|Williams,+AZ",
      timeline: [
        {
          t: "06:30",
          d: "☀️ Visite de Chloride avant départ"
        },
        {
          t: "",
          d: "👀 <b>À voir à Chloride :</b> Fresques de Roy Purcell (1966, peintes avec de l'urine animale!), cimetière historique 1860s, Shep's Miners Inn, boutique Yesterdays, vieille locomotive, bureau de poste (1871) — <a href=\"https://www.google.com/maps/dir/9827+2nd+St,+Chloride,+AZ/Chloride+Post+Office,+Chloride,+AZ/Yesterdays+Restaurant,+Chloride,+AZ/35.4147,-114.1952/35.4083,-114.1882&dirflg=w\" target=\"_blank\">🚶 Walking Tour Google Maps</a>"
        },
        {
          t: "07:30",
          d: "🚗 DÉPART Chloride"
        },
        {
          t: "08:00",
          d: "📸 Arrêt photo Kingman Route 66"
        },
        {
          t: "08:10",
          d: "🍳 Petit-déj Mr. D'z Route 66 Diner",
          restaurantRef: 2
        },
        {
          t: "10:00",
          d: "🏘️ Arrêt Williams — Gateway to the Grand Canyon"
        },
        {
          t: "11:30",
          d: "Arrivée Grand Canyon South Rim"
        },
        {
          t: "11:45",
          d: "🎫 America the Beautiful Pass (80$)"
        },
        {
          t: "13:00",
          d: "Exploration viewpoints"
        },
        {
          t: "18:30",
          d: "🌅 Coucher de soleil Hopi Point"
        },
        {
          t: "19:30",
          d: "🍽️ Dîner El Tovar (réservé)",
          restaurantRef: 2
        }
      ],
      highlights: [
        "1,6 km de profondeur — 1,84 Md d'années"
      ],
      poem: {
        title: "🎭 Ode to the Canyon — For the Five who Wander",
        author: "Léa 🌙",
        lines: [
          "Upon the morrow, ere the dawn hath broke,",
          "From Chloride's ghostly lanes where silence spoke,",
          "Five travellers shall rise and westward turn,",
          "Where ancient stones in crimson splendour burn.",
          "",
          "Through Kingman first, on Route Sixty-Six,",
          "Where neon signs and memory intermix,",
          "At Mr. D'z, that diner chrome and bright,",
          "They'll break their fast in candy-coloured light.",
          "",
          "Then onward, through the desert's amber haze,",
          "Three hundred miles of Arizona blaze,",
          "Till suddenly — the Earth itself doth cleave,",
          "And mortal words fall short of what they weave.",
          "",
          "Behold! René, the captain of this quest,",
          "And Nicole, gentle compass of the West,",
          "Young Alexandre, whose bold and roving eye",
          "Shall trace each stratum of the ancient sky,",
          "",
          "Fair Dinah, born where English rivers flow,",
          "Now standing where the Colorado's low,",
          "And Laurine, laughing, fearless, camera raised —",
          "Five souls before the infinite, amazed.",
          "",
          "At Mather Point the void shall steal their breath,",
          "A mile of depth, two billion years from death,",
          "The Colorado, silver thread below,",
          "Hath carved this wound with patience, soft and slow.",
          "",
          "When twilight paints the western rim in gold,",
          "At Hopi Point, where countless suns have rolled,",
          "They'll dine at El Tovar, that storied hall,",
          "Where canyon winds sing anthems through the wall.",
          "",
          "So raise your glass, ye five, beneath the stars —",
          "The Grand Canyon knows not who you are,",
          "And yet tonight, upon its ancient stage,",
          "You write your names upon its newest page."
        ]
      },
      hotelId: "yavapai-lodge",
      locationId: "grand-canyon",
      heroImage: "https://images.unsplash.com/photo-1615551043360-33de8b5f410c?w=600&q=70"
    },
    {
      day: 3,
      emoji: "🌀",
      from: "Grand Canyon",
      to: "Page, AZ",
      dist: "217 km",
      dur: "2h30",
      label: "Route → Page + Horseshoe Bend",
      mapUrl: "https://www.google.com/maps/dir/?api=1&destination=74+Thunderbird+Avenue,+Page,+AZ+86040&waypoints=Navajo+Point,+Grand+Canyon,+AZ|Desert+View+Watchtower,+AZ|Little+Colorado+River+Gorge+Navajo+Tribal+Park,+AZ",
      timeline: [
        {
          t: "05:20",
          d: "🚶 Départ hôtel à pied vers Mather Point"
        },
        {
          t: "05:49",
          d: "🌅 LEVER DE SOLEIL — Mather Point"
        },
        {
          t: "06:30",
          d: "Retour hôtel, petit-déj"
        },
        {
          t: "07:40",
          d: "🚌 Check-out fait — bus Orange → South Kaibab"
        },
        {
          t: "08:15",
          d: "🥾 RANDO South Kaibab Trail"
        },
        {
          t: "08:45",
          d: "📸 Ooh Aah Point — vue 360°"
        },
        {
          t: "09:15",
          d: "⭐ CEDAR RIDGE — plateau panoramique"
        },
        {
          t: "09:35",
          d: "🔼 Remontée (340m D+, 45-60 min)"
        },
        {
          t: "10:30",
          d: "Bus retour Visitor Center → voiture"
        },
        {
          t: "12:00",
          d: "🚗 DÉPART Desert View Drive"
        },
        {
          t: "12:20",
          d: "📸 Arrêt viewpoint (10 min)"
        },
        {
          t: "12:35",
          d: "📸 Navajo Point — vue top ! Point le plus haut du South Rim"
        },
        {
          t: "12:45",
          d: "🏛️ Desert View Watchtower"
        },
        {
          t: "14:45",
          d: "🚗 DÉPART tour → direct Horseshoe Bend"
        },
        {
          t: "⚠️",
          d: "🕐 TIMEZONE NAVAJO : vos téléphones vont avancer d'1h en traversant la réserve Navajo (MDT, seule zone d'Arizona avec DST). Pas de panique — ça revient à la normale en arrivant à Page (MST)."
        },
        {
          t: "16:15",
          d: "🚗 Arrivée Horseshoe Bend parking ($10)"
        },
        {
          t: "16:20",
          d: "🚶 Marche vers le viewpoint (20 min)"
        },
        {
          t: "16:40",
          d: "⭐ HORSESHOE BEND (30 min)"
        },
        {
          t: "17:10",
          d: "Retour parking"
        },
        {
          t: "17:25",
          d: "🛒 Courses Safeway Page (650 Elm St)"
        },
        {
          t: "18:00",
          d: "🔑 Arrivée Airbnb (code dans app) — repos !"
        }
      ],
      poem: {
        title: "🌙 The Bend — Where Rivers Dream in Stone",
        author: "Léa 🌙",
        lines: [
          "Before the sun hath claimed the canyon's crown,",
          "Five pilgrims stand where silence weighs them down,",
          "At Mather Point the darkness lifts its veil —",
          "And all the world turns gold beyond the trail.",
          "",
          "They leave the rim where ancient giants sleep,",
          "Through Desert View, where painted cliffs run deep,",
          "The Watchtower stands, a sentinel of old,",
          "Where Navajo and starlight once were sold.",
          "",
          "Then southward still, through Arizona's haze,",
          "Past mesas burnt in prehistoric blaze,",
          "Until the town of Page appears below —",
          "A quiet stage for nature's greatest show.",
          "",
          "At eventide they walk the dusty trail,",
          "Where every step reveals a grander scale,",
          "And suddenly — the Earth falls clean away:",
          "Three hundred metres down, the waters play.",
          "",
          "The Colorado, trapped in its own art,",
          "Hath carved a horseshoe through the desert's heart,",
          "A perfect loop of emerald and rust,",
          "Where river bends to stone, and stone to dust.",
          "",
          "René exhales. Nicole forgets to speak.",
          "Alexandre leans above the canyon's cheek.",
          "Dinah frames the void with steady hand.",
          "And Laurine laughs — too vast to understand.",
          "",
          "The sun descends. The sandstone starts to glow.",
          "Above, the sky. Below, the river's flow.",
          "Between the two, five travellers stand and stare —",
          "Suspended between wonder and thin air."
        ]
      },
      hotelId: "airbnb-page",
      locationId: "page-az",
      heroImage: "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=600&q=70"
    },
    {
      day: 4,
      emoji: "✨",
      from: "Page, AZ",
      to: "Mesquite, NV",
      dist: "300 km",
      dur: "3h30",
      label: "Antelope Canyon + Coral Pink → Mesquite",
      mapUrl: "https://www.google.com/maps/dir/?api=1&destination=148+6th+Ave,+Page,+AZ+86040",
      mapUrl2: "https://www.google.com/maps/dir/?api=1&destination=100+Pioneer+Blvd,+Mesquite,+NV+89027&waypoints=Coral+Pink+Sand+Dunes+State+Park,+UT|Hildale,+UT",
      timeline: [
        {
          t: "08:00",
          d: "🥞 American breakfast à l'Airbnb",
          restaurantRef: 4
        },
        {
          t: "09:30",
          d: "🧳 Rangement + vaisselle"
        },
        {
          t: "10:00",
          d: "Check-out Airbnb"
        },
        {
          t: "11:35",
          d: "Check-in Antelope Canyon (45 min avant!) — <a href=\"https://www.google.com/maps/dir/?api=1&destination=148+6th+Ave,+Page,+AZ+86040\" target=\"_blank\">📍 Nav Antelope</a>"
        },
        {
          t: "12:20",
          d: "⭐ UPPER ANTELOPE CANYON"
        },
        {
          t: "14:30",
          d: "DÉPART vers Mesquite — <a href=\"https://www.google.com/maps/dir/?api=1&destination=100+Pioneer+Blvd,+Mesquite,+NV+89027&waypoints=Coral+Pink+Sand+Dunes+State+Park,+UT|Hildale,+UT\" target=\"_blank\">📍 Nav Mesquite</a>"
        },
        {
          t: "16:20",
          d: "⭐ CORAL PINK SAND DUNES (30 min)"
        },
        {
          t: "17:35",
          d: "☕ Arrêt 10 min — Zion's Cozy Cabins, Colorado City/Hildale"
        },
        {
          t: "19:10",
          d: "Arrivée Mesquite"
        },
        {
          t: "19:45",
          d: "🌮 Dîner Los Lupes — mexicain authentique (margaritas!)",
          restaurantRef: 4
        }
      ],
      highlights: [
        "Light beams Antelope 12h20 (créneau parfait)",
        "Dunes roses uniques au monde",
        "Terre Navajo sacrée"
      ],
      hotelId: "virgin-river-casino-hotel",
      locationId: "mesquite-nv",
      heroImage: "https://images.unsplash.com/photo-1506792006437-256b665541e2?w=600&q=70"
    },
    {
      day: 5,
      emoji: "🎰",
      from: "Mesquite, NV",
      to: "Las Vegas",
      dist: "160 km",
      dur: "1h50",
      label: "Valley of Fire → Vegas + Badge Pickup + KÀ",
      mapUrl: "https://www.google.com/maps/dir/?api=1&destination=3900+S+Las+Vegas+Blvd,+Las+Vegas,+NV+89119&waypoints=Valley+of+Fire+State+Park,+NV|Las+Vegas+North+Premium+Outlets,+Las+Vegas,+NV|3535+Las+Vegas+Blvd+S,+Las+Vegas,+NV+89109",
      timeline: [
        {
          t: "08:00",
          d: "🍳 Breakfast Virgin River Café",
          restaurantRef: 5
        },
        {
          t: "08:45",
          d: "🚗 DÉPART Mesquite"
        },
        {
          t: "09:45",
          d: "🔥 VALLEY OF FIRE (1h visite)"
        },
        {
          t: "12:45",
          d: "DÉPART Valley of Fire"
        },
        {
          t: "13:45",
          d: "🛍️ Las Vegas North Premium Outlets (3h) — <a href=\"https://www.premiumoutlets.com/outlet/las-vegas-north/stores\" target=\"_blank\">📱 Liste magasins</a>"
        },
        {
          t: "16:45",
          d: "🚗 Route Outlets → hôtels (30 min)"
        },
        {
          t: "17:15",
          d: "Check-in hôtels (Luxor + LINQ)"
        },
        {
          t: "18:30",
          d: "🚿 Douche + préparation"
        },
        {
          t: "19:30",
          d: "🚗 DÉPART hôtel → MGM Grand"
        },
        {
          t: "20:00",
          d: "🎭 SPECTACLE KÀ — MGM Grand — <a href=\"https://bienvenue.ka.cirquedusoleil.com/home/\" target=\"_blank\">📱 Guide KÀ</a>"
        }
      ],
      highlights: [
        "Valley of Fire — roches rouges 150 M ans"
      ],
      hotelId: "luxor-linq",
      locationId: "las-vegas",
      heroImage: "https://images.unsplash.com/photo-1518623001395-125242310d0c?w=600&q=70"
    },
    {
      day: 6,
      emoji: "☁️",
      from: "Las Vegas",
      dist: "0 km",
      dur: "-",
      label: "Google Cloud Next — Jour 1",
      timeline: [
        {
          t: "09:00",
          d: "🎤 KEYNOTE: The agentic cloud — Michelob ULTRA Arena"
        },
        {
          t: "11:00",
          d: "📋 Evolution of agent development (BRK1-043) — Oceanside B"
        },
        {
          t: "12:15",
          d: "📋 Pilot to profit: AI org with Gemini (BRK2-006) — South Seas F"
        },
        {
          t: "13:00",
          d: "⚡ Demystifying evals (EXPOLT200) — Expo Theater 2"
        },
        {
          t: "14:30",
          d: "📋 Generative UI (BRK2-066) — South Seas J"
        },
        {
          t: "15:00",
          d: "⚡ LLM Inference on GKE (DEVLT-301) — Developer Theater"
        },
        {
          t: "16:00",
          d: "⚡ Context engineering for agents (EXPOLT221) — Expo Theater 1"
        },
        {
          t: "17:00",
          d: "📋 Enterprise AI SDLC (BRK1-051) — South Seas D"
        },
        {
          t: "🌙",
          d: "🎸 Google Next at Night 🍻"
        },
        {
          t: "19:00",
          d: "🐙 GitHub Social Club @ The Oasis (Beach Club)"
        }
      ],
      highlights: [
        "🎫 Badge Pickup dès 7h (Mandalay Bay)",
        "Journée libre pour Nicole, Alex, Dinah"
      ],
      hotelId: "luxor-linq",
      locationId: "las-vegas",
      heroImage: "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=600&q=70",
      conference: {
        dayLabel: "Mercredi 22 avril",
        sessions: {
          rene: [
            {
              t: "09:00",
              title: "Opening keynote: The agentic cloud",
              badge: "keynote",
              code: "opening-keynote",
              shared: true,
              room: "Michelob ULTRA Arena"
            },
            {
              t: "11:00",
              title: "An inside look at the evolution of agent development",
              badge: "breakout",
              code: "BRK1-043",
              room: "Oceanside B"
            },
            {
              t: "12:15",
              title: "From pilot to profit: Build an AI-powered organization with Gemini",
              badge: "breakout",
              code: "BRK2-006",
              room: "South Seas F"
            },
            {
              t: "13:00",
              title: "Demystifying evals at the frontier of agentic development",
              badge: "lightning",
              code: "EXPOLT200",
              room: "Expo Theater 2"
            },
            {
              t: "14:30",
              title: "Personalize the user experience with generative UI",
              badge: "breakout",
              code: "BRK2-066",
              room: "South Seas J"
            },
            {
              t: "15:00",
              title: "LLM Inference on GKE for the rest of us",
              badge: "lightning",
              code: "DEVLT-301",
              room: "Developer Theater"
            },
            {
              t: "16:00",
              title: "Context engineering for agents",
              badge: "lightning",
              code: "EXPOLT221",
              shared: true,
              room: "Expo Theater 1"
            },
            {
              t: "17:00",
              title: "Enterprise AI SDLC powered by Gemini Enterprise",
              badge: "breakout",
              code: "BRK1-051",
              shared: true,
              room: "South Seas D"
            },
            {
              t: "16:30",
              title: "Welcome Happy Hour 🍻",
              badge: "party",
              code: "happy-hour",
              shared: true
            },
            {
              t: "19:00",
              title: "🐙 GitHub Social Club @ The Oasis",
              badge: "party",
              code: "github",
              shared: true
            }
          ],
          laurine: [
            {
              t: "09:00",
              title: "Opening keynote: The agentic cloud",
              badge: "keynote",
              code: "opening-keynote",
              shared: true,
              room: "Michelob ULTRA Arena"
            },
            {
              t: "11:30",
              title: "Agents in the CLI: Planning, delegation, and multi-agent execution",
              badge: "lightning",
              code: "EXPOLT219",
              room: "Expo Theater 1"
            },
            {
              t: "12:15",
              title: "Marketplace: Enabling the era of the agentic enterprise",
              badge: "breakout",
              code: "BRK2-009",
              room: "Mandalay Bay I"
            },
            {
              t: "13:30",
              title: "Long-Running Agents: The AI that never sleeps",
              badge: "lightning",
              code: "DEVLT-222",
              room: "Developer Theater"
            },
            {
              t: "14:45",
              title: "Accelerate AI adoption: Strategies for upskilling and managing change",
              badge: "breakout",
              code: "BRK1-011",
              room: "Oceanside C"
            },
            {
              t: "15:00",
              title: "Vibe coding and databases",
              badge: "bof",
              code: "BOF-028",
              room: "Lunch Café (L2)"
            },
            {
              t: "16:00",
              title: "Context engineering for agents",
              badge: "lightning",
              code: "EXPOLT221",
              shared: true,
              room: "Expo Theater 1"
            },
            {
              t: "17:00",
              title: "Enterprise AI SDLC powered by Gemini Enterprise",
              badge: "breakout",
              code: "BRK1-051",
              shared: true,
              room: "South Seas D"
            },
            {
              t: "16:30",
              title: "Welcome Happy Hour 🍻",
              badge: "party",
              code: "happy-hour",
              shared: true
            },
            {
              t: "19:00",
              title: "🐙 GitHub Social Club @ The Oasis",
              badge: "party",
              code: "github",
              shared: true
            }
          ]
        }
      }
    },
    {
      day: 7,
      emoji: "☁️",
      from: "Las Vegas",
      dist: "0 km",
      dur: "-",
      label: "Google Cloud Next — Jour 2 + Next at Night 🏟️",
      timeline: [
        {
          t: "08:00",
          d: "📋 The agentic shift in SDLC (BRK1-049) — Oceanside C"
        },
        {
          t: "09:15",
          d: "📋 From silos to synergy: AI-powered governments (BRK1-030) — South Seas F"
        },
        {
          t: "10:30",
          d: "🎤 KEYNOTE: Agents in the autonomous era — Michelob ULTRA Arena"
        },
        {
          t: "10:30",
          d: "🚶 CEC Check-In Desk (Bayside B) — arriver 30 min avant"
        },
        {
          t: "11:00",
          d: "🤝 MEETING AMADEUS / GOOGLE CLOUD — CEC Room 207 (25 min)<br>👤 Google: Vikas Anand (Dir Product Mgmt) + Ruben Schlesinger (Key Account Exec, host)<br>👤 Amadeus: Luc Viguié (Dir Strategic Partnerships) + René"
        },
        {
          t: "13:15",
          d: "📋 Generative UI: A2UI, AG-UI, MCP Apps (BRK2-094) — Oceanside B"
        },
        {
          t: "14:45",
          d: "🎵 Spotify LLM backend on TPUs/GPUs (BRK1-069) — Mandalay Bay F"
        },
        {
          t: "15:15",
          d: "⚡ Building reliable agents (DEVLT-218) — Developer Theater"
        },
        {
          t: "16:00",
          d: "🎯 Vibe coding → Rigor: Spec-driven dev (BRK2-151) — Mandalay Bay A"
        },
        {
          t: "17:00",
          d: "⚡ Context engineering (EXPOLT209) — Expo Theater 2"
        }
      ],
      highlights: [
        "Préparer départ Utah demain"
      ],
      hotelId: "luxor-linq",
      locationId: "las-vegas",
      heroImage: "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=600&q=70",
      conference: {
        dayLabel: "Jeudi 23 avril",
        sessions: {
          rene: [
            {
              t: "08:00",
              title: "The agentic shift in software development life cycle",
              badge: "breakout",
              code: "BRK1-049",
              shared: true,
              room: "Oceanside C"
            },
            {
              t: "09:15",
              title: "From silos to synergy: Architecting AI-powered governments",
              badge: "breakout",
              code: "BRK1-030",
              room: "South Seas F"
            },
            {
              t: "10:30",
              title: "Keynote: Get real: Agents in the autonomous era",
              badge: "keynote",
              code: "keynote-j2",
              shared: true,
              room: "Michelob ULTRA Arena"
            },
            {
              t: "10:30",
              title: "CEC Check-In (arriver 30 min avant meeting)",
              badge: "meeting",
              code: "cec-checkin",
              room: "Bayside B"
            },
            {
              t: "11:00",
              title: "Meeting AMADEUS / Google Cloud",
              badge: "meeting",
              code: "amadeus-meeting",
              room: "CEC Room 207"
            },
            {
              t: "13:15",
              title: "Generative UI for any agent, anywhere: A2UI, AG-UI, MCP Apps",
              badge: "breakout",
              code: "BRK2-094",
              room: "Oceanside B"
            },
            {
              t: "14:45",
              title: "Scaling open LLMs: Inside Spotify's LLM backend on TPUs/GPUs",
              badge: "breakout",
              code: "BRK1-069",
              room: "Mandalay Bay F"
            },
            {
              t: "15:15",
              title: "Building reliable agents",
              badge: "lightning",
              code: "DEVLT-218",
              room: "Developer Theater"
            },
            {
              t: "16:00",
              title: "From vibe coding to rigor: Spec-driven development with AI at scale",
              badge: "breakout",
              code: "BRK2-151",
              shared: true,
              room: "Mandalay Bay A"
            },
            {
              t: "17:00",
              title: "Build real-time AI agents with context engineering on Google Cloud",
              badge: "lightning",
              code: "EXPOLT209",
              room: "Expo Theater 2"
            },
            {
              t: "19:00",
              title: "🏟️ NEXT AT NIGHT @ Allegiant Stadium",
              badge: "party",
              code: "next-at-night",
              shared: true
            }
          ],
          laurine: [
            {
              t: "08:00",
              title: "The agentic shift in software development life cycle",
              badge: "breakout",
              code: "BRK1-049",
              shared: true,
              room: "Oceanside C"
            },
            {
              t: "09:15",
              title: "From pilot to production: Scaling Gemini with proven practices",
              badge: "breakout",
              code: "BRK2-085",
              room: "Oceanside B"
            },
            {
              t: "10:30",
              title: "Keynote: Get real: Agents in the autonomous era",
              badge: "keynote",
              code: "keynote-j2",
              shared: true,
              room: "Michelob ULTRA Arena"
            },
            {
              t: "11:00",
              title: "Agents that deliver outcomes",
              badge: "lightning",
              code: "EXPOLT220",
              room: "Expo Theater 1"
            },
            {
              t: "13:30",
              title: "Move off legacy tech: Unlock AI-first abilities with Work Transformation Set",
              badge: "breakout",
              code: "BRK1-008",
              room: "Banyan D"
            },
            {
              t: "16:00",
              title: "From vibe coding to rigor: Spec-driven development with AI at scale",
              badge: "breakout",
              code: "BRK2-151",
              shared: true,
              room: "Mandalay Bay A"
            },
            {
              t: "17:15",
              title: "Developer AI: Tools, tactics, and team adoption",
              badge: "breakout",
              code: "BRK1-047",
              room: "Lagoon F"
            },
            {
              t: "19:00",
              title: "🏟️ NEXT AT NIGHT @ Allegiant Stadium",
              badge: "party",
              code: "next-at-night",
              shared: true
            }
          ]
        }
      }
    },
    {
      day: 8,
      emoji: "🏡",
      from: "Las Vegas",
      to: "Hurricane, UT",
      dist: "190 km",
      dur: "2h00",
      label: "Fin conf → Hurricane (près Zion)",
      mapUrl: "https://www.google.com/maps/dir/?api=1&destination=2640+3560+West,+Hurricane,+UT+84737",
      timeline: [
        {
          t: "09:45",
          d: "⚡ Spec-driven dev with Gemini CLI (DEVLT-214) — Developer Theater"
        },
        {
          t: "10:15",
          d: "⚡ Automating UI with Gemini CLI, MCP & Skills (DEVLT-206) — Developer Theater"
        },
        {
          t: "11:00",
          d: "📋 Conductor for spec-driven dev (BRK2-074) — Mandalay Bay E"
        },
        {
          t: "12:30",
          d: "📋 Agentic workspace: Cloud Shell → Workstations (BRK2-083) — South Seas J"
        },
        {
          t: "13:45",
          d: "📋 Proto → Prod: reliable agents (BRK2-095) — Mandalay Bay D"
        },
        {
          t: "15:00",
          d: "🛠️ Fin conf — Récupération groupe"
        },
        {
          t: "16:00",
          d: "🚗 DÉPART Vegas"
        },
        {
          t: "⚠️",
          d: "Passage Utah = +1h (horloge avance)"
        },
        {
          t: "19:00",
          d: "Arrivée Hurricane"
        },
        {
          t: "20:00",
          d: "🛁 Jacuzzi (si demandé le matin!)"
        }
      ],
      highlights: [
        "5 sessions conf (dernière: 13:45-14:30)",
        "⚠️ Changement heure: on PERD 1h",
        "Farmhouse avec jacuzzi sous les étoiles",
        "⚠️ DINAH: prévenir les hôtes le matin pour chauffer le jacuzzi!"
      ],
      hotelId: "farmhouse-airbnb",
      locationId: "hurricane-ut",
      heroImage: "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=600&q=70",
      conference: {
        dayLabel: "Vendredi 24 avril",
        sessions: {
          rene: [
            {
              t: "09:30",
              title: "Meeting NVIDIA — Romuald Josien + Luc Viguié (Amadeus)",
              badge: "meeting",
              code: "nvidia-meeting",
              room: "NVIDIA Booth #1401"
            },
            {
              t: "09:45",
              title: "Spec-driven development for Google Cloud and Workspace with Gemini CLI",
              badge: "lightning",
              code: "DEVLT-214",
              shared: true,
              room: "Developer Theater",
              note: "Laurine couvre le début, René rejoint ~10:00"
            },
            {
              t: "10:15",
              title: "Automating the UI with Gemini CLI, MCP and Skills",
              badge: "lightning",
              code: "DEVLT-206",
              shared: true,
              room: "Developer Theater"
            },
            {
              t: "11:00",
              title: "Improve developer velocity using Conductor for spec-driven development",
              badge: "breakout",
              code: "BRK2-074",
              room: "Mandalay Bay E"
            },
            {
              t: "12:30",
              title: "Agentic workspace: Scale from Cloud Shell to Cloud Workstations",
              badge: "breakout",
              code: "BRK2-083",
              room: "South Seas J"
            },
            {
              t: "13:45",
              title: "From prototype to production: Hard-won lessons for advanced, reliable, and secure agents",
              badge: "breakout",
              code: "BRK2-095",
              room: "Mandalay Bay D"
            },
            {
              t: "15:00",
              title: "That's a Wrap! Show Closes 🎬",
              badge: "keynote",
              code: "wrap",
              shared: true
            }
          ],
          laurine: [
            {
              t: "08:30",
              title: "Beyond the pilot: Real lessons from AI experiments",
              badge: "breakout",
              code: "BRK2-185",
              room: "Breakers E"
            },
            {
              t: "09:45",
              title: "Spec-driven development for Google Cloud and Workspace with Gemini CLI",
              badge: "lightning",
              code: "DEVLT-214",
              shared: true,
              room: "Developer Theater"
            },
            {
              t: "10:15",
              title: "Automating the UI with Gemini CLI, MCP and Skills",
              badge: "lightning",
              code: "DEVLT-206",
              shared: true,
              room: "Developer Theater"
            },
            {
              t: "10:45",
              title: "Building AI agents with AI agents: Multi-agent PR roaster",
              badge: "lightning",
              code: "DEVLT-221",
              room: "Developer Theater"
            },
            {
              t: "11:00",
              title: "Agent context engineering for production",
              badge: "breakout",
              code: "BRK2-098",
              room: "Oceanside C"
            },
            {
              t: "12:30",
              title: "Transform meetings into outcomes using Google Workspace with Gemini",
              badge: "breakout",
              code: "BRK1-004",
              room: "Oceanside C"
            },
            {
              t: "13:45",
              title: "Stop searching, start deciding: Accelerating business decisions with Gemini",
              badge: "breakout",
              code: "BRK2-003",
              room: "South Seas B"
            },
            {
              t: "15:00",
              title: "That's a Wrap! Show Closes 🎬",
              badge: "keynote",
              code: "wrap",
              shared: true
            }
          ]
        }
      }
    },
    {
      day: 9,
      emoji: "⛰️",
      from: "Hurricane, UT",
      to: "Orderville",
      dist: "110 km",
      dur: "2h30",
      label: "Zion (Angel's Landing)",
      mapUrl: "https://www.google.com/maps/dir/?api=1&destination=390+W+Prickly+Pear+Circle,+Orderville,+UT+84758&waypoints=Zion+National+Park,+UT",
      timeline: [
        {
          t: "08:25",
          d: "☕ Départ Hurricane — <a href=\"https://www.google.com/maps/dir/?api=1&destination=Zion+National+Park+Visitor+Center,+Springdale,+UT\" target=\"_blank\" style=\"color:#4ecdc4;\">📍 Nav Zion</a>"
        },
        {
          t: "09:00",
          d: "Arrivée Zion, navette"
        },
        {
          t: "09:15",
          d: "⭐ ANGEL'S LANDING — rando 4-6h (chaînes!) • Permis 9h-12h = heure départ Grotto (PAS en haut) ✅ • Rangers contrôlent n'importe où sur le sentier • <a href=\"angels-landing-permit.jpg\" target=\"_blank\" style=\"color:#4ecdc4;text-decoration:underline;\">🎫 Voir le permis (#[PERMIS])</a>"
        },
        {
          t: "13:30",
          d: "Déjeuner picnic dans le parc",
          restaurantRef: 9
        },
        {
          t: "15:00",
          d: "Récup voiture, sortie Zion"
        },
        {
          t: "15:30",
          d: "Traversée tunnel Zion → Mt Carmel — <a href=\"https://www.google.com/maps/dir/?api=1&destination=Zion-Mount+Carmel+Tunnel,+UT\" target=\"_blank\" style=\"color:#4ecdc4;\">📍 Nav Tunnel</a>"
        },
        {
          t: "16:15",
          d: "Check-in cabane — <a href=\"https://www.google.com/maps/dir/?api=1&destination=390+W+Prickly+Pear+Circle,+Orderville,+UT+84758\" target=\"_blank\" style=\"color:#4ecdc4;\">📍 Nav Cabane</a>"
        }
      ],
      highlights: [
        "21 lacets Walter's Wiggles"
      ],
      hotelId: "reilly-s-zion-hideaway",
      locationId: "orderville",
      heroImage: "https://images.unsplash.com/photo-1501908734255-16579c18c25f?w=600&q=70"
    },
    {
      day: 10,
      emoji: "🔮",
      from: "Orderville",
      to: "Bryce Canyon",
      dist: "100 km",
      dur: "1h15",
      label: "Bryce Canyon — Hoodoos",
      mapUrl: "https://www.google.com/maps/dir/?api=1&destination=Bryce+Canyon+National+Park,+UT",
      timeline: [
        {
          t: "11:00",
          d: "Check-out cabane Orderville"
        },
        {
          t: "11:30",
          d: "DÉPART vers Bryce (Thunderbird = breakfast fini à 11h, raté !)",
          restaurantRef: 10
        },
        {
          t: "12:38",
          d: "Arrivée Bryce Canyon"
        },
        {
          t: "13:30",
          d: "⭐ NAVAJO LOOP + QUEEN'S GARDEN"
        },
        {
          t: "17:00",
          d: "Exploration viewpoints"
        },
        {
          t: "18:30",
          d: "🌅 Coucher de soleil Sunset Point"
        },
        {
          t: "21:00",
          d: "🌌 Ciel étoilé (7 500 étoiles!)"
        }
      ],
      highlights: [
        "Hoodoos sculptés par la glace (200 cycles gel/an)",
        "Navajo Loop — descente parmi les colonnes"
      ],
      hotelId: "ruby-s-inn",
      locationId: "bryce-canyon",
      heroImage: "https://images.unsplash.com/photo-1527549993586-dff825b37782?w=600&q=70"
    },
    {
      day: 11,
      emoji: "👋",
      from: "Bryce Canyon",
      to: "Moab, UT",
      dist: "610 km",
      dur: "~7h route",
      label: "🚨 Bus en retard → St George → I-70 direct Moab",
      mapUrl: "https://www.google.com/maps/dir/?api=1&destination=1551+North+Highway+191,+Moab,+UT+84532&waypoints=1275+E+Red+Hills+Parkway,+St+George,+UT",
      timeline: [
        {
          t: "08:45",
          d: "🍳 Buffet Ruby's Inn (dernier avec Laurine)"
        },
        {
          t: "09:30",
          d: "🏊 Piscine + salle de sport"
        },
        {
          t: "11:00",
          d: "🚗 DÉPART Bryce → Beaver (Exit 112) — <a href=\"https://www.google.com/maps/dir/?api=1&destination=Crazy+Cow+Cafe,+1451+N+300+W,+Beaver,+UT\" target=\"_blank\" style=\"color:#4ecdc4;\">📍 Nav Crazy Cow</a>"
        },
        {
          t: "12:15",
          d: "Arrivée Beaver (Exit 112)"
        },
        {
          t: "12:30",
          d: "🍽️ Dernier repas — Crazy Cow Cafe (#1 Beaver, ⭐4.5) — <a href=\"https://www.google.com/maps/dir/?api=1&destination=Crazy+Cow+Cafe,+Beaver,+UT\" target=\"_blank\" style=\"color:#4ecdc4;\">📍 Nav Resto</a><br>🐄 Burgers, American diner",
          restaurantRef: 11
        },
        {
          t: "13:35",
          d: "⏳ Bus Salt Lake Express prévu (réf: 9103425) — ❌ EN RETARD"
        },
        {
          t: "14:30",
          d: "🚗 Bus toujours pas là — on conduit Laurine à St George ! (~1h30 via I-15 S)"
        },
        {
          t: "16:02",
          d: "Arrivée St George — dépôt shuttle <a href=\"https://www.google.com/maps/dir/?api=1&destination=1275+E+Red+Hills+Parkway,+St+George,+UT+84770\" target=\"_blank\" style=\"color:#4ecdc4;\">📍 1275 E Red Hills Pkwy</a>"
        },
        {
          t: "16:15",
          d: "👋 <b>Au revoir Laurine</b> — dépôt au shuttle STG<br><br>🚐 <b>16:40 MDT</b> — Shuttle STG (réf: #4030382) — $43.90<br>📍 1275 E Red Hills Parkway, St George, UT 84770<br>↳ St George → LAS (drop-off T1 puis T3)<br>🛬 <b>17:50 PDT</b> — Arrivée LAS Airport Terminal 3 <span style=\"opacity:.6\">(= 18:50 MDT)</span><br>✈️ <b>22:10 PDT</b> — Vol BA274 LAS → London Heathrow T5 (réf: ZI53GQ) <span style=\"opacity:.6\">(= 23:10 MDT)</span> • Marge 4h20 ✅<br>🛬 <b>16:05 (+1)</b> — Arrivée Heathrow (28 avril) <span style=\"opacity:.6\">(= 09:05 MDT)</span><br>✈️ <b>17:25</b> — Vol BA336 LHR → Nice T1 <span style=\"opacity:.6\">(= 10:25 MDT)</span><br>🏠 <b>20:40</b> — Arrivée Nice 🇫🇷 (28 avril) <span style=\"opacity:.6\">(= 12:40 MDT)</span>",
          type: "departure",
        },
        {
          t: "16:19",
          d: "🚗 <b>DÉPART St George → Moab</b> (I-15 N → I-70 E → US-191 S) — <a href=\"https://www.google.com/maps/dir/?api=1&destination=1551+North+Highway+191,+Moab,+UT+84532\" target=\"_blank\" style=\"color:#4ecdc4;\">📍 Nav Moab</a>"
        },
        {
          t: "17:40",
          d: "📍 Retour Exit 112 (Beaver) — reprise I-15 N"
        },
        {
          t: "~18:45",
          d: "🍽️ Dîner — Denny's Salina (1h) — <a href=\"https://www.google.com/maps/dir/?api=1&destination=1602+S+State+St,+Salina,+UT+84654\" target=\"_blank\" style=\"color:#4ecdc4;\">📍 Nav Denny's</a>",
          restaurantRef: 11
        },
        {
          t: "20:01",
          d: "🚗 Reprise route → Moab (~2h15)"
        },
        {
          t: "~22:15",
          d: "🏨 Arrivée Aarchway Inn, Moab"
        }
      ],
      highlights: [
        "🚨 Bus en retard → conduit Laurine à St George",
        "Shuttle STG #4030382 St George → LAS T3"
      ],
      departures: [
        {
          traveler: "Laurine",
          emoji: "👋",
          color: "#f0a500",
          subtitle: "Bus en retard à Beaver → conduit Laurine à St George — shuttle STG vers LAS",
          steps: [
            {
              time: "12:30",
              desc: "🍽️ Déjeuner Crazy Cow Cafe (Beaver, Exit 112)"
            },
            {
              time: "13:35",
              desc: "⏳ Bus Salt Lake Express prévu — ❌ EN RETARD"
            },
            {
              time: "14:30",
              desc: "🚗 On conduit Laurine à St George (~1h30)"
            },
            {
              time: "16:02",
              desc: "🚗 Arrivée dépôt shuttle (1275 E Red Hills Pkwy)"
            },
            {
              time: "16:15",
              desc: "👋 Au revoir Laurine !"
            },
            {
              time: "16:40 MDT",
              desc: "🚐 Shuttle STG #4030382 → LAS ($43.90)"
            },
            {
              time: "",
              desc: "↳ St George → LAS (drop-off T1 puis T3)"
            },
            {
              time: "17:50 PDT",
              desc: "🛬 Arrivée LAS Airport Terminal 3"
            },
            {
              time: "22:10 PDT",
              desc: "✈️ Vol BA274 LAS → Heathrow T5 (réf: ZI53GQ) • Marge 4h20 ✅"
            },
            {
              time: "16:05 (+1)",
              desc: "🛬 Arrivée Heathrow (28 avril)"
            },
            {
              time: "17:25",
              desc: "✈️ Vol BA336 LHR → Nice T1"
            },
            {
              time: "20:40",
              desc: "🏠 Arrivée Nice 🇫🇷 (28 avril)"
            }
          ],
          footer: "🚐 Shuttle STG — 1275 E Red Hills Pkwy, St George → LAS T3"
        }
      ],
      hotelId: "aarchway-inn",
      locationId: "moab-ut",
      heroImage: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600&q=70"
    },
    {
      day: 12,
      emoji: "🪨",
      from: "Moab",
      dist: "~50 km",
      dur: "-",
      label: "Arches National Park",
      mapUrl: "https://www.google.com/maps/dir/?api=1&destination=Moab,+UT&waypoints=The+Windows+Section,+Arches+National+Park,+UT|Double+Arch,+Arches+National+Park,+UT|Balanced+Rock,+Arches+National+Park,+UT|Devils+Garden+Trailhead,+Arches+National+Park,+UT|Park+Avenue+Trailhead,+Arches+National+Park,+UT|Delicate+Arch+Trailhead,+Arches+National+Park,+UT",
      timeline: [
        {
          t: "07:30",
          d: "🍳 Buffet Aarchway Inn",
          restaurantRef: 12
        },
        {
          t: "08:30",
          d: "🚗 Départ → Entrée Arches NP (3 km)"
        },
        {
          t: "08:45",
          d: "🏜️ Park Avenue",
          note: "Recommandé • Facile • 1.6 km one-way • 30 min\nPremier arrêt après l'entrée. Canyon entre murs de grès géants, ambiance Manhattan en rouge. Frais le matin."
        },
        {
          t: "09:30",
          d: "📸 Balanced Rock",
          note: "Photo stop • Facile • 500 m • 15 min\nRocher de 3 600 tonnes en équilibre. Tour rapide autour."
        },
        {
          t: "10:00",
          d: "🏆 Windows Section + Double Arch",
          note: "⭐ INCONTOURNABLE • Facile • 1.6 km boucle • 45 min\n3 arches massives et photogéniques. North Window + South Window + l'immense Double Arch."
        },
        {
          t: "11:15",
          d: "🚗 Route vers Devils Garden (20 min, bout de la route nord)"
        },
        {
          t: "11:45",
          d: "🏆 Devils Garden → Landscape Arch",
          note: "⭐ INCONTOURNABLE • Facile • 2.6 km A/R • 1h\nL'arche la + longue au monde (93m!). Sentier plat bien balisé. Un morceau s'est effondré en 1991."
        },
        {
          t: "13:00",
          d: "🏖️ Sand Dune Arch",
          note: "Nice to do • Facile • 500 m A/R • 15 min\nPetite arche cachée entre deux murs, sol de sable fin. Parking sur la route retour depuis Devils Garden."
        },
        {
          t: "13:30",
          d: "🍔 Milt's Stop & Eat — burgers depuis 1954",
          note: "Institution de Moab. Cash only! Retour en ville pour déjeuner."
        },
        {
          t: "15:00",
          d: "🏊 Pause hôtel — piscine + hot tub",
          note: "Repos avant Delicate Arch. Rechargez eau + snacks."
        },
        {
          t: "18:00",
          d: "🚗 Départ Delicate Arch Trailhead",
          note: "Prendre: 2L eau/pers, lampe frontale, crème solaire, chapeau."
        },
        {
          t: "18:30",
          d: "⭐ DELICATE ARCH — rando sunset",
          note: "🏆 #1 INCONTOURNABLE • Modéré-dur • 4.8 km A/R • 1h30 montée\nL'ICÔNE de l'Utah. Montée exposée sans ombre, slickrock. Au sunset = magique, LA photo du voyage.\n⚠️ Frontale obligatoire pour descente (nuit noire). Bon grip aux pieds."
        },
        {
          t: "20:00",
          d: "🌅 Sunset au sommet (20h07)",
          note: "Rester 15-20 min pour les couleurs. Redescente ~45 min dans le noir."
        },
        {
          t: "21:15",
          d: "🍽️ Dîner Moab",
          restaurantRef: 12
        }
      ],
      highlights: [
        "🏆 #1 Delicate Arch — sunset (4.8 km, modéré-dur, 1h30)",
        "🏆 #2 Landscape Arch — 93m, la + longue au monde (2.6 km, facile)",
        "🏆 #3 Windows + Double Arch — 3 arches massives (1.6 km, facile)",
        "📸 Balanced Rock — photo stop rapide",
        "🏜️ Park Avenue — canyon grès géants",
        "🏖️ Sand Dune Arch — arche cachée dans le sable"
      ],
      hotelId: "aarchway-inn",
      locationId: "moab-ut",
      heroImage: "https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=600&q=70",
      cards: [
        {
          type: "info",
          title: "👕 Vêtements & équipement",
          body: "🌡️ 7°C matin → 20°C après-midi, couvert, UV 8\n\n**Matin (8h30-12h) :** Polaire légère + t-shirt technique dessous. Pantalon rando ou short+legging.\n**Après-midi :** T-shirt suffit, short OK.\n**Delicate Arch sunset (18h30-21h) :** ⚠️ Reprendre la polaire ! Ça redescend vite (~10°C après sunset).\n\n**Essentiel :**\n🧢 Chapeau/casquette (UV 8 même couvert)\n🕶️ Lunettes de soleil\n👟 Chaussures bon grip (slickrock !)\n🧴 Crème solaire\n💧 2L eau/personne minimum\n🔦 Lampe frontale (descente Delicate Arch de nuit)\n🥪 Snacks énergie pour les randos"
        }
      ]
    },
    {
      day: 13,
      emoji: "🏔️",
      from: "Moab, UT",
      to: "Denver, CO",
      dist: "570 km",
      dur: "5h30",
      label: "Moab → Denver (via I-70)",
      mapUrl: "https://www.google.com/maps/dir/?api=1&destination=2800+Curtis+St,+Denver,+CO+80205&waypoints=Grand+Junction,+CO",
      timeline: [
        {
          t: "07:15",
          d: "🍳 Buffet Aarchway Inn (dernier !)",
          restaurantRef: 13
        },
        {
          t: "08:15",
          d: "🚗 DÉPART Moab → Denver (570 km, ~6h de route)"
        },
        {
          t: "11:00",
          d: "🚗 Montée vers les Rocheuses — paysages alpins !"
        },
        {
          t: "13:00",
          d: "🏔️ LOVELAND PASS (3 655m / 11 990 ft) — sortie I-70 exit 205 (Silverthorne), prendre US-6 Est. Parking au sommet, panneau Continental Divide, vue 360° Rocheuses ! ⚠️ Route sinueuse. Arrêt 10-15 min photos.",
          culture: {
            icon: "🏔️",
            title: "Loveland Pass — Continental Divide",
            text: "À 3 655m, plus haut col routier du Colorado ouvert toute l'année. Ligne de partage des eaux : ouest → Pacifique, est → Atlantique. Avant le tunnel Eisenhower (1973), TOUT le trafic I-70 passait par ici ! Route US-6 depuis 1943."
          }
        },
        {
          t: "13:15",
          d: "🚗 Descente côté est vers Idaho Springs"
        },
        {
          t: "13:30",
          d: "🏠 GEORGETOWN — ville minière victorienne (arrêt 15 min, balade Main Street)"
        },
        {
          t: "13:45",
          d: "🚗 Georgetown → Idaho Springs (10 min)"
        },
        {
          t: "14:00",
          d: "🍕 DÉJEUNER Idaho Springs (sortie 241) — 🥇 Beau Jo's Pizza : institution du Colorado depuis 1973 ! Pizza Colorado-style (croûte épaisse + miel). 🥈 Tommyknocker Brewery : brewpub, burgers, bières maison. Village minier historique !",
          restaurantRef: 13
        },
        {
          t: "15:25",
          d: "🚗 Idaho Springs → Walmart Lakewood (40 min)"
        },
        {
          t: "16:00",
          d: "🛒 WALMART Lakewood (7455 W Colfax Ave) — courses/ravitaillement"
        },
        {
          t: "16:30",
          d: "🛍️ Shopping valises — Ross, Walmart... (2h30 de chasse au carry-on AF-compatible !)"
        },
        {
          t: "19:00",
          d: "🔑 Arrivée + Check-in Airbnb (Curtis St) — clé sous le tapis côté droit 28th St. ⚠️ Chien Sapphire — fermer le portail !"
        },
        {
          t: "19:15",
          d: "🚇 TRANSPORT DENVER — 💳 CB sans contact (Apple Pay/Google Pay) directement sur le valideur ! $3/trajet (3h de correspondances incluses). Station la plus proche : 38th & Blake (5 min à pied). FREE MallRide = bus GRATUIT sur 16th Street Mall !"
        },
        {
          t: "19:15",
          d: "🚶 Repos + installation (19:15-19:40)"
        },
        {
          t: "19:40",
          d: "🍺 Sortie soirée RiNo District — Denver = 400+ brasseries !"
        },
        {
          t: "20:30",
          d: "🍽️ Dîner Denver",
          restaurantRef: 13
        }
      ],
      hotelId: "airbnb-denver",
      locationId: "denver-co",
      heroImage: "https://images.unsplash.com/photo-1503424886307-b090341d25d1?w=600&q=70"
    },
    {
      day: 14,
      emoji: "🎉",
      from: "Denver",
      dist: "0 km",
      dur: "-",
      label: "Journée libre Denver — Dernier jour",
      timeline: [
        {
          t: "",
          d: "🚇 TRANSPORT : Station 38th & Blake (5 min) → Union Station (1 arrêt, $3). Bus/tram = CB sans contact. FREE MallRide sur 16th St Mall. Uber downtown ~$10."
        },
        {
          t: "08:30",
          d: "🍳 Snooze (brunch spot)",
          restaurantRef: 14
        },
        {
          t: "10:00",
          d: "🏛️ Colorado State Capitol (marche du Mile High!)"
        },
        {
          t: "12:00",
          d: "⭐ DENVER MINT — visite gratuite (#KkbHTT)"
        },
        {
          t: "12:30",
          d: "Déjeuner Downtown / Union Station",
          restaurantRef: 14
        },
        {
          t: "14:00",
          d: "Après-midi au choix"
        },
        {
          t: "19:30",
          d: "🍽️ DERNIER DÎNER ENSEMBLE",
          restaurantRef: 14
        }
      ],
      highlights: [
        "Denver Mint: milliards de pièces/an",
        "Dernier dîner — green chili & craft beer"
      ],
      hotelId: "airbnb-denver",
      locationId: "denver-co",
      heroImage: "https://images.unsplash.com/photo-1546156929-a4c0ac411f47?w=600&q=70",
      cards: [
        {
          type: "rental-return",
          title: "🚗 Retour voiture — Denver Airport",
          data: {
            company: "Alamo",
            location: "Denver Intl Airport (DEN)",
            address: "24530 E 78th Ave, Denver CO 80249",
            returnBefore: "11:00",
            phone: "+1 833-828-5714",
            fuelPolicy: "Rendre le plein (sinon surfacturé)",
            mapUrl: "https://www.google.com/maps/place/Alamo+Rent+A+Car+-+Denver+International+Airport+(DEN)/@39.8367804,-104.7011195,754m",
            carplayUrl: "comgooglemaps://?daddr=39.8367804,-104.7011195&directionsmode=driving"
          }
        }
      ]
    },
    {
      day: 15,
      emoji: "✈️",
      from: "Denver",
      to: "✈️ Retour",
      dist: "50 km",
      dur: "0h45",
      label: "Vols retour — Fin du voyage!",
      mapUrl: "https://www.google.com/maps/dir/2800+Curtis+St,+Denver,+CO+80205/Denver+Airport+Car+Rental+Center,+24530+E+78th+Ave,+Denver,+CO+80249/Denver+International+Airport",
      timeline: [
        {
          t: "06:45",
          d: "🍳 Dernier petit-déj ensemble",
          restaurantRef: 15
        },
        {
          t: "07:30",
          d: "🧳 Check-out Airbnb (clé sous le tapis, fermer portail ⚠️ Sapphire)"
        },
        {
          t: "07:45",
          d: "🚗 DÉPART vers aéroport DEN (~45 min)"
        },
        {
          t: "08:00",
          d: "⛽ Plein essence (station Peña Blvd)"
        },
        {
          t: "08:15",
          d: "🧳 DÉPOSE Alex+Dinah + TOUS les bagages au terminal (Level 5, portes 505-513 côté est). Ils attendent au café — vol Delta à 12h30, check-in vers 10h.",
          type: "departure",
        },
        {
          t: "08:20",
          d: "🚗 René+Nicole → Alamo Rental Car Center (5 min, allégés !). Garer allée Alamo, clés, inspection."
        },
        {
          t: "08:30",
          d: "🚌 Shuttle GRATUIT → Terminal (~15 min). Level 5, Island 4, portes 505-513."
        },
        {
          t: "08:45",
          d: "🛃 Check-in Air Canada (René+Nicole) + sécurité → Concourse A (train souterrain)"
        },
        {
          t: "11:25",
          d: "✈️ Vol AC1074 René+Nicole → Montréal (sièges 15A+15C, réf ZVGPRP) <span style=\"opacity:.5\">(13:25 🇨🇦 · 19:25 🇫🇷)</span>"
        },
        {
          t: "12:30",
          d: "✈️ Vol Alexandre+Dinah → Paris <span style=\"opacity:.5\">(14:30 🇨🇦 · 20:30 🇫🇷)</span>"
        },
        {
          t: "17:07",
          d: "🛬 Atterrissage YUL Montréal <span style=\"opacity:.5\">(23:07 🇫🇷)</span>"
        },
        {
          t: "",
          d: "⚠️ Travaux majeurs autour de YUL — prévoir embouteillages + déviations pour le taxi!"
        },
        {
          t: "19:00",
          d: "🚕 Taxi → B&B Chez François (4027 Av. Papineau). Parking derrière (panneau BB). Entrée porte 4027 ou 4037, escalier ext. droit → 2e étage. ☎️ +1 514-239-4638"
        },
        {
          t: "18:30",
          d: "🍳 LA BANQUISE — poutine classique ou « La Matty »",
          restaurantRef: 15
        },
        {
          t: "",
          d: "💡 ALTERNATIVE si motivés : skip poutine → 🎭 IMPRO MOMENTUM à 20h (La Rocambolesque, Aux Angles Ronds, 5333 Bd St-Laurent) + petit truc à manger sur place. Billets : lepointdevente.com/tickets/impromomentum132"
        },
        {
          t: "20:00",
          d: "🌿 Promenade Parc Lafontaine (fontaine lumineuse !)"
        }
      ],
      highlights: [
        "2 524 km de souvenirs inoubliables"
      ],
      departures: [
        {
          traveler: "Alexandre + Dinah",
          emoji: "✈️",
          color: "#4ecdc4",
          subtitle: "Retour Paris via Salt Lake City",
          steps: [
            {
              time: "12:30",
              desc: "✈️ Vol AF2181 (Delta) DEN → Salt Lake City (réf: ZK46PW)"
            },
            {
              time: "14:01",
              desc: "🛬 Arrivée SLC — escale 1h24"
            },
            {
              time: "15:25",
              desc: "✈️ Vol AF3551 (Delta) SLC → Paris CDG"
            },
            {
              time: "09:30 (+1)",
              desc: "🛬 Arrivée Paris CDG T2E (2 mai)"
            }
          ],
          footer: "🎓 Dinah rentre la veille de la rentrée scolaire (3 mai)"
        }
      ],
      locationId: "denver-co",
      heroImage: "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=600&q=70"
    },
    {
      day: 16,
      emoji: "🎨",
      from: "Montréal",
      dist: "0 km",
      dur: "-",
      mapUrl: "https://www.google.com/maps/dir/4027+Avenue+Papineau,+Montr%C3%A9al/Mile+End,+Montr%C3%A9al/Oratoire+Saint-Joseph,+Montr%C3%A9al/Mont-Royal,+Montr%C3%A9al",
      label: "Street Art Mile End + Oratoire + Mont-Royal",
      timeline: [
        {
          t: "09:00",
          d: "🥯 Petit-déj léger — bagel à emporter ou petit truc sur St-Denis / Duluth (poutine de la veille oblige 😅). Options bagels : Fairmount Bagel (https://maps.app.goo.gl/vRFYuCkqVoJwwLNw8) ou St-Viateur Bagel (https://maps.app.goo.gl/B6ifngTm8ugkjaQdA)"
        },
        {
          t: "10:00",
          d: "🎨 PARCOURS STREET ART zone Plateau — métro Mont-Royal / Laurier. 📱 Guide : Art Public Montréal podcast \"Sur les murs du Plateau\" (artpublicmontreal.ca/parcours) + appli GPSmyCity + carte auto-guidée bumblingtourist.com (Mont-Royal → St-Laurent, 16 stops)"
        },
        {
          t: "12:30",
          d: "🍽️ Déjeuner — 3 options : 🥩 Schwartz's (3895 St-Laurent) / 🍕 La Panzeria (4084 St-Denis) / 🧆 Café Chez Téta (227 Rachel E)",
          restaurantRef: 16
        },
        {
          t: "14:00",
          d: "🚌 Bus 51 → ORATOIRE SAINT-JOSEPH (dôme + jardins + vue pano)"
        },
        {
          t: "15:30",
          d: "🚶 Marche (~1h) Oratoire → Belvédère Kondiaronk (vue skyline !)"
        },
        {
          t: "18:30",
          d: "🐷 AU PIED DE COCHON — poutine au foie gras ! (⚠️ sans Emma, rejoint peut-être vers 20h/20h30)",
          restaurantRef: 16
        }
      ],
      highlights: [
        "🎨 Street art: Bd St-Laurent = épicentre Festival Mural",
        "🌿 Ruelles vertes: passages cachés végétalisés + art communautaire",
        "📚 Drawn & Quarterly (211 Bernard O): librairie légendaire Mile End",
        "☕ Café Olimpico (124 St-Viateur O): THE café italien, terrasse mythique",
        "📸 Photo tip: escaliers en colimaçon du Plateau = typiquement montréalais",
        "🇯🇵 Semaine Japon (1-10 mai): parcours gourmand + rassemblement Shibas!",
        "🎭 Festival Jamais Lu (→9 mai): lectures théâtrales, Petite Italie",
        "🍽️ Au Québec: déjeuner=matin, dîner=midi, souper=soir!",
        "🗣️ Pantoute=pas du tout • C'est ben l'fun=super cool • Tiguidou!=parfait",
        "🗣️ Dépanneur=épicerie • Magasiner=shopping • Blonde/Chum=copine/copain",
        "🗣️ Attache ta tuque!=accroche-toi • Char=voiture • Icitte=ici"
      ],
      hotelId: "b-b-chez-francois",
      locationId: "montreal",
      heroImage: "https://images.unsplash.com/photo-1519178614-68673b201f36?w=600&q=70"
    },
    {
      day: 17,
      emoji: "🥁",
      from: "Montréal",
      dist: "0 km",
      dur: "-",
      mapUrl: "https://www.google.com/maps/dir/4027+Avenue+Papineau,+Montr%C3%A9al/Stade+Olympique+de+Montr%C3%A9al/Oratoire+Saint-Joseph,+Montr%C3%A9al/4027+Avenue+Papineau,+Montr%C3%A9al",
      label: "Stade Olympique + Jessica + Oratoire",
      timeline: [
        {
          t: "09:00",
          d: "🍳 Petit-déj B&B ou Ma Poule Mouillée",
          restaurantRef: 17
        },
        {
          t: "10:00",
          d: "🚇 RDV métro Papineau avec Baptiste & Emma"
        },
        {
          t: "10:30",
          d: "🚇 Métro → Viau — balade sous le Stade Olympique"
        },
        {
          t: "11:45",
          d: "👨👩👧👦 Chez Jessica (sœur d'Emma, proche Pie-IX)"
        },
        {
          t: "15:30",
          d: "⛪ Oratoire Saint-Joseph — coucher de soleil 🌅"
        },
        {
          t: "17:30",
          d: "🏔️ Mont-Royal belvédère (si le temps)"
        },
        {
          t: "18:30",
          d: "🍽️ Souper en ville — Schwartz's ou L'Express",
          restaurantRef: 17
        }
      ],
      highlights: [
        "Chez Jessica — moment famille",
        "Au Québec on soupe entre 18h et 20h30!"
      ],
      hotelId: "b-b-chez-francois",
      locationId: "montreal",
      heroImage: "https://images.unsplash.com/photo-1519178614-68673b201f36?w=600&q=70"
    },
    {
      day: 18,
      emoji: "🏛️",
      from: "Montréal",
      dist: "0 km",
      dur: "-",
      mapUrl: "https://www.google.com/maps/dir/4027+Avenue+Papineau,+Montr%C3%A9al/Parc+Jean-Drapeau,+Montr%C3%A9al/Vieux-Montr%C3%A9al/Centre-ville+de+Montr%C3%A9al",
      label: "Jean-Drapeau + Vieux-Montréal + Downtown",
      timeline: [
        {
          t: "09:00",
          d: "🍳 Petit-déj La Binerie ou B&B",
          restaurantRef: 18
        },
        {
          t: "10:00",
          d: "🏝️ PARC JEAN-DRAPEAU — vue skyline 📸"
        },
        {
          t: "11:30",
          d: "🚇 Métro Champ-de-Mars → Vieux-Montréal"
        },
        {
          t: "12:00",
          d: "🦫 Queue de castor + Basilique Notre-Dame"
        },
        {
          t: "12:30",
          d: "🍽️ Dîner dans le Vieux",
          restaurantRef: 18
        },
        {
          t: "14:00",
          d: "🏙️ Centre Eaton / Desjardins / Centre Bell / McGill (souterrains)"
        },
        {
          t: "15:00",
          d: "🚇 RÉSO + 🎨 Festival Art Souterrain"
        },
        {
          t: "18:00",
          d: "🍽️ Souper avec Baptiste (rejoint après stage)",
          restaurantRef: 18
        },
        {
          t: "19:30",
          d: "⚠️ Emma → cours d'impro (métro Laurier, 20h)"
        }
      ],
      highlights: [
        "Basilique Notre-Dame — Chapelle Sixtine du Nouveau Monde"
      ],
      hotelId: "b-b-chez-francois",
      locationId: "montreal",
      heroImage: "https://images.unsplash.com/photo-1519178614-68673b201f36?w=600&q=70"
    },
    {
      day: 19,
      emoji: "✈️",
      from: "Montréal",
      to: "✈️ Nice",
      dist: "6 500 km",
      dur: "~10h vol",
      label: "Jarry + Jean-Talon + Déjeuner Emma + Westmount + Vol",
      mapUrl: "https://www.google.com/maps/dir/4027+Avenue+Papineau,+Montr%C3%A9al,+QC/A%C3%A9roport+international+Pierre-Elliott-Trudeau+de+Montr%C3%A9al",
      timeline: [
        {
          t: "09:00",
          d: "🥯 Fairmount Bagel (rival de St-Viateur!)"
        },
        {
          t: "10:00",
          d: "🏞️ Parc Jarry — ambiance locale, jardins"
        },
        {
          t: "10:45",
          d: "🍅 Marché Jean-Talon — fromages, produits locaux!"
        },
        {
          t: "12:00",
          d: "📦 Check-out B&B"
        },
        {
          t: "12:30",
          d: "🍽️ DÉJEUNER AVEC EMMA (près métro Peel)",
          restaurantRef: 19
        },
        {
          t: "14:00",
          d: "🏠 Westmount — maisons victoriennes + Summit lookout"
        },
        {
          t: "15:30",
          d: "☕ Dernier café / emplettes"
        },
        {
          t: "17:00",
          d: "🚕 Direction YUL — ⚠️ prévoir large (travaux autour aéroport!)"
        },
        {
          t: "22:00",
          d: "✈️ Vol retour YUL → LHR → Nice"
        }
      ],
      highlights: [
        "Dernier jour à Montréal — profitez !"
      ],
      locationId: "montreal",
      heroImage: "https://images.unsplash.com/photo-1519178614-68673b201f36?w=600&q=70"
    },
    {
      day: 20,
      emoji: "🏠",
      from: "✈️ En vol",
      to: "Nice",
      dist: "6 500 km",
      dur: "~10h vol",
      label: "Retour — Londres → Nice",
      timeline: [
        {
          t: "00:00",
          d: "😴 En vol BA94 YUL→LHR (décollé 22h hier)"
        },
        {
          t: "09:40",
          d: "🛬 Atterrissage London Heathrow T5"
        },
        {
          t: "10:00",
          d: "☕ Transit Heathrow — 1h45 d'escale"
        },
        {
          t: "11:25",
          d: "✈️ Vol BA330 LHR→NCE (T5)"
        },
        {
          t: "14:35",
          d: "🛬 ARRIVÉE NICE T1 — bienvenue à la maison ! 🎉"
        },
        {
          t: "15:30",
          d: "🏠 Retour maison"
        },
        {
          t: "19:00",
          d: "🍷 Apéro de retour sur la terrasse 😌"
        }
      ],
      highlights: [
        "3 semaines, 2 pays, 19 jours d'aventure",
        "2 524 km de road trip + Montréal",
        "BA94 réf René: ZI56XP / Nicole: ZKW493"
      ],
      locationId: "preparatifs",
      heroImage: "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=600&q=70"
    }
  ],
  restaurants: {
    "1": {
      main: {
        name: "Sandwichs froids + micro-ondes",
        icon: "🥪",
        note: "Courses Vegas — frigo+micro-ondes, pas de cuisine",
        booked: true
      },
      alts: [
        {
          name: "Yesterdays",
          note: "Dans le Shep's Inn, 8h-17h 7j/7",
          stars: "—",
          price: "€"
        }
      ]
    },
    "2": {
      breakfast: "🍳 Mr. D'z Route 66 Diner (Kingman)",
      main: {
        name: "El Tovar Dining Room",
        icon: "🍽️",
        note: "Dîner historique depuis 1905 — 19h30, 5 pers.",
        booked: true,
        maps: "https://www.google.com/maps/place/El+Tovar+Hotel"
      },
      alts: [
        {
          name: "Arizona Room",
          note: "Steaks Sud-Ouest, Bright Angel Lodge",
          stars: "4.0",
          price: "€€€"
        },
        {
          name: "Yavapai Tavern",
          note: "American/SW, sur place",
          stars: "3.2",
          price: "€€"
        }
      ]
    },
    "3": {
      breakfast: "🥞 Stock courses (rien au Grand Canyon)",
      lunch: "🍽️ Brunch Ranch House Grille (Page)",
      main: {
        name: "Big John's Texas BBQ",
        icon: "🍖",
        note: "Meilleur BBQ de la région — brisket, pulled pork",
        stars: "4.5",
        price: "€€",
        maps: "https://www.google.com/maps/place/Big+John's+Texas+BBQ,+153+S+Lake+Powell+Blvd,+Page,+AZ"
      },
      alts: [
        {
          name: "Grand Canyon Brewing",
          note: "Brewpub dans ancienne caserne pompiers",
          stars: "4.5",
          price: "€€"
        },
        {
          name: "Dam Bar & Grille",
          note: "American classic",
          stars: "4.3",
          price: "€€"
        },
        {
          name: "Fiesta Mexicana",
          note: "Mexicain",
          stars: "4.3",
          price: "€€"
        }
      ]
    },
    "4": {
      breakfast: "🥞 American breakfast à l'Airbnb",
      main: {
        name: "Gregory's Mesquite Grill",
        icon: "🥩",
        note: "Meilleur resto Mesquite — steaks, sea bass",
        stars: "4.5",
        price: "€€-€€€",
        maps: "https://www.google.com/maps/place/Gregory's+Mesquite+Grill"
      },
      alts: [
        {
          name: "Virgin River Café",
          note: "Casino, sur place, ouvert tard",
          stars: "3.8",
          price: "€"
        },
        {
          name: "Ritas & Fajitas",
          note: "Mexican",
          stars: "4.1",
          price: "€€"
        }
      ]
    },
    "5": {
      breakfast: "🍳 Virgin River Café (rapide) ou stock glacière",
      lunch: "🍔 Vegas après Valley of Fire",
      main: {
        name: "Spectacle KÀ + dîner",
        icon: "🎭",
        note: "Show 20h MGM Grand — départ hôtel 19h30 — dîner avant ou après",
        booked: true
      },
      alts: [
        {
          name: "Bouchon",
          note: "French bistro Thomas Keller, Venetian",
          stars: "4.6",
          price: "€€€"
        },
        {
          name: "Yard House",
          note: "Gastropub LINQ Promenade",
          stars: "4.3",
          price: "€€"
        },
        {
          name: "In-N-Out Burger",
          note: "Iconique Californie ! Exception chaîne",
          stars: "4.5",
          price: "€"
        }
      ]
    },
    "6": {
      breakfast: "☕ Mon Ami Gabi (terrasse Bellagio) ou Ri-Ra (Mandalay Place)",
      lunch: "🏢 Catering conf Google Next",
      main: {
        name: "Lotus of Siam",
        icon: "🍜",
        note: "James Beard Award — meilleur thaï au monde",
        stars: "4.6",
        price: "€€-€€€",
        maps: "https://www.google.com/maps/place/Lotus+of+Siam,+953+E+Sahara+Ave,+Las+Vegas"
      },
      alts: [
        {
          name: "Mon Ami Gabi",
          note: "Bistro français, terrasse fontaines Bellagio",
          stars: "4.5",
          price: "€€€"
        },
        {
          name: "In-N-Out Burger",
          note: "Iconique ! LINQ Promenade",
          stars: "4.5",
          price: "€"
        }
      ]
    },
    "7": {
      breakfast: "☕ Mon Ami Gabi ou Eggslut (Cosmopolitan)",
      lunch: "🏢 Catering conf Google Next",
      main: {
        name: "Libre — dernier soir Vegas",
        icon: "🎰",
        note: "Choix selon envie"
      },
      alts: [
        {
          name: "Mon Ami Gabi",
          note: "Bistro français, terrasse Bellagio",
          stars: "4.5",
          price: "€€€"
        },
        {
          name: "Lotus of Siam",
          note: "Thaï exceptionnel, off-Strip",
          stars: "4.6",
          price: "€€-€€€"
        },
        {
          name: "Bouchon",
          note: "French bistro, Venetian",
          stars: "4.6",
          price: "€€€"
        }
      ]
    },
    "8": {
      breakfast: "🏢 Dernier matin Google Next",
      main: {
        name: "Pig's Ear American Bistro",
        icon: "🌮",
        note: "Burritos, fajitas — meilleur choix Hurricane",
        stars: "4.6",
        price: "€€-€€€",
        maps: "https://www.google.com/maps/search/Pig's+Ear+Hurricane+UT"
      },
      alts: [
        {
          name: "Main Street Cafe",
          note: "Farm-to-table familial",
          stars: "4.6",
          price: "€€"
        },
        {
          name: "Peruvian Flavors",
          note: "Péruvien — original !",
          stars: "4.4",
          price: "€€"
        }
      ]
    },
    "9": {
      breakfast: "☕ Stock Walmart (acheté la veille à Vegas) — départ 8h25",
      lunch: "🥪 Picnic Zion",
      main: {
        name: "Thunderbird Restaurant",
        icon: "🥧",
        note: "Institution depuis 1931 — ho-made pies !",
        stars: "3.8",
        price: "€€",
        maps: "https://www.google.com/maps/place/Thunderbird+Restaurant,+Mt+Carmel"
      },
      alts: [
        {
          name: "Cordwood",
          note: "Farm-to-table, vue bisons",
          stars: "4.3",
          price: "€€-€€€"
        },
        {
          name: "Archie's Food to Die For",
          note: "Food truck burgers",
          stars: "4.2",
          price: "€"
        }
      ]
    },
    "10": {
      breakfast: "🥧 Thunderbird (ho-made pies, depuis 1931)",
      lunch: "🥪 Picnic Bryce Canyon",
      main: {
        name: "Stone Hearth Grille",
        icon: "🌅",
        note: "Fine dining vue hoodoos — sunset !",
        stars: "4.6",
        price: "€€€",
        maps: "https://www.google.com/maps/place/Stone+Hearth+Grille,+Tropic+UT"
      },
      alts: [
        {
          name: "Bryce Canyon Pines",
          note: "Comfort food, tartes célèbres",
          stars: "4.1",
          price: "€€-€€€"
        },
        {
          name: "The Lodge at Bryce Canyon",
          note: "Seul resto DANS le parc",
          stars: "4.0",
          price: "€€-€€€"
        },
        {
          name: "Ebenezer's Barn & Grill",
          note: "Steaks Ruby's Inn",
          stars: "4.3",
          price: "€€€"
        }
      ]
    },
    "11": {
      breakfast: "✅ Buffet Ruby's Inn (inclus)",
      lunch: "🍽️ Crazy Cow Cafe (Exit 112, Beaver) — dernier avec Laurine",
      main: {
        name: "Sunset Grill",
        icon: "🌅",
        note: "Maison Charlie Steen — VUE incroyable !",
        stars: "4.5",
        price: "€€€",
        maps: "https://www.google.com/maps/place/Sunset+Grill,+Moab+UT"
      },
      alts: [
        {
          name: "Quesadilla Mobilla",
          note: "Food truck légendaire !",
          stars: "4.7",
          price: "€"
        },
        {
          name: "Trailhead Public House",
          note: "Pub élevé, bâtiment historique",
          stars: "4.5",
          price: "€€-€€€"
        },
        {
          name: "Pasta Jay's",
          note: "Italien copieux",
          stars: "4.4",
          price: "€€"
        }
      ]
    },
    "12": {
      breakfast: "✅ Buffet Aarchway Inn (inclus)",
      lunch: "🍔 Milt's Stop & Eat (burgers 1954 !)",
      main: {
        name: "Trailhead Public House",
        icon: "🍺",
        note: "Pub dans un des plus vieux bâtiments de Moab",
        stars: "4.5",
        price: "€€-€€€",
        maps: "https://www.google.com/maps/place/Trailhead+Public+House,+Moab+UT"
      },
      alts: [
        {
          name: "Sunset Grill",
          note: "Steakhouse vue panoramique",
          stars: "4.5",
          price: "€€€"
        },
        {
          name: "Quesadilla Mobilla",
          note: "Food truck, prix mini",
          stars: "4.7",
          price: "€"
        },
        {
          name: "Desert Bistro",
          note: "Fusion upscale — soir spécial",
          stars: "4.6",
          price: "€€€€"
        }
      ]
    },
    "13": {
      breakfast: "✅ Buffet Aarchway Inn (inclus)",
      main: {
        name: "Mercantile Dining",
        icon: "🌾",
        note: "Farm-to-table Union Station",
        stars: "4.5",
        price: "€€€",
        maps: "https://www.google.com/maps/place/Mercantile+Dining,+Denver"
      },
      alts: [
        {
          name: "Euclid Hall",
          note: "Gastropub craft beers",
          stars: "4.5",
          price: "€€-€€€"
        },
        {
          name: "Linger",
          note: "Rooftop vue skyline, ancienne morgue !",
          stars: "4.5",
          price: "€€€"
        }
      ]
    },
    "14": {
      breakfast: "🍳 Snooze (brunch créatif Denver) ⭐ 4.6",
      lunch: "🏢 Denver Mint area",
      main: {
        name: "Dernier dîner ensemble",
        icon: "🥂",
        note: "Choix libre — dernier soir à 5"
      },
      alts: [
        {
          name: "Mercantile Dining",
          note: "Farm-to-table Union Station",
          stars: "4.5",
          price: "€€€"
        },
        {
          name: "Linger",
          note: "Rooftop, cuisine mondiale",
          stars: "4.5",
          price: "€€€"
        },
        {
          name: "Euclid Hall",
          note: "Gastropub",
          stars: "4.5",
          price: "€€-€€€"
        }
      ]
    },
    "15": {
      breakfast: "🍳 Dernier petit-déj ensemble (Denver)",
      main: {
        name: "La Banquise",
        icon: "🍟",
        note: "Poutine culte 24h — \"La Matty\" !",
        stars: "4.5",
        price: "€€",
        booked: false,
        maps: "https://www.google.com/maps/place/La+Banquise,+994+Rue+Rachel+E,+Montréal"
      },
      alts: [
        {
          name: "Schwartz's Deli",
          note: "Smoked meat depuis 1928",
          stars: "4.5",
          price: "€"
        }
      ]
    },
    "16": {
      breakfast: "🥯 Bagel à emporter (Fairmount ou St-Viateur) ou petit truc St-Denis/Duluth",
      lunch: "🍽️ Schwartz / Panzeria / Café Chez Téta",
      main: {
        name: "Au Pied de Cochon",
        icon: "🐷",
        note: "Poutine au foie gras ! Sans Emma (rejoint ~20h/20h30)",
        stars: "4.5",
        price: "€€€",
        maps: "https://www.google.com/maps/place/Au+Pied+de+Cochon,+536+Avenue+Duluth+E,+Montréal"
      },
      alts: [
        {
          name: "Schwartz's Deli",
          note: "Smoked meat depuis 1928 (option déjeuner)",
          stars: "4.5",
          price: "€"
        },
        {
          name: "La Panzeria",
          note: "Pizza (4084 St-Denis, option déjeuner)",
          stars: "4.3",
          price: "€€"
        },
        {
          name: "Café Chez Téta",
          note: "227 Rachel E (option déjeuner)",
          stars: "4.4",
          price: "€€"
        }
      ]
    },
    "17": {
      breakfast: "✅ B&B Chez François (inclus)",
      lunch: "🥩 Schwartz's Deli (smoked meat)",
      main: {
        name: "Souper avec Baptiste",
        icon: "🍽️",
        note: "Baptiste rejoint après stage"
      },
      alts: [
        {
          name: "Auberge du Dragon Rouge",
          note: "Médiéval immersif 🐉",
          stars: "4.4",
          price: "€€-€€€"
        },
        {
          name: "Au Pied de Cochon",
          note: "Poutine au foie gras !",
          stars: "4.5",
          price: "€€€"
        }
      ]
    },
    "18": {
      breakfast: "✅ B&B Chez François (inclus)",
      main: {
        name: "Libre — dernier soir Montréal",
        icon: "🍁",
        note: "Choix selon envie avec Baptiste"
      },
      alts: [
        {
          name: "L'Avenue Mont-Royal",
          note: "Brunch XXL",
          stars: "4.5",
          price: "€€"
        },
        {
          name: "Schwartz's Deli",
          note: "Dernier smoked meat",
          stars: "4.5",
          price: "€"
        }
      ]
    },
    "19": {
      breakfast: "🥯 Fairmount Bagel (four à bois 24h/24)",
      lunch: "🍽️ Déjeuner avec Emma (métro Peel)",
      main: {
        name: "Vol retour — pas de dîner",
        icon: "✈️",
        note: "Départ YUL 22h"
      },
      alts: []
    }
  },
  culture: [
    {
      title: "🎰 Zone 1 — Las Vegas & le Mojave",
      sub: "Chloride, Valley of Fire, Vegas • J1, J5-8",
      sections: [
        {
          h: "Tennessee Schuerman — La femme qui ne demandait la permission à personne",
          p: "En 1893, dans un canyon paumé de l'Arizona, une femme tenait un saloon, possédait 17 concessions minières et avait survécu à une attaque de diligence. Elle s'appelait Tennessee Schuerman, et elle vivait à Chloride — la ville où on passe notre première nuit. Chloride est née en 1863 quand des prospecteurs ont trouvé du chlorure d'argent dans les Cerbat Mountains. À son apogée : 75 mines, 5 000 habitants, 3e ville d'Arizona. Puis le crash de l'argent de 1893 — le gouvernement abandonne l'étalon argent, le prix s'effondre, et 4 900 personnes font leurs valises en un an."
        },
        {
          h: "Chloride — Ghost Town Route 66",
          p: "Née en 1863 avec la découverte de chlorure d'argent. À son apogée: 75 mines, 5 000 habitants, 3e ville d'Arizona. Le crash de l'argent de 1893 a tout tué en un an. Aujourd'hui: 300 âmes et les fresques psychédéliques de Roy Purcell (peintes avec de l'urine animale pour la durabilité!)."
        },
        {
          h: "La Route 66 — Mother Road",
          p: "Inaugurée le 11 novembre 1926: 3 940 km de Chicago à Santa Monica. Le Dust Bowl des années 30 a poussé 400 000 familles d'Oklahoma à tout quitter. Steinbeck les a immortalisés dans Les Raisins de la Colère. Déclassée en 1985."
        },
        {
          h: "Valley of Fire",
          p: "Grès rouge de 150 millions d'années — du sable fossilisé de l'ère des dinosaures. Les roches sont d'un rouge incandescent qui semble en feu au coucher du soleil."
        },
        {
          h: "Las Vegas ne devrait pas exister",
          p: "Construite dans le Mojave (10 cm de pluie/an), Vegas a RÉDUIT sa conso d'eau de 47% malgré 850 000 nouveaux habitants. Programme \"Cash for Grass\" (3$/sq ft pour arracher la pelouse), recyclage 99%, \"Water Police\". Le Strip: moins de 3% de l'eau de la ville."
        },
        {
          h: "KÀ — Le spectacle",
          p: "Scène de 80 tonnes, pivote à 360°, s'incline à 100° vertical. 6 millions de lignes de code (plus qu'un Boeing 787). 165 millions $ — le plus cher jamais produit en 2004."
        },
        {
          h: "La géologie de la route — Vegas → Chloride → Grand Canyon",
          p: "En 90 minutes de route, vous traversez 1,7 milliard d'années. Au Hoover Dam, les parois noires du Black Canyon sont de l'andésite volcanique (~13 millions d'années). En descendant vers Kingman, le paysage change : granites et gneiss précambriens surgissent — les roches les plus vieilles du coin, 1,7 milliard d'années. Autour de Chloride, dans les Cerbat Mountains, ce sont des schistes et quartzites traversés de veines de quartz chargées de chlorure d'argent (d'où le nom !). De Kingman au Grand Canyon, on remonte dans le temps géologique : les plaines de basalte laissent place au calcaire Kaibab (270 Ma) du plateau du Colorado. Et au bord du canyon, la plus grande coupe géologique de la planète : 1,84 milliard d'années de strates exposées, du Vishnu Schist noir au fond jusqu'au calcaire blanc en surface."
        },
        {
          h: "La création de Las Vegas — D'un point d'eau à Sin City",
          p: "\"Las Vegas\" signifie \"les prairies\" en espagnol — nommée par des éclaireurs mexicains en 1829 qui ont trouvé des sources d'eau artésiennes au milieu du désert. En 1905, la ville naît officiellement comme simple arrêt ferroviaire sur la ligne Los Angeles–Salt Lake City. Le vrai tournant : 1931, double jackpot. Le Nevada légalise les jeux d'argent ET le gouvernement fédéral lance la construction du Hoover Dam — 5 000 ouvriers assoiffés de divertissement débarquent. Fremont Street devient \"Glitter Gulch\". En 1941, El Rancho Vegas ouvre sur l'autoroute 91 (futur Strip), suivi du Flamingo de Bugsy Siegel en 1946 — financé par la mafia. L'âge d'or atomique suit : de 1951 à 1962, on testait des bombes nucléaires à 100 km de là. Les casinos organisaient des \"atomic cocktail parties\" sur les toits pour regarder les champignons. Las Vegas est la seule grande ville américaine fondée au XXème siècle — et la preuve qu'avec assez d'eau, d'électricité et d'audace, on peut construire une métropole n'importe où."
        },
        {
          h: "Sin City — Du crime organisé aux corporations",
          p: "Las Vegas est surnommée \"Sin City\" depuis les années 40, quand la mafia a commencé à y construire des casinos. Le Flamingo (1946) de Bugsy Siegel a ouvert le bal. Pendant 40 ans, la Cosa Nostra contrôlait le \"skim\" — le détournement des revenus cash avant comptabilité. Les familles de Chicago, Kansas City et Milwaukee se partageaient le Strip. C'est l'histoire racontée dans Casino (1995) de Scorsese. Tout a changé entre 1979 et 1989 : le FBI lance l'opération Strawman, démantèle les réseaux, et en 1989 Steve Wynn ouvre The Mirage — premier mega-resort corporate. Aujourd'hui, les casinos sont des multinationales cotées en bourse (MGM Resorts, Caesars Entertainment), auditées par la SEC. Ce qui reste de la mafia : le Mob Museum à Fremont Street... et les corps dans des tonneaux que le Lake Mead révèle en s'asséchant. On dort au Luxor — la pyramide noire avec un faisceau de 315 000 watts visible à 20 km — et au LINQ, au pied de la plus grande roue du monde (High Roller, 168 m)."
        }
      ],
      facts: [
        "On a failli dormir à Kingman: 100 trains BNSF/jour, klaxon toutes les 15 min. Chloride = silence absolu et 80€ d'économie.",
        "Le \"Luxor Sky Beam\" est le faisceau le plus puissant au monde (315 000 watts). Il attire des milliards d'insectes... et des milliers de chauves-souris qui viennent festoyer!",
        "La \"bath tub ring\" blanche du Lake Mead mesure 40 m de haut — l'ancien niveau d'eau. Le lac a perdu 70% de son volume depuis 2000.",
        "Le Lake Mead a révélé 6 corps dans des tonneaux en métal depuis 2022. La baisse du niveau d'eau expose les secrets de la mafia des années 70 — ils pensaient que le lac ne baisserait jamais.",
        "Les fontaines du Bellagio utilisent de l'eau de puits non potable. Le Strip entier consomme moins de 3% de l'eau de la ville."
      ]
    },
    {
      title: "🏜️ Zone 2 — Grand Canyon & Page",
      sub: "South Rim, Horseshoe Bend, Antelope Canyon • J2-4",
      sections: [
        {
          h: "Le Grand Canyon — 1,2 Md d'années manquantes",
          p: "En 1869, John Wesley Powell descend le Colorado en bateau — borgne, avec un seul bras. Il met trois mois. Ce qu'il découvre au fond : le Vishnu Schist, 1,84 milliard d'années. Le Grand Canyon expose 40 couches de roches sur 1,6 km de profondeur. En descendant, on remonte le temps. Mais entre le fond et le dessus, 1,2 milliard d'années de strates ont disparu — la \"Great Unconformity\". On y a trouvé des cristaux de zircon vieux de 4,4 milliards d'années, quasi aussi vieux que la planète elle-même."
        },
        {
          h: "El Tovar — Dîner au bord du gouffre depuis 1905",
          p: "Le soir du Grand Canyon, on dîne au El Tovar Dining Room — le restaurant historique du parc, ouvert en 1905. Theodore Roosevelt y a séjourné. Bison, truite, produits du Sud-Ouest. C'est l'un des rares endroits au monde où on mange à 10 mètres d'un gouffre de 1,6 km."
        },
        {
          h: "Les condors du Grand Canyon",
          p: "Le condor de Californie est le plus grand oiseau d'Amérique du Nord (3 m d'envergure). En 1982 : 22 individus sur Terre. Réintroduits au Grand Canyon en 1996, ils sont aujourd'hui ~90 dans la zone. On les reconnaît à leurs ailes plates (pas en V comme les vautours) et leurs numéros sur les ailes. Avec un peu de chance, on en verra depuis le South Rim."
        },
        {
          h: "La faune du plateau — Surprise à 2 100 m",
          p: "On s'attend au désert, on tombe sur une forêt de pins ponderosa ! Le South Rim est à 2 100 m d'altitude avec une végétation dense qui abrite une faune incroyable. Les <b>elks</b> (wapitis) se baladent sur les parkings et traversent la route — jusqu'à 330 kg, ne les approchez pas. Les <b>bisons</b> vivent sur la North Rim (200-600 têtes, considérés invasifs, le NPS tente de les relocaliser). Les <b>mule deer</b> (cerfs mulets) sont partout — prudence la nuit en voiture ! Les <b>bighorn sheep</b> (mouflons) escaladent les falaises du canyon. Et les <b>écureuils Kaibab</b>, endémiques : oreilles à pinceaux, queue blanche, ils n'existent nulle part ailleurs sur Terre. Ouvrez l'œil aussi pour les coyotes au crépuscule, les faucons pèlerins (320 km/h en piqué !), et les grands corbeaux omniprésents qui surveillent vos sandwichs."
        },
        {
          h: "Glen Canyon Dam — Le barrage qui a noyé un paradis",
          p: "À Page, on est au pied du <b>Glen Canyon Dam</b> (216 m de haut, achevé en 1963). Il a créé le Lake Powell — mais en noyant 300 km de canyons que certains considéraient plus beaux que le Grand Canyon. Edward Abbey (notre punk du désert) rêvait de le dynamiter dans \"The Monkey Wrench Gang\" (1975). Ironie cruelle : en avril 2026, le Lake Powell est à <b>3 530 pieds</b> (son niveau le plus bas), avec seulement 22% des apports moyens en eau. Le barrage risque de passer sous le <b>minimum hydroélectrique</b> cette année. Des canyons engloutis depuis 60 ans réapparaissent. Ce que vous verrez depuis le pont : un lac squelettique avec des \"bathtub rings\" — les anneaux blancs sur la roche qui marquent l'ancien niveau de l'eau."
        },
        {
          h: "Bathtub Rings — Les cicatrices du Colorado",
          p: "Les \"bathtub rings\" (anneaux de baignoire) sont les <b>lignes blanches horizontales</b> sur les falaises de grès rouge autour des lacs Powell et Mead. L'eau dépose du calcaire et des minéraux sur la roche — quand le niveau baisse, ça laisse une bande blanche nette. Lake Powell a perdu plus de <b>30 mètres</b> depuis son max. La roche rouge coupée par cette bande blanche, c'est saisissant. C'est le <b>marqueur visuel</b> de la crise hydrique — visible à l'œil nu depuis le pont de Page, la route, partout. Au Lake Mead (Vegas), c'est encore pire : des tonneaux contenant des restes humains sont remontés à la surface quand l'eau a baissé... Vous verrez ces cicatrices tout au long du voyage."
        },
        {
          h: "Le Colorado — Un fleuve, 15 barrages, 40 millions de bouches",
          p: "Le Colorado parcourt 2 330 km depuis les Rocheuses du Colorado jusqu'au golfe de Californie (en théorie — il n'atteint plus la mer depuis les années 1990). Vous allez le croiser <b>4 fois</b> pendant le voyage : au Grand Canyon (J2-3, il coule 1 600 m plus bas), à Page/Glen Canyon Dam (J3-4), à Horseshoe Bend (son méandre iconique), et à Moab (J11-12, sa confluence avec la Green River à Canyonlands). Le fleuve alimente <b>40 millions de personnes</b> dans 7 États + le Mexique, via un système de 15 barrages majeurs. Les deux géants : <b>Hoover Dam</b> (1936, 221 m, a créé le Lake Mead — près de Vegas) et <b>Glen Canyon Dam</b> (1963, 216 m, Lake Powell — à Page). Le problème : on consomme plus d'eau que le fleuve n'en fournit. C'est <b>la plus grande crise hydrique de l'Ouest américain</b>, et vous allez la voir de vos propres yeux — les \"bathtub rings\", les marinas posées sur la terre sèche, les corps dans les tonneaux qui remontent..."
        },
        {
          h: "Horseshoe Bend — Le méandre viral",
          p: "305 m de chute libre. Virage de 270°, 540 m de large. Jusqu'en 2012: ni panneau, ni parking. Puis Instagram. De 100 000 visiteurs (2015) à 2 millions (2023). Le canyon n'a pas changé d'un millimètre."
        },
        {
          h: "Antelope Canyon — Cathédrale Navajo",
          p: "En navajo: \"l'endroit où l'eau coule à travers les rochers\". Le 12 août 1997, une crue-éclair: l'eau monte de 6 m en minutes, 11 morts. Les murs lisses sont poncés par l'eau chargée de sable depuis des millions d'années."
        },
        {
          h: "Coral Pink Sand Dunes",
          p: "Couleur unique grâce à l'effet Venturi: le vent s'accélère entre 2 chaînes de montagnes, arrache du grès rouge. Chaque grain = quartz + rouille microscopique. Seul habitat du Welsh's milkweed (pousse nulle part ailleurs sur Terre)."
        }
      ],
      facts: [
        "John Wesley Powell a descendu le Colorado en 1869 — borgne, avec un seul bras. 3 mois en bateau pour découvrir des roches de 1,84 milliard d'années.",
        "Horseshoe Bend: dans quelques millions d'années, le fleuve percera l'isthme pour former un pont naturel, comme Rainbow Bridge.",
        "Antelope Canyon: visite UNIQUEMENT avec guide Navajo. Les light beams ne durent que 2h/jour (notre créneau 12h20 = parfait).",
        "Un grain de sable au fond du Grand Canyon a mis 2 milliards d'années à arriver là. Toi, tu le verras en 2 secondes depuis le bord.",
        "Horseshoe Bend n'avait ni panneau ni parking avant 2012. Puis Instagram est arrivé : 100 000 visiteurs en 2015, 2 millions en 2023. Le canyon n'a pas bougé d'un millimètre."
      ]
    },
    {
      title: "⛰️ Zone 3 — Zion & Bryce",
      sub: "Angel's Landing, Hoodoos • J9-10",
      sections: [
        {
          h: "Angel's Landing — \"Seul un ange...\"",
          p: "Frederick Fisher (1916): \"Only an angel could land on it.\" Chaînes installées à la main par Walter Ruesch en 1926. 21 lacets vertigineux (Walter's Wiggles). Dernière section: 45-60 cm de large, 300 m de vide. Au moins 16 morts."
        },
        {
          h: "Zion — Le canyon qui pleure",
          p: "Slot canyon monumental: 600 m de profondeur, parois parfois à 6 m. Le grès Navajo est poreux (20-30%) — il absorbe la pluie comme une éponge puis la relâche: les \"weeping walls\" couvertes de fougères et jardins suspendus."
        },
        {
          h: "Bryce Canyon — Pas un canyon!",
          p: "Aucune rivière ne l'a creusé. C'est le bord du plateau qui s'érode vers l'intérieur. Nommé par Ebenezer Bryce (1875): \"It's a hell of a place to lose a cow.\" Les hoodoos sont sculptés par la GLACE (200 cycles gel/dégel/an), pas le vent."
        },
        {
          h: "Grafton Ghost Town — le Far West pour de vrai",
          p: "Village mormon fondé en 1862 au bord de la Virgin River, abandonné après crues dévastatrices et conflits avec les Amérindiens. C'est ICI que Paul Newman fait sa scène vélo légendaire dans Butch Cassidy et le Kid (1969). Considéré comme le ghost town le plus photographié de l'Ouest — maisons en bois intactes, école, cimetière des années 1860, et les falaises vertigineuses de Zion en arrière-plan. Gratuit, route de terre OK, 20 min depuis Hurricane."
        }
      ],
      facts: [
        "Le grès mouillé de Zion = savon. La majorité des morts arrivent par temps de pluie. Si mouillé → Scout Lookout (95% de la vue, sans chaînes).",
        "Bryce culmine à 2 778 m — point le plus haut du voyage. \"International Dark Sky Park\": 7 500 étoiles à l'œil nu (vs 2 000 en ville).",
        "Les \"Walter's Wiggles\" — 21 lacets vertigineux — portent le nom du garde qui a installé les chaînes à la main, suspendu au-dessus du vide, en 1926. Le permis est obligatoire depuis 2022.",
        "Thor's Hammer perdra sa tête dans quelques milliers d'années. Dans 3 millions d'années, l'amphithéâtre n'existera plus. On le voit dans un instant géologique parfait."
      ]
    },
    {
      title: "🪨 Zone 4 — Capitol Reef, Arches & Moab",
      sub: "Factory Butte, Delicate Arch, Dead Horse Point • J11-12",
      sections: [
        {
          h: "Capitol Reef — Le récif infranchissable",
          p: "Le Waterpocket Fold: pli de 160 km, muraille infranchissable. Dômes blancs = Capitole de Washington + \"reef\" = barrière. La vallée de Fruita, isolée jusqu'en 1962, a des vergers centenaires encore productifs. Pétroglyphes Fremont (600-1300 apr. J.-C.)."
        },
        {
          h: "Factory Butte — Mars sur Terre",
          p: "La NASA y teste ses rovers depuis 2001. Monolithe de 490 m sur des badlands de Mancos Shale — fond marin de 75-90 millions d'années. On marche sur un ancien océan qui ressemble à une autre planète."
        },
        {
          h: "Arches — Tout commence par du sel",
          p: "2 000+ arches. Sous le grès: 900 m de sel (300 M d'années). Le sel se dissout, déstabilise la roche → failles → \"ailettes\" → arches. Wall Arch (22 m) s'est effondrée une nuit en 2008. Landscape Arch (93 m) perd des blocs régulièrement. On perd ~1 arche/décennie."
        },
        {
          h: "Dead Horse Point",
          p: "Mesa à 600 m au-dessus du Colorado, isthme de 30 m. Cowboys y parquaient les mustangs. Légende: des chevaux abandonnés morts de soif — la rivière visible mais inaccessible. Scène de Thelma & Louise et Mission Impossible 2."
        },
        {
          h: "Canyonlands — L'anti-Grand Canyon",
          p: "Même fleuve, même roche, même profondeur vertigineuse — mais sans les foules. Canyonlands est le parc que personne ne connaît, et c'est ce qui fait sa magie. Island in the Sky est une mesa gigantesque à 300 m au-dessus de tout. Mesa Arch au sunrise : un arc de pierre qui encadre les canyons et les La Sal Mountains enneigées — LA photo de l'Utah. Le Green River et le Colorado se rejoignent ici dans un nœud géologique spectaculaire. Grand View Point offre une vue sur 160 km — par temps clair, on voit 3 chaînes de montagnes."
        },
        {
          h: "Moab — De l'uranium au VTT",
          p: "Boom uranium 1952-1964 (Charlie Steen, millionnaire overnight). Héritage: 16 M tonnes de déchets radioactifs le long du Colorado. 2e boom: outdoor. 5 000 habitants, 3 millions de visiteurs/an."
        }
      ],
      facts: [
        "Delicate Arch (14 m) est sur les plaques d'immatriculation de l'Utah. Edward Abbey l'a escaladée ivre en 1956 quand il était ranger à Arches.",
        "Edward Abbey a demandé à être enterré illégalement dans le désert, dans un sac de couchage. Ses amis l'ont fait — l'emplacement est secret.",
        "Le Timed Entry d'Arches a été supprimé en 2026 — entrée libre avec le pass America the Beautiful!",
        "Canyonlands reçoit 10 fois moins de visiteurs qu'Arches alors qu'il est 15 fois plus grand. C'est le secret le mieux gardé de l'Utah."
      ]
    },
    {
      title: "🏔️ Zone 5 — Denver & les Rocheuses",
      sub: "I-70, Mile High City • J13-14",
      sections: [
        {
          h: "I-70 — La route à travers les Rocheuses",
          p: "Le trajet Moab → Denver par l'Interstate 70 est un voyage dans le voyage. Glenwood Canyon : 19 km de route sculptée dans les falaises, au-dessus du Colorado (la rivière, encore elle). Vail Pass à 3 243 m. Eisenhower Tunnel perce la Continental Divide à 3 401 m — le plus haut tunnel autoroutier des US. D'un côté du tunnel, l'eau coule vers le Pacifique. De l'autre, vers l'Atlantique. Patricia Schroeder, 1ère femme congresswoman du Colorado, a brisé la superstition en entrant dans le tunnel : les femmes y étaient interdites depuis la construction."
        },
        {
          h: "Des montagnes sur des montagnes mortes",
          p: "Les Rocheuses (70 M ans) ne sont pas les originales. Des \"Ancestral Rockies\" existaient 300 M ans avant et se sont érodées. Le grès rouge de Red Rocks = leurs débris. Eisenhower Tunnel (I-70): plus haut tunnel US à 3 401 m, perce la Continental Divide."
        },
        {
          h: "Denver — Mile High City",
          p: "1 609 m (5 280 pieds = 1 mile exact). La 13e marche du Capitole est gravée \"One Mile Above Sea Level\" depuis 1947. Problème : un relevé GPS de 2003 a montré que c'est la 18e marche. Les deux sont maintenant marquées. L'altitude a des effets concrets : l'eau bout à 95°C (les pâtes cuisent moins bien), les home runs au Coors Field volent 9% plus loin, l'air est 17% moins dense (on bronze plus vite), et l'air est 17% moins dense — la bière monte plus vite (voir Bière & Altitude)."
        },
        {
          h: "Denver Mint",
          p: "Frappe des milliards de pièces/an depuis 1906. Bâtiment de 1904 classé patrimoine. Toutes les pièces frappées ici portent un petit \"D\"."
        },
        {
          h: "Bière & Altitude",
          p: "400+ brasseries artisanales — plus forte densité des US. L'altitude accélère la fermentation ET l'absorption d'alcool. Deux pintes à Denver = trois au niveau de la mer. Les Chinook winds peuvent faire monter la température de 30°C en quelques heures."
        },
        {
          h: "Rocky Mountain Oysters — Osez (ou pas)",
          p: "Ce ne sont PAS des huîtres. Ce sont des testicules de taureau panés et frits. Classique du Colorado depuis l'époque des ranches. Au Buckhorn Exchange (ouvert depuis 1893), le plus vieux restaurant de Denver, c'est au menu à côté de l'élan et du bison. Les balles du Coors Field sont stockées dans un humidificateur pour compenser l'air sec qui les fait voler trop loin."
        }
      ],
      facts: [
        "Patricia Schroeder, 1re femme congresswoman du Colorado, a brisé la superstition minière en entrant dans l'Eisenhower Tunnel (les femmes y étaient interdites).",
        "Rocky Mountain Oysters: ce ne sont PAS des huîtres. Ce sont des testicules de taureau panés et frits. Classique du Colorado. Oser ou pas? 😏",
        "Les balles de baseball du Coors Field sont stockées dans un humidificateur pour compenser l'air sec de Denver qui les fait voler trop loin.",
        "Les Chinook winds descendent des Rocheuses et peuvent faire monter la température de 30°C en quelques heures. Le 24 janvier 1943, Spearfish (Dakota du Sud) a vu la température passer de -20°C à +7°C en 2 minutes.",
        "Red Rocks Amphitheatre — le concert en plein air dans les ruines d'une chaîne de montagnes fantôme. Les \"Ancestral Rockies\" existaient 300 M ans avant les Rocheuses actuelles. Le grès rouge de Red Rocks = leurs débris."
      ]
    },
    {
      title: "🔴 Fils Rouges du Voyage",
      sub: "Thèmes qui traversent tout le road trip",
      sections: [
        {
          h: "Le Colorado — Le fleuve qui meurt",
          p: "2 330 km. Alimente 40 millions de personnes via 15 barrages. Sur-alloué depuis le <b>Colorado River Compact</b> de 1922 (basé sur des années exceptionnellement humides — erreur historique). Les deux géants qui le contrôlent : Hoover Dam (1936, Lake Mead, près de Vegas) et Glen Canyon Dam (1963, Lake Powell, à Page). Depuis 1998, le fleuve n'atteint plus la mer. En 2026, Lake Powell est à son plus bas historique (22% des apports). On le croise 4 fois : Grand Canyon (1 600 m plus bas), Horseshoe Bend, Glen Canyon Dam (Page), et Canyonlands (confluence Green River, Moab). La plus grande crise hydrique de l'Ouest, visible à l'œil nu."
        },
        {
          h: "La Terre des Navajos",
          p: "1864: 9 000 Navajos forcés de marcher 480 km (Longue Marche). Des centaines morts. Internés 4 ans. Le fry bread = pain de survie né des rations gouvernementales. Navajo Nation: 71 000 km², 170 000 habitants. Antelope Canyon est sur leur terre sacrée."
        },
        {
          h: "Les Mormons et l'Utah",
          p: "1847: Brigham Young, 70 000 mormons fuient les persécutions. \"This is the right place.\" Colonisation méthodique de chaque vallée. Hurricane (J8) fondée par des familles mormones. Bière en épicerie limitée à 5%. Alcool fort = State Liquor Stores (fermés dimanche)."
        },
        {
          h: "Edward Abbey — Le punk du désert",
          p: "Ranger à Arches (1950s). Desert Solitaire (1968) = chef-d'œuvre. The Monkey Wrench Gang (1975) = 4 amis planifient de faire sauter le Glen Canyon Dam → inspiré Earth First! Enterré illégalement dans le désert, en sac de couchage."
        },
        {
          h: "L'art sur la roche",
          p: "Pétroglyphe = image gravée dans la roche. Pictogramme = image peinte. Les pétroglyphes de Capitol Reef sont l'œuvre du peuple Fremont (600-1300 apr. J.-C.), des chasseurs-cueilleurs qui n'ont rien à voir avec les Navajos. \"Anasazi\" signifie \"anciens ennemis\" en navajo — terme péjoratif. Les descendants (Hopi, Zuni) préfèrent \"Ancestral Puebloans\". On croisera de l'art rupestre à Capitol Reef (J11) et sur les murs de grès un peu partout dans l'Utah."
        },
        {
          h: "Le désert et l'altitude — Pourquoi ça change tout",
          p: "À 2 400 m (Bryce), l'exposition UV est 25-30% plus forte qu'au niveau de la mer. L'air sec déshydrate sans qu'on s'en rende compte — 3 à 4 litres d'eau par jour minimum. L'altitude accélère l'absorption d'alcool. Et le danger n°1 dans les slot canyons : les crues-éclair. Une pluie à 50 km peut provoquer un mur d'eau de 3-6 m en minutes. Le ciel au-dessus de vous peut être bleu. Antelope Canyon 1997 : 11 morts, orage à 16 km."
        },
        {
          h: "Les fuseaux horaires — Le casse-tête Arizona",
          p: "L'Arizona refuse l'heure d'été. Mais la Nation Navajo l'observe. Et la réserve Hopi (enclavée dans la Navajo) ne l'observe pas. Résultat absurde en été : sur l'I-40, on change d'heure 4 fois en 120 km. Pour notre voyage en avril : Nevada et Arizona = même heure (UTC-7). En entrant dans l'Utah (J8) : on perd 1 heure (UTC-6). Colorado = même heure que l'Utah."
        }
      ],
      facts: [
        "Tout le rouge du voyage = de la rouille. Chaque grain de sable est un quartz recouvert d'oxyde de fer. On marche sur un désert qui rouille depuis 190 millions d'années.",
        "L'Arizona refuse l'heure d'été. Mais la Nation Navajo l'observe. Résultat: on peut changer d'heure 4 FOIS en 120 km sur l'I-40.",
        "\"Anasazi\" signifie \"anciens ennemis\" en navajo — terme péjoratif. Les descendants (Hopi, Zuni) préfèrent \"Ancestral Puebloans\".",
        "Le Colorado alimente 40 millions de personnes mais a été sur-alloué en 1922, basé sur des années anormalement humides. Depuis 1998, il n'atteint plus la mer — il meurt dans le sable à 150 km du Golfe de Californie.",
        "Le fry bread navajo : né de la souffrance (rations d'internement en 1864), devenu symbole complexe — fierté pour certains, rappel de l'oppression pour d'autres."
      ]
    },
    {
      title: "🍽️ Cuisine locale par zone",
      sub: "Ce qu'il faut goûter sur place",
      sections: [
        {
          h: "Vegas & Nevada",
          p: "Buffets de casino (tradition depuis les années 50). In-N-Out Burger (demander \"Animal Style\"). Tacos de rue (communauté mexicaine 30%+)."
        },
        {
          h: "Arizona & terre Navajo",
          p: "Navajo taco (fry bread + garniture = pain de survie devenu fierté). Blue corn tortillas. Mutton stew (ragoût de mouton traditionnel)."
        },
        {
          h: "Utah",
          p: "Fry sauce (ketchup + mayo, les locaux en mettent sur TOUT). Funeral potatoes (gratin mormon servi... aux funérailles). Scones de l'Utah = fry bread + miel-beurre (rien à voir avec les British!)."
        },
        {
          h: "Moab",
          p: "Milt's Stop & Eat (burgers depuis 1954). Dead Horse Amber Ale & Rocket Bike Lager (Moab Brewery). L'altitude affecte la carbonatation."
        },
        {
          h: "Denver",
          p: "Green chili (ragoût de piment vert sur tout!). Rocky Mountain Oysters (testicules de taureau panées — oser ou pas). 400+ brasseries artisanales dans RiNo."
        }
      ],
      facts: []
    },
    {
      title: "🍁 Zone 6 — Montréal & le Québec",
      sub: "Plateau, Vieux-Montréal, culture québécoise • J15-19",
      sections: [
        {
          h: "Montréal — Métropole du Québec",
          p: "2e plus grande ville francophone au monde après Paris. 2 millions d'habitants (4M en métropole). Île sur le Saint-Laurent, 400 ans d'histoire. \"La Belle Province\" fondée par Ville-Marie en 1642. Bilingue dans les faits, officiellement francophone. Climat continental: été chaud et humide, hivers brutaux (-20°C). Surnom: \"MTL\" ou simplement \"La Ville\"."
        },
        {
          h: "Le Plateau-Mont-Royal",
          p: "LE quartier bohème de Montréal. Triplex victoriens colorés, escaliers extérieurs en colimaçon (caractéristique unique au monde — économisaient la superficie intérieure taxée!). Artistes, étudiants, cafés, galeries. Mile End: epicentre hipster, ex-quartier juif orthodoxe (d'où les bagels!). Petite Italie: marché Jean-Talon, meilleur marché extérieur du Canada."
        },
        {
          h: "La Guerre des Bagels",
          p: "St-Viateur (1957) vs Fairmount (1919): le débat le plus sérieux de Montréal. Bagel montréalais = plus petit, plus sucré (eau miel), cuit au four à bois. RADICALEMENT différent du bagel new-yorkais (plus gros, cuit à la vapeur). St-Viateur: ouvert 24h/24, 365j/an, jamais fermé en 80 ans. Fairmount: réputé plus croustillant. Trancher ce débat avant le départ = impossible."
        },
        {
          h: "Basilique Notre-Dame de Montréal",
          p: "1829, style néo-gothique. Surnommée \"la Chapelle Sixtine du Nouveau Monde\". 3 000 places. Plafond bleu étoilé, boiseries sculptées à la main, vitraux relatant l'histoire de Montréal (pas des scènes bibliques!). La salle \"Le Gros Bourdon\": cloche de 11 tonnes, sonne seulement pour les grandes occasions. Céline Dion s'y est mariée (1994)."
        },
        {
          h: "Les Tam-tams du Mont-Royal",
          p: "Chaque dimanche dès les beaux jours: des centaines de personnes se réunissent spontanément au pied du monument George-Étienne Cartier pour jouer des percussions. Phénomène unique au monde, sans organisation, sans entrée. DJ, danseurs, acrobates, vendeurs informels. Débute vers 11h, se dissout vers 18h. Ambiance totalement libre, très MTL."
        },
        {
          h: "Le Stade Olympique — L'Oiseau Blanc",
          p: "Construit pour les JO de 1976. La tour inclinée (175m) est la plus haute tour inclinée au monde. Toit rétractable qui n'a jamais vraiment fonctionné (trop lourd). Budget initial: 120M$. Coût final: 1,47 milliard. Payé jusqu'en 2006! Surnom des Montréalais: \"Le Big O\" ou \"La Big Owe\" (The Big Debt). Aujourd'hui: événements sportifs, visites touristiques, vue panoramique."
        },
        {
          h: "La Poutine — Patrimoine national",
          p: "Née vers 1957 dans les cantines rurales du Québec (débat sur l'inventeur exact entre plusieurs villes). Frites + sauce brune + fromage en grains frais (le \"squeaky cheese\" doit faire couic!). Le fromage FOND avec la sauce chaude — c'est ça la magie. La Banquise (Plateau): ouvert 24h, 30 variétés dont la \"La Matty\" (pepperoni, champignons, poivrons). Au Pied de Cochon: poutine au foie gras — l'excès assumé."
        },
        {
          h: "Le RÉSO — Ville souterraine",
          p: "33 km de galeries souterraines reliant 80 immeubles, 2 gares, 7 stations de métro, 1 700 boutiques. 500 000 personnes/jour en hiver. Né en 1962 avec la Place Ville-Marie. Conçu pour survivre aux hivers brutaux. En été, c'est climatisé! Promenade possible de la Place Bonaventure jusqu'au Palais des Congrès sans sortir."
        },
        {
          h: "L'Auberge du Dragon Rouge",
          p: "Restaurant médiéval unique à Montréal. On mange avec les doigts — pas de couverts! Côtes levées, soupe dans un pain, bière servie dans des chopes de céramique. Serveurs en costume d'époque, ambiance salle des chevaliers. La devise: 'manger comme un paysan du XVe siècle'. Réservation quasi obligatoire. Adresse: 8870 boul. Taschereau, Brossard (30 min de Montréal)."
        }
      ],
      facts: [
        "La Queue de castor (Beaver Tail): pâtisserie en forme de queue de castor, étirée à la main, cuite dans la friture. Garnitures: sucre cannelle, Nutella, érable. Née à Ottawa en 1978, iconique au Canada.",
        "Schwartz's Deli (1928): file d'attente perpétuelle, tables communes, cash seulement. Smoked meat: bœuf fumé 10 jours + épicé. Plus proche de la tradition ashkénaze que le pastrami new-yorkais. Réputé meilleur smoked meat au monde.",
        "Montréal est construite sur une île et entourée du Saint-Laurent. Le fleuve est si large qu'on ne le voit pas d'une rive à l'autre — comme un lac. La Voie Maritime du Saint-Laurent permet aux bateaux de mer de remonter jusqu'aux Grands Lacs."
      ]
    }
  ],
  lists: {
    "checklist-usa2026": {
      id: "checklist-usa2026",
      tripId: "usa-2026",
      type: "packing",
      title: "🧳 Checklist Valise",
      subtitle: "19 jours (17 avril → 5 mai) · Désert → Montagne → Ville → Montréal",
      sections: [
        {
          emoji: "🛂",
          title: "Documents — CRITIQUE",
          items: [
            {
              id: "passeports",
              text: "Passeports (valides > nov 2026)",
              note: "Vérifier date expiration !"
            },
            {
              id: "esta",
              text: "ESTA imprimés (2 copies chacun)",
              note: "Dinah = passeport US, pas besoin ESTA"
            },
            {
              id: "billets-avion",
              text: "Billets avion imprimés"
            },
            {
              id: "permis-conduire",
              text: "Permis de conduire Nicole"
            },
            {
              id: "assurance-voy",
              text: "Assurance voyage (n° + tél urgence)"
            },
            {
              id: "cartes-bancaires",
              text: "Cartes bancaires internationales",
              note: "BoursoBank 3143 ✅ déclaration faite"
            },
            {
              id: "alamo-doc",
              text: "Alamo Rental Document imprimé",
              note: "Skip the Counter — conf 1493389705"
            },
            {
              id: "photocopies",
              text: "Photocopies passeports (séparées)"
            },
            {
              id: "ave-canada",
              text: "AVE Canada (imprimé ou screenshot)"
            }
          ]
        },
        {
          emoji: "👕",
          title: "Vêtements — 2 saisons !",
          items: [
            {
              id: "tshirts",
              text: "T-shirts × 8-9"
            },
            {
              id: "shorts",
              text: "Shorts × 3"
            },
            {
              id: "pantalons",
              text: "Pantalons légers × 3",
              note: "Randos + Denver + Montréal"
            },
            {
              id: "jean",
              text: "Jean / chino",
              note: "Google Next + KÀ + Montréal"
            },
            {
              id: "chemise",
              text: "Chemise / polo soigné",
              note: "Conf networking"
            },
            {
              id: "robe-vegas",
              text: "Robe / tenue légère Vegas 😎"
            },
            {
              id: "pulls",
              text: "Pulls / sweats × 2"
            },
            {
              id: "manteau",
              text: "Manteau léger",
              note: "Montréal 4°C le matin !"
            },
            {
              id: "polaire",
              text: "Polaire + veste chaude"
            },
            {
              id: "echarpe",
              text: "Écharpe légère",
              note: "Montréal matin"
            },
            {
              id: "maillot",
              text: "Maillots de bain",
              note: "Piscines + jacuzzis !"
            },
            {
              id: "pyjama",
              text: "Pyjamas"
            },
            {
              id: "sous-vet",
              text: "Sous-vêtements × 14"
            },
            {
              id: "chaussettes",
              text: "Chaussettes × 14 (dont rando)"
            }
          ]
        },
        {
          emoji: "👟",
          title: "Chaussures",
          items: [
            {
              id: "rando-shoes",
              text: "Rando RODÉES",
              note: "Angel's Landing, Arches, Bryce !"
            },
            {
              id: "baskets",
              text: "Baskets confort",
              note: "Conf 3j debout + Denver + Montréal"
            },
            {
              id: "tongs",
              text: "Tongs / sandales"
            }
          ]
        },
        {
          emoji: "🌞",
          title: "Protection",
          items: [
            {
              id: "creme-sol",
              text: "Crème solaire SPF50+"
            },
            {
              id: "lunettes-sol",
              text: "Lunettes de soleil"
            },
            {
              id: "chapeau",
              text: "Chapeau / casquette"
            },
            {
              id: "baume-levres",
              text: "Baume à lèvres",
              note: "Climat très sec"
            },
            {
              id: "anti-moust",
              text: "Anti-moustiques",
              note: "Sources chaudes, Moab"
            }
          ]
        },
        {
          emoji: "💊",
          title: "Santé",
          items: [
            {
              id: "medocs-perso",
              text: "Médicaments perso + compléments"
            },
            {
              id: "doliprane",
              text: "Doliprane / Advil"
            },
            {
              id: "pansements",
              text: "Pansements + anti-ampoules"
            },
            {
              id: "imodium",
              text: "Anti-diarrhéique (Imodium)"
            },
            {
              id: "smecta",
              text: "Smecta / charbon"
            },
            {
              id: "collyre",
              text: "Collyre",
              note: "Air sec désert + avion"
            }
          ]
        },
        {
          emoji: "📱",
          title: "Tech",
          items: [
            {
              id: "chargeurs",
              text: "Chargeurs téléphone + laptop"
            },
            {
              id: "adaptateur-us",
              text: "Adaptateur prise US × 2 (Type A/B)",
              note: "✅ commandé Amazon"
            },
            {
              id: "batterie-ext",
              text: "Batterie externe chargée"
            },
            {
              id: "appareil-photo",
              text: "Appareil photo + chargeur + carte SD"
            },
            {
              id: "cable-usb-voiture",
              text: "Câble USB voiture",
              note: "Pour CarPlay"
            },
            {
              id: "ecouteurs",
              text: "Écouteurs / casque",
              note: "Avion"
            }
          ]
        },
        {
          emoji: "📱",
          title: "Applis à installer",
          items: [
            {
              id: "app-mpc",
              text: "Mobile Passport Control (MPC)"
            },
            {
              id: "google-maps-offline",
              text: "Google Maps zones offline",
              note: "Arizona + Utah + Nevada + Colorado"
            },
            {
              id: "app-airbnb",
              text: "Airbnb",
              note: "Codes accès, messages hôtes"
            },
            {
              id: "app-ka",
              text: "App Cirque du Soleil",
              note: "Billets KÀ"
            },
            {
              id: "app-tripkit",
              text: "voyage.bapttf.com",
              note: "Safari → écran d'accueil"
            }
          ]
        },
        {
          emoji: "🎒",
          title: "Journée / Rando",
          items: [
            {
              id: "sac-a-dos",
              text: "Petit sac à dos rando"
            },
            {
              id: "gourdes",
              text: "Gourdes × 2",
              note: "VITAL — désert !"
            },
            {
              id: "lampe-frontale",
              text: "Lampe frontale",
              note: "Angel's Landing tôt matin"
            },
            {
              id: "serviette-micro",
              text: "Serviette microfibre",
              note: "Jacuzzis, sources chaudes"
            },
            {
              id: "sacs-zip",
              text: "Sacs plastique zip",
              note: "Téléphone si pluie/poussière"
            }
          ]
        },
        {
          emoji: "🍽️",
          title: "Pique-nique / Route",
          items: [
            {
              id: "couteau",
              text: "Couteau + couverts + tire-bouchon"
            },
            {
              id: "assiettes",
              text: "Assiettes / verres réutilisables"
            },
            {
              id: "glaciere",
              text: "Glacière souple pliable"
            },
            {
              id: "sacs-poubelle",
              text: "Sacs poubelle"
            },
            {
              id: "essuie-tout",
              text: "Essuie-tout / lingettes"
            }
          ]
        },
        {
          emoji: "🏠",
          title: "Avant de partir",
          items: [
            {
              id: "alarme",
              text: "Alarme maison activée"
            },
            {
              id: "volets",
              text: "Volets fermés / programmés"
            },
            {
              id: "eau",
              text: "Eau coupée ?"
            },
            {
              id: "poubelles",
              text: "Poubelles sorties"
            },
            {
              id: "frigo",
              text: "Frigo vidé (périssables)"
            },
            {
              id: "plantes",
              text: "Plantes arrosées / voisin prévenu"
            },
            {
              id: "photo-valise",
              text: "Photo du contenu valise",
              note: "Pour assurance"
            }
          ]
        },
        {
          emoji: "✈️",
          title: "Bagage cabine (si valise perdue)",
          items: [
            {
              id: "change-cabine",
              text: "1 change complet"
            },
            {
              id: "trousse-mini",
              text: "Trousse toilette mini (<100 ml)"
            },
            {
              id: "medocs-cabine",
              text: "Médicaments essentiels"
            },
            {
              id: "docs-cabine",
              text: "Documents + photocopies"
            },
            {
              id: "chargeur-cabine",
              text: "Chargeur + écouteurs"
            },
            {
              id: "snacks-avion",
              text: "Snacks avion"
            },
            {
              id: "stylo",
              text: "Stylo",
              note: "Formulaire douane"
            }
          ]
        }
      ]
    },
    "courses-day1-usa2026": {
      id: "courses-day1-usa2026",
      tripId: "usa-2026",
      type: "shopping",
      title: "🛒 Courses Day 1",
      subtitle: "Vegas — Vendredi 17 avril",
      store: {
        name: "Vons Las Vegas",
        address: "140 S Maryland Pkwy, Las Vegas, NV 89101",
        hours: "6h-24h",
        mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=Vons,+140+S+Maryland+Pkwy,+Las+Vegas,+NV+89101"
      },
      links: [
        {
          label: "← Retour",
          url: "#listes",
          style: "muted"
        },
        {
          label: "🛒 Courses Day 3",
          url: "#listes/courses-day3-usa2026",
          style: "orange"
        }
      ],
      sections: [
        {
          emoji: "🍽️",
          title: "Dîner ce soir",
          subtitle: "Frigo + micro-ondes (pas de cuisine)",
          items: [
            {
              id: "sandwichs",
              text: "🥪 Sandwichs froids",
              note: "Pain + jambon + fromage (dans la glacière)"
            },
            {
              id: "plats-micro",
              text: "Plats micro-ondables",
              note: "Mac & cheese, soupe, burritos surgelés"
            }
          ]
        },
        {
          emoji: "🥐",
          title: "Petit-déj & snacks route",
          subtitle: "Stock 3-4 jours",
          items: [
            {
              id: "pain-de-mie",
              text: "Pain de mie"
            },
            {
              id: "cheddar",
              text: "🧀 Cheddar"
            },
            {
              id: "monterey-jack",
              text: "🧀 Monterey Jack"
            },
            {
              id: "muffins",
              text: "Muffins emballés",
              note: "Type Hostess — se conservent 3-4j"
            },
            {
              id: "barres-cereales",
              text: "Barres de céréales",
              note: "Stock pour plusieurs jours"
            },
            {
              id: "trail-mix",
              text: "Trail mix / crackers"
            },
            {
              id: "jambon-cuit",
              text: "Jambon cuit",
              note: "Deli ham / sliced ham"
            }
          ]
        },
        {
          emoji: "🍓",
          title: "Fruits",
          items: [
            {
              id: "fruits-coupes",
              text: "Fruits coupés en barquette"
            },
            {
              id: "fruits-rouges",
              text: "Fruits rouges",
              note: "Fraises, myrtilles"
            },
            {
              id: "oranges",
              text: "Oranges"
            },
            {
              id: "pommes",
              text: "Pommes"
            },
            {
              id: "bananes",
              text: "Bananes"
            }
          ]
        },
        {
          emoji: "💧",
          title: "Boissons",
          items: [
            {
              id: "eau-bouteilles",
              text: "Eau bouteilles individuelles",
              note: "x12 minimum"
            },
            {
              id: "gallon-eau",
              text: "Gallon d'eau à partager",
              note: "Climat désertique !"
            },
            {
              id: "jus-fruits",
              text: "Jus de fruits",
              note: "Optionnel"
            }
          ]
        },
        {
          emoji: "🧊",
          title: "Équipement",
          items: [
            {
              id: "glaciere-souple",
              text: "Glacière souple",
              note: "~$10 — garder le frais dans le SUV"
            },
            {
              id: "sacs-zip",
              text: "Sacs zip / sachets congélation"
            },
            {
              id: "sopalin",
              text: "Sopalin / essuie-tout"
            },
            {
              id: "sacs-poubelle",
              text: "Sacs poubelle (petits)",
              note: "Pour le SUV"
            }
          ]
        },
        {
          emoji: "💊",
          title: "Compléments santé",
          subtitle: "Si Walmart — sinon Day 6 Vegas",
          items: [
            {
              id: "vitamine-d",
              text: "Vitamine D",
              note: "Vitamin D3 — Nature Made / Kirkland"
            },
            {
              id: "nac",
              text: "NAC",
              note: "N-Acetyl Cysteine 600mg — NOW Foods"
            },
            {
              id: "probiotiques",
              text: "Probiotiques",
              note: "Probiotics — Culturelle / Align"
            },
            {
              id: "omega3",
              text: "Oméga-3",
              note: "Fish Oil Omega-3 — Nature Made"
            },
            {
              id: "l-glutamine",
              text: "L-Glutamine",
              note: "L-Glutamine powder — NOW Foods"
            },
            {
              id: "zinc",
              text: "Zinc",
              note: "Zinc 50mg — Nature's Bounty"
            },
            {
              id: "cerave",
              text: "CeraVe",
              note: "Moisturizing Cream — rayon skincare"
            },
            {
              id: "tylenol",
              text: "Paracétamol",
              note: "Tylenol Extra Strength 500mg"
            },
            {
              id: "advil",
              text: "Ibuprofène",
              note: "Advil / Motrin 200mg"
            }
          ]
        }
      ]
    },
    "courses-day3-usa2026": {
      id: "courses-day3-usa2026",
      tripId: "usa-2026",
      type: "shopping",
      title: "🛒 Courses Day 3",
      subtitle: "Dimanche 19 avril • Cuisine complète à l'Airbnb",
      store: {
        name: "Safeway",
        address: "650 Elm St, Page, AZ 86040",
        hours: "6h-22h 7j/7",
        mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=Safeway,+650+Elm+St,+Page,+AZ+86040"
      },
      links: [
        {
          label: "← Retour",
          url: "#listes",
          style: "muted"
        },
        {
          label: "🛒 Courses Day 1",
          url: "#listes/courses-day1-usa2026",
          style: "orange"
        }
      ],
      sections: [
        {
          emoji: "🍽️",
          title: "Dîner ce soir",
          subtitle: "Cuisine complète — casseroles, poêles, épices fournis",
          items: [
            {
              id: "oeufs-diner",
              text: "🥚 Œufs",
              note: "Eggs — 12-pack"
            },
            {
              id: "pates",
              text: "Pâtes",
              note: "Spaghetti ou penne"
            },
            {
              id: "sauce-tomate",
              text: "Sauce tomate",
              note: "Marinara sauce — Prego / Ragú"
            },
            {
              id: "viande-hachee",
              text: "Viande hachée",
              note: "Ground beef — pour bolognaise"
            },
            {
              id: "salade",
              text: "Salade verte",
              note: "Spring mix ou romaine"
            },
            {
              id: "tomates",
              text: "Tomates",
              note: "Pour la salade"
            },
            {
              id: "pain-ail",
              text: "Pain à l'ail",
              note: "Garlic bread — rayon surgelé"
            }
          ]
        },
        {
          emoji: "🥞",
          title: "American breakfast",
          subtitle: "Cuisine complète à l'Airbnb 🍳",
          items: [
            {
              id: "oeufs",
              text: "🥚 Œufs",
              note: "Eggs — 18-pack (scrambled + fried)"
            },
            {
              id: "bacon",
              text: "🥓 Bacon",
              note: "Thick cut bacon — 1 lb"
            },
            {
              id: "saucisses",
              text: "Saucisses",
              note: "Breakfast sausage links — Jimmy Dean"
            },
            {
              id: "pancake-mix",
              text: "🥞 Pancake mix",
              note: "Krusteaz / Bisquick — Just Add Water"
            },
            {
              id: "sirop-erable",
              text: "🍁 Sirop d'érable",
              note: "Maple syrup — Mrs. Butterworth's"
            },
            {
              id: "beurre",
              text: "Beurre",
              note: "Butter — 1 stick"
            },
            {
              id: "pain-toast",
              text: "Pain de mie",
              note: "Toast bread — toaster dispo"
            },
            {
              id: "hash-browns",
              text: "Hash browns",
              note: "Frozen hash browns — rayon surgelé"
            },
            {
              id: "fromage-us",
              text: "🧀 Fromage en tranches",
              note: "American cheese / cheddar slices"
            },
            {
              id: "lait",
              text: "Lait",
              note: "Milk — pour pancakes + café"
            },
            {
              id: "jus-orange",
              text: "Jus d'orange",
              note: "OJ — half gallon"
            },
            {
              id: "fruits-dej",
              text: "Fruits frais",
              note: "Strawberries + blueberries"
            }
          ]
        },
        {
          emoji: "🍓",
          title: "Fruits & snacks route",
          subtitle: "Restock glacière (Page → Mesquite → Vegas)",
          items: [
            {
              id: "fruits-coupes",
              text: "Fruits coupés en barquette"
            },
            {
              id: "pommes",
              text: "Pommes",
              note: "Se conservent bien"
            },
            {
              id: "bananes",
              text: "Bananes"
            },
            {
              id: "barres-cereales",
              text: "Barres de céréales",
              note: "Restock si besoin"
            },
            {
              id: "trail-mix",
              text: "Trail mix",
              note: "Restock si besoin"
            }
          ]
        },
        {
          emoji: "💧",
          title: "Boissons",
          items: [
            {
              id: "eau-bouteilles",
              text: "Eau bouteilles",
              note: "Restock — x12"
            },
            {
              id: "sodas",
              text: "Sodas",
              note: "Coca, Sprite — optionnel"
            },
            {
              id: "bieres",
              text: "🍺 Bières",
              note: "Pour le gazebo ce soir ? 😎"
            }
          ]
        },
        {
          emoji: "🧊",
          title: "Glacière restock",
          items: [
            {
              id: "glace",
              text: "Sac de glace",
              note: "Ice bag — $2-3 au Safeway"
            },
            {
              id: "sandwichs-route",
              text: "Pain + jambon + fromage",
              note: "Sandwichs route Mesquite/Vegas"
            }
          ]
        }
      ]
    }
  },
  hotels: {
    maison: {
      name: "🏠 Maison",
      note: "Dernière nuit avant l'aventure !"
    },
    "shep-s-miners-inn": {
      name: "Shep's Miners Inn (Airbnb)",
      addr: "9827 2nd St, Chloride, AZ 86431",
      phone: "(928) 565-4251 / (209) 271-7632",
      note: "3 chambres, ghost town Route 66 — 142€",
      checkin: "15:00 — Sonnette/interphone au bureau si arrivée tardive. Gestionnaire sur place.",
      checkout: "Clés à Yesterdays (8h-17h). Avant 8h: laisser dans la porte.",
      extras: "Snacks + eau gratuits à l'arrivée. Frigo + micro-ondes (PAS de cuisine). Carte visite de la ville dispo. Reste dû: $9.20"
    },
    "yavapai-lodge": {
      name: "Yavapai Lodge",
      addr: "11 Yavapai Lodge Road, Grand Canyon, AZ 86023",
      note: "2 chambres — 185€/ch",
      checkin: "15:00",
      checkout: "11:00"
    },
    "airbnb-page": {
      name: "Airbnb Page (David & Julie)",
      addr: "74 Thunderbird Avenue, Page, AZ 86040",
      note: "Perle rare ⭐4.92 — 274€",
      checkin: "16:00 (self check-in)",
      checkout: "11:00",
      amenities: "🔐 Codes d'accès : voir dans l'app • Cuisine équipée (café, thé, épices, sel/poivre) • Clim auto 22°C nuit • ⚠️ Machine à glaçons HS → acheter glaçons + eau potable • Eau du robinet potable",
      links: []
    },
    "virgin-river-casino-hotel": {
      name: "Virgin River Casino & Hotel",
      addr: "100 Pioneer Blvd, Mesquite, NV 89027",
      note: "3 chambres — ~132€ total",
      checkin: "16:00",
      checkout: "11:00",
      amenities: "2 piscines extérieures • 3 jacuzzis • Casino & sportsbook • Restaurants sur place • Parking gratuit • Front Desk 24/7 • 🎰 Programme fidélité Mesquite Gaming = crédit jeu GRATUIT (playmesquite.com/journey-rewards)",
      links: []
    },
    "luxor-linq": {
      name: "Luxor (R+N+L) / LINQ (A+D)",
      addr: "Luxor: 3900 S Las Vegas Blvd / LINQ: 3535 Las Vegas Blvd",
      note: "Via Google Next + Booking",
      checkin: "16:00",
      amenities: "🏊 Piscine"
    },
    "farmhouse-airbnb": {
      name: "Farmhouse Airbnb",
      addr: "2640 3560 West, Hurricane, UT 84737",
      note: "Tiffany & Chris — 266€ • Jacuzzi!",
      checkin: "16:00",
      checkout: "10:00",
      amenities: "🛁 Jacuzzi (17h-22h) — prévenir l'hôte le matin !",
      links: [
        {
          label: "🗺️ Guide Tiffany & Chris",
          url: "https://www.airbnb.fr/s/guidebooks?refinement_paths%5B%5D=%2Fguidebooks%2F2902653"
        }
      ]
    },
    "reilly-s-zion-hideaway": {
      name: "Reilly's Zion Hideaway",
      addr: "390 W Prickly Pear Circle, Orderville, UT 84758",
      note: "Cabane 3ch+2sdb — 314€",
      checkin: "17:00",
      checkout: "10:00",
      links: [],
      access: "🔑 Code porte : 6814"
    },
    "ruby-s-inn": {
      name: "Ruby's Inn",
      addr: "26 South Main Street, Bryce Canyon City, UT 84764",
      note: "3 chambres — ~81€/ch • Petit-déj inclus",
      checkin: "16:00",
      checkout: "11:00",
      amenities: "🏊 Piscine (mars-nov)",
      links: []
    },
    "aarchway-inn": {
      name: "Aarchway Inn",
      addr: "1551 North Highway 191, Moab, UT 84532",
      note: "1 chambre 4 pers — 325€ (2 nuits)",
      checkin: "15:00",
      checkout: "11:00",
      amenities: "🏊 Piscine + 🛁 Hot tub"
    },
    "airbnb-denver": {
      name: "Airbnb Denver (Julie)",
      addr: "2800 Curtis St, Denver, CO 80205",
      note: "Elegant Flat RiNo — 441€ (2 nuits)",
      checkin: "15:00",
      checkout: "11:00",
      access: "🔑 Clé sous le tapis côté droit de la porte d'entrée (face 28th Street). Porte Julie = Curtis St, votre porte = 28th St. Parking rue gratuit devant le portail. ⚠️ Chien sympa \"Sapphire\" peut venir dans la cour — fermer le portail !"
    },
    "b-b-chez-francois": {
      name: "B&B Chez François",
      addr: "4027 Avenue Papineau, Montréal, QC H2K 4K2",
      note: "Plateau-Mont-Royal — Chambre 3, 2e étage",
      checkin: "Self check-in (code)",
      checkout: "11:00",
      access: "🔑 Codes d'accès : voir dans l'app | Parking: derrière (panneau BB). Entrée porte 4027 ou 4037, escalier ext. droit → 2e étage. ☎️ +1 514-239-4638"
    }
  },
  locations: {
    preparatifs: {
      lat: 43.7,
      lon: 7.27,
      tz: "Europe/Paris"
    },
    "chloride-az": {
      lat: 35.4,
      lon: -114.21,
      tz: "America/Phoenix"
    },
    "grand-canyon": {
      lat: 36.06,
      lon: -112.14,
      tz: "America/Phoenix"
    },
    "page-az": {
      lat: 36.91,
      lon: -111.46,
      tz: "America/Phoenix"
    },
    "mesquite-nv": {
      lat: 36.8,
      lon: -114.07,
      tz: "America/Los_Angeles"
    },
    "las-vegas": {
      lat: 36.17,
      lon: -115.14,
      tz: "America/Los_Angeles"
    },
    "hurricane-ut": {
      lat: 37.17,
      lon: -113.29,
      tz: "America/Denver"
    },
    orderville: {
      lat: 37.28,
      lon: -112.65,
      tz: "America/Denver"
    },
    "bryce-canyon": {
      lat: 37.63,
      lon: -112.17,
      tz: "America/Denver"
    },
    "moab-ut": {
      lat: 38.57,
      lon: -109.55,
      tz: "America/Denver"
    },
    "denver-co": {
      lat: 39.74,
      lon: -104.99,
      tz: "America/Denver"
    },
    montreal: {
      lat: 45.52,
      lon: -73.57,
      tz: "America/Toronto"
    }
  }
};