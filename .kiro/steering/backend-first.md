# Architecture — Backend-first (pas d'appel tiers direct)

> **Règle :** le frontend ne doit JAMAIS appeler une API tierce directement.
> Tout passe par le backend TripKit qui centralise le routing, le cache, et les credentials.

## Pourquoi

- **Routing intelligent** : le backend choisit le meilleur provider (ex: MSC au Canada, NWS aux USA)
- **Cache serveur** : évite de marteler les APIs publiques depuis chaque device
- **Secrets** : les tokens / API keys restent côté serveur
- **Fallback** : le backend bascule automatiquement sur un backup si le provider principal tombe
- **Cohérence** : daily brief, plus chat, et frontend voient les mêmes données

## Services disponibles via le backend

| Besoin | Endpoint backend | Appel tiers direct ? |
|--------|-----------------|---------------------|
| Météo (prévisions) | `GET /weather/forecast?lat=X&lon=X&country=XX&days=N` | ❌ sauf fallback offline |
| Météo (par trip) | `GET /trips/{id}/weather?lat=X&lon=X` | ❌ |
| Discovery POI | `POST /trips/{id}/discovery/search` | ❌ |
| Léo (chat IA) | `POST /leo/chat/stream` | ❌ |
| Plus Chat (assistant) | `POST /plus/chat/stream` | ❌ |
| Admin/Health check | `POST /trips/{id}/admin-check` | ❌ |
| Nuisance check | `POST /trips/{id}/nuisance-check` | ❌ |
| Polarsteps caption | `POST /trips/{id}/polarsteps/caption` | ❌ |

## Exceptions acceptées

| Cas | Pourquoi |
|-----|----------|
| Open-Meteo **fallback offline** (`weather.js` renderInline) | Quand `API.isReachable() === false`, la météo inline reste dispo |
| Open-Meteo **modal hourly** (`weather.js` openModal) | Les données horaires ne sont pas encore exposées par le backend |

Ces exceptions sont **temporaires** — quand le backend exposera les hourly, le fallback sera supprimé.

## Comment utiliser un endpoint backend

```javascript
// ✅ Correct : passer par le backend
const url = API.url(`/weather/forecast?lat=${lat}&lon=${lon}&country=${country}&days=16`);
const resp = await fetch(url, {
  headers: { 'Authorization': 'Bearer ' + API.getToken() },
  signal: AbortSignal.timeout(12000)
});
const data = await resp.json();

// ❌ INTERDIT : appel direct à un tiers
const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}...`;
```

## Ajouter un nouveau besoin

1. Vérifier si le backend expose déjà un endpoint (README.md / DATAFLOW.md)
2. Si non → ouvrir un PR backend d'abord, puis consommer depuis le frontend
3. Ne jamais ajouter un `fetch('https://api.xxx.com/...')` dans le frontend
