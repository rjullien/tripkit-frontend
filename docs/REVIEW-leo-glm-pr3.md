# Review PR #3 — Design: Onglet Réservations + QA Cross-Check

**Reviewers**: Léo (Hermes) + GLM-5.2  
**Date**: 2026-08-02  
**Verdict**: ✅ Approuver le design, implémenter avec les 3 corrections  
**Suivi**: ✅ Corrections intégrées dans le design le 2026-08-08 — statut **Ready for implementation**

---

## 🔴 Point 1 — Ordre des sections pas optimal → ✅ Intégré

**Décision** (design §2.4) : grouper **par type** avec dates visibles dans chaque en-tête de carte. Pas de timeline chronologique globale (vols aller/retour encadrent tout le voyage).

Ordre figé : Vols → Voiture → Traversier → Événements (triés par date) → Hébergements.

---

## 🔴 Point 2 — Mapping champs cards ↔ sections → ✅ Intégré

**Décision** (design §2.A.2) : table `FIELD_MAP` obligatoire avant tout code QA.

Réalité quebec-2026 prise en compte :
- ferry : `orderRef` ↔ `booking.orderNumber` ; `total` ↔ `booking.totalPrice`
- events : `orderRef` en substring dans `card.data.ref` ; total souvent dans `data.text` (pas de `totalPrice` isolé)
- carRental : `bookingRef` ↔ substring de `data.confirmation`
- Normalisation monétaire + match substring documentés

---

## 🔴 Point 3 — Cas edge → ✅ Intégré

| Edge | Décision |
|---|---|
| Empty state | Label toujours **"Résa"** ; sections absentes si pas de data ; hotels-only OK |
| Tri events | `sort` par `date` (§2.3) |
| Cards sans type | Guard `if (!card?.type && !day.booking) continue` |
| Day index ferry | **1-based** : `daysBetween(start, date) + 1` → quebec ferry = **day 10** (le day 9 n'a qu'une card `info` d'aperçu). La review initiale disait day 9 / retirer le `+1` — incorrect vs seed réel |

---

## ✅ Points forts (inchangés)

- Rétrocompatibilité : `data-tab="hotels"`
- Aucun backend
- 1 fichier = 1 composant
- Réutilisation `HotelCard.render()`
- Tasks 1+4 parallélisables

---

## 🟡 Suggestions mineures → ✅ Intégré

1. Label **"Résa"** (avec accent)
2. Vérif post-implémentation sur tous les seeds (checklist §9)
3. **Ajout 2026-08-08** : `ferry`/`events` aussi dans `SeedMerge.TRIP_META_FIELDS` (leçon régression mapHtml)
4. **Ajout 2026-08-08** : tags clean sur les cartes Résa — même pattern hotels (`tags[]` → `.badge`, `cancellation` 🟢🔴⚠️ obligatoire, type badge). Voir design §2.7

---

*Review Léo/GLM 2026-08-02 — finalisation design 2026-08-08*
