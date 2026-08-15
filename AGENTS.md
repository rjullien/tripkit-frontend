# AGENTS.md — tripkit-frontend

## LLM / Safari

Toute action UI qui appelle un LLM (Léo, Discovery, Polarsteps, Construction)
suit le skill **tripkit-llm-jobs** (`.cursor/skills/tripkit-llm-jobs/SKILL.md`) :

- `POST` → 202 `{jobId}` (timeout 15 s), jamais un POST qui attend Bifrost
- stream `GET /leo/jobs/{id}/stream` + `resumeIfNeeded`
- store `GET` si le SSE tombe (lock iPhone)

Ne pas « corriger » un 502 en montant `timeoutMs` à 120 s / 240 s.
