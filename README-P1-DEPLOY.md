# GameBoost P1 deployment and acceptance

## Migration

Apply `drizzle/0002_p1_network_loop.sql` after the existing 0000 and 0001
migrations. It creates `installations`, `cases`, `samples`, `reports`,
`conversations`, `prescriptions`, `apply_receipts`, and `audit_logs`; the
existing `releases` table remains the release source of truth.

## Bindings and environment values

Keep the existing `DB` (D1) and `FILES` (R2) bindings. Configure secrets only
in the Worker control plane:

- `RELEASE_SIGNING_KEY`: base64 PKCS8 Ed25519 private key; signs releases and
  `.gbcfg` hashes.
- `RELEASE_TOKEN`: existing release publisher token.
- `OPTIMIZER_TOKEN`: long random bearer token held only by Li Junxian.
- `RATE_LIMIT_SALT`: random server-only salt for hashed rate-limit buckets.
- `DEEPSEEK_API_KEY`: existing Agent key, if the Agent endpoint is enabled.

No environment value belongs in the EXE, page source, R2 metadata visible to
the client, or Git.

## Deploy

1. Back up D1 and deploy migration 0002.
2. Set the secrets above, deploy the Worker, and confirm both `DB` and `FILES`
   bindings are present.
3. Run `npm run build` from the site directory.
4. Build `D:\GameBoost\Optimizer\build.bat`; distribute only
   `dist\v1.3-dev\GameBoost.exe`. Do not stage WinRing0 files.
5. Publish the EXE through the existing signed release procedure in
   `README-release.md`.

## Acceptance checks

- Upload a valid `.gbsample` with consent and matching hash; verify a random
  `GB-` case code, R2 object and D1 metadata.
- Repeat the view URL: first request succeeds and second returns 404.
- Try `.json`, oversized bodies, bad hash, invalid schema and unsafe `.gbcfg`:
  all must fail.
- Use no/invalid optimizer token: admin endpoints return 401.
- Change a config's device, sample, game or signature: EXE must not apply it.
- Force a local apply action to fail: previous actions must roll back and the
  receipt remains available to one-click restore.
