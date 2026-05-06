# Règles Hébergement TripKit

## Quand s'applique

- Tout voyage où on n'est PAS hébergé chez quelqu'un (pas Langon = chez Camille)
- S'applique aux 2 trips Canada et tout futur voyage avec hébergements à réserver

## Règles

1. **Chaque hôtel doit avoir un champ `city`** — la ville/commune d'hébergement
2. **Si l'hébergement n'est pas encore réservé** → ajouter `"booked": false` et `"note": "À réserver"`
3. **Si 2 jours consécutifs au même endroit** → regrouper dans le même hôtel (ex: "2 nuits, J5-J6")
4. **Quand c'est réservé** → mettre `"booked": true` + ajouter `ref`, `booking`, `addr`, `checkin`, `checkout`

## Format attendu (non réservé)

```json
{
  "id": "quebec-city",
  "name": "Hébergement Québec",
  "city": "Québec City",
  "type": "hotel",
  "booked": false,
  "note": "À réserver — 2 nuits (J3-J4)"
}
```

## Format attendu (réservé)

```json
{
  "id": "quebec-city",
  "name": "Auberge Saint-Louis",
  "city": "Québec City",
  "type": "hotel",
  "booked": true,
  "booking": "Booking.com",
  "ref": "123456",
  "addr": "123 Rue Saint-Louis, Québec",
  "checkin": "15:00",
  "checkout": "11:00",
  "note": "2 nuits (J3-J4) — 150€/nuit"
}
```
