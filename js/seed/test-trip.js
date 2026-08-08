/**
 * Test seed — generic trip for CI/testing purposes.
 * No PII — safe for public repos.
 */
var SEED_TEST_TRIP = {
  trip: {
    id: "test-trip-2026",
    name: "Test Trip 2026",
    emoji: "🌍",
    startDate: "2026-06-15",
    endDate: "2026-06-18",
    mapImage: "map-overview.png",
    routeUrl: "https://www.google.com/maps/d/viewer?mid=test-route",
    travelers: [
      { name: "Alice", emoji: "👩", role: "owner" },
      { name: "Bob", emoji: "👨", role: "traveler" }
    ],
    phases: [
      { name: "City", label: "CITY — Exploration", range: [0, 1] },
      { name: "Nature", label: "NATURE — Hiking", range: [2, 3] }
    ]
  },
  days: [
    {
      day: 0, emoji: "📋", label: "Prep — Packing day",
      from: "Home",
      timeline: [
        { t: "🧳", d: "Pack bags" },
        { t: "📋", d: "Check documents" },
        { t: "🌤️", d: "Check weather forecast" }
      ],
      highlights: ["⚠️ Don't forget adapter", "🌡️ 20-25°C expected"]
    },
    {
      day: 1, emoji: "✈️", label: "Arrival — City center",
      from: "Home", to: "Destination",
      hotelId: "city-hotel",
      locationId: "city-center",
      timeline: [
        { t: "08:00", d: "✈️ Flight departure", accent: true },
        { t: "12:00", d: "🏨 Hotel check-in" },
        { t: "14:00", d: "🚶 Walking tour old town" },
        { t: "19:00", d: "🍽️ Dinner at local restaurant", green: true }
      ],
      highlights: ["💡 Book restaurant in advance", "🏛️ Old town is UNESCO listed"]
    },
    {
      day: 2, emoji: "🏛️", label: "City exploration",
      from: "Destination",
      hotelId: "city-hotel",
      locationId: "city-center",
      timeline: [
        { t: "09:00", d: "☕ Breakfast at hotel" },
        { t: "10:00", d: "🏛️ Museum visit" },
        { t: "13:00", d: "🍽️ Lunch" },
        { t: "15:00", d: "🎨 Art gallery" },
        { t: "18:00", d: "🥂 Sunset drinks", green: true }
      ],
      highlights: ["🎨 Gallery is free on Tuesdays"]
    },
    {
      day: 3, emoji: "🏡", label: "Return home",
      from: "Destination", to: "Home",
      locationId: "city-center",
      timeline: [
        { t: "09:00", d: "☕ Last breakfast" },
        { t: "11:00", d: "🚗 Transfer to airport" },
        { t: "14:00", d: "✈️ Flight home", accent: true }
      ],
      highlights: ["🎬 Great trip!"]
    }
  ],
  hotels: {
    "city-hotel": {
      name: "Grand Hotel City Center",
      addr: "123 Main Street, Destination",
      phone: "+1 555-0100",
      note: "4-star hotel, central location.",
      checkin: "14:00",
      checkout: "11:00",
      cancellation: "🟢 Free cancellation until June 10",
      amenities: ["🏊 Pool", "☕ Breakfast included", "📶 Free WiFi"],
      links: [{ label: "🌐 Website", url: "https://example.com" }]
    }
  },
  flights: {
    outbound: {
      pnr: "TESTPNR",
      airline: "Test Air",
      class: "Economy",
      price: "200 EUR",
      cancellation: "🔴 Non refundable",
      tags: ["Bagage included"],
      from: "AAA",
      to: "BBB",
      dep: "2026-06-15T08:00",
      arr: "2026-06-15T12:00"
    }
  },
  carRental: {
    bookingRef: "RENT123",
    provider: "TestRent",
    vehicle: "Compact",
    price: "100 EUR",
    cancellation: "⚠️ See rental terms",
    tags: ["Unlimited km"],
    fuelPolicy: "Full to full",
    pickup: { date: "2026-06-15", time: "10:00", agency: "Airport" },
    return: { date: "2026-06-18", time: "10:00", agency: "Airport" }
  },
  ferry: {
    route: "Port A → Port B",
    orderRef: "FERRY1",
    date: "2026-06-16",
    time: "09:30",
    vehicle: "Car + 2 adults",
    total: "50 EUR",
    deposit: "10 EUR",
    balance: "40 EUR at dock",
    cancellation: "🟢 Refundable >24h",
    tags: ["Car + 2 adults"]
  },
  events: {
    "show-test": {
      name: "Test Show",
      orderRef: "EVT1",
      date: "2026-06-17",
      total: "80 EUR",
      cancellation: "🔴 Non refundable",
      tags: ["Front row"]
    }
  },
  locations: {
    "city-center": { lat: 48.8566, lon: 2.3522, tz: "Europe/Paris" }
  },
  restaurants: {
    "1": {
      main: { name: "Le Bistro", icon: "🍽️", note: "Local cuisine", price: "€€", rating: 4.5 },
      alts: [{ name: "Café Central", note: "Casual option" }]
    }
  },
  culture: [
    {
      title: "🌍 Local Culture",
      sections: [
        { h: "History", p: "Rich history spanning centuries with diverse influences." },
        { h: "Cuisine", p: "Known for fresh ingredients and traditional recipes." }
      ]
    }
  ],
  lists: {
    "checklist-test": {
      id: "checklist-test",
      type: "packing",
      title: "🧳 Packing List",
      sections: [
        {
          title: "Essentials",
          items: [
            { id: "e1", text: "Passport" },
            { id: "e2", text: "Phone charger" },
            { id: "e3", text: "Travel adapter" }
          ]
        }
      ]
    }
  }
};
