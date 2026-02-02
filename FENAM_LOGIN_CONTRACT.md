# Contratto FENAM – Login socio e callback

## URL verso FENAM

Enotempo reindirizza l’utente a:

```
https://fenam.website/affiliazione?source=enotempo&returnUrl=<ENCODED_RETURNURL>
```

- **returnUrl**: solo il **valore** è encodato con `encodeURIComponent` (non il path).
- **returnUrl** deve puntare a un endpoint Enotempo allowlisted (host `enotempo.it` o `www.enotempo.it`).
- Base FENAM: sempre senza www (es. fenam.website, non www.fenam.website).
- Esempio: `returnUrl=https%3A%2F%2Fenotempo.it%2Fapi%2Fauth%2Ffenam%2Fcallback%3Fredirect%3D%252Fit%252Fcene`

## Callback Enotempo

- **Rotta stabile**: `GET /api/auth/fenam/callback`
- Dopo il login, FENAM redirige a `returnUrl` aggiungendo il token in query (es. `fenamToken=...` o `token=...`).
- Enotempo:
  1. Legge il token dalla query.
  2. Verifica HMAC con `FENAM_HANDOFF_SECRET`.
  3. Controlla `exp` e `iss === "fenam"`.
  4. Crea/aggiorna `FenamMember` e imposta il cookie di sessione.
  5. Redirect a path allowlisted (parametro `redirect` solo relativo o host enotempo.it/www.enotempo.it).

## Sicurezza

- Rifiuto se token mancante o invalido (401).
- Open redirect: il parametro `redirect` è allowlisted (path relativo o host enotempo.it / www.enotempo.it).
- Log: nessun token completo né URL completa; solo flag (hasToken, validSignature) e in debug.

## P0 Go-live assertions

- **FENAM_LOGIN_URL** deve puntare a `/affiliazione` (es. `https://fenam.website/affiliazione`), no www.
- **Callback** risponde con header **Cache-Control: no-store** (e Pragma: no-cache) in tutte le risposte.
- **Redirect** che inizia con `//` è bloccato → fallback a path default (no open redirect).

## Checklist test manuale

- [ ] **Redirect corretto**: click "Accedi con FENAM" → redirect a `fenam.website/affiliazione?source=enotempo&returnUrl=...` (nessun www, nessun `/%2F` nel path).
- [ ] **Ritorno da FENAM**: completamento magic link su FENAM → ritorno a `/api/auth/fenam/callback?...&fenamToken=...` (o `token=...`).
- [ ] **Token valido**: token valido → sessione Enotempo creata (cookie `fenamToken`), redirect a `redirect` o default `/it/cene`.
- [ ] **Token invalido/riutilizzato**: token mancante o firma non valida → risposta 400/401, nessuna sessione creata.
