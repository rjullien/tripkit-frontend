# AGENTS.md — tripkit-frontend

## Services centralisés (backend)

**Référence : [`../tripkit/SERVICES.md`](https://github.com/rjullien/tripkit/blob/main/SERVICES.md)**

Le frontend ne doit **jamais** appeler directement un service externe (météo,
géocodage, Overpass, LLM). Tout passe par les endpoints backend qui encapsulent
les services centralisés. Voir le doc ci-dessus pour la liste complète.

## LLM / Safari

Toute action UI qui appelle un LLM (Léo, Discovery, Polarsteps, Construction)
suit le skill **tripkit-llm-jobs** (`.cursor/skills/tripkit-llm-jobs/SKILL.md`) :

- `POST` → 202 `{jobId}` (timeout 15 s), jamais un POST qui attend Bifrost
- stream `GET /leo/jobs/{id}/stream` + `resumeIfNeeded`
- store `GET` si le SSE tombe (lock iPhone)

Ne pas « corriger » un 502 en montant `timeoutMs` à 120 s / 240 s.
