# GameBoost P1 implementation audit and API contract

## Audit outcome

The site is a Cloudflare Worker application using D1, R2 and Drizzle.  It already
has an Ed25519 release signing key path (`RELEASE_SIGNING_KEY`) and a signed
`GET /api/v1/releases/latest` response.  This P1 extends that trust root; no
client API key is introduced.

The Windows app is a .NET Framework / C# source build.  It already writes and
parses JSON `.gbsample`, has a restrictive `PrescriptionActionType` allow-list,
and writes local per-action apply receipts with automatic rollback.  It has no
HTTP client, installation identity, signed configuration envelope, upload
consent UI, or remote receipt reporting.

Important safety findings:

- `SafeApplyService` only executes known local actions and never executes a
  server-provided command. P1 preserves that property.
- `WinRing0x64.dll` and `WinRing0x64.sys` are present in the source directory.
  P1 does not reference, load, copy, or package either file. They must be
  removed from release staging separately after confirming no legacy release
  depends on them.
- Legacy UI code contains broader historical tuning code. The P1 online path is
  wired only to `SafeApplyService`; it does not use the legacy registry/process
  tuning routines.

## Identity and access model

`installation_id` is a randomly generated UUID stored locally, not a hardware
fingerprint. Device fingerprint is used only to bind a signed prescription to
the device which created its sample. A case code is random and non-sequential;
the player accesses a case through a single-use opaque view token. Optimizer
requests require `Authorization: Bearer $OPTIMIZER_TOKEN`; this is the sole
server-side access control for Li Junxian in P1.

## API contract (all HTTPS only)

Common errors: `{ "error": "stable_code", "message": "human readable" }`.
Public and mutation endpoints are rate limited by a salted IP bucket and log an
audit event. Failure to use the rate limiter fails closed for mutations.

| Method and path | Caller | Request | Response / rules |
| --- | --- | --- | --- |
| `GET /api/v1/releases/latest` | EXE | `product`, `channel`, `platform` | Existing signed update manifest. EXE compares SemVer and only displays the download URL; it never installs. |
| `POST /api/v1/installations` | EXE | `{installation_id, app_version}` | Upserts random installation only. No fingerprint. |
| `POST /api/v1/cases` | EXE | `{installation_id, player_description}` | Creates random case code plus a one-time view token; returns `{case_code, view_url, upload_url}`. |
| `POST /api/v1/cases/{code}/samples` | EXE | multipart `sample` `.gbsample`, headers `x-installation-id`, `x-sample-sha256`, `x-consent: accepted` | 201 after extension, max-size, UTF-8 JSON, schema, required structure, sample-id, and SHA-256 validation; raw file goes to R2 and metadata to D1. |
| `GET /api/v1/cases/view/{token}` | Player | none | Consumes token atomically and returns safe case/status/report/conversation/prescription summary. |
| `DELETE /api/v1/cases/view/{token}` | Player | none | Deletes case metadata and R2 objects, revokes links. |
| `GET /api/v1/admin/cases` | Optimizer | Bearer token | Case list, no raw download URLs. |
| `GET /api/v1/admin/cases/{code}` | Optimizer | Bearer token | Case, player description, sample summary, report and conversation. |
| `POST /api/v1/admin/cases/{code}/status` | Optimizer | `{status, note?}` | State transition and audit record. |
| `POST /api/v1/admin/cases/{code}/conversation` | Optimizer | `{body}` | Appends optimizer message. |
| `POST /api/v1/admin/cases/{code}/prescriptions` | Optimizer | multipart `.gbcfg` | Validates safe JSON prescription, signs SHA-256 with existing Ed25519 key, stores immutable R2 object and D1 metadata. |
| `GET /api/v1/cases/{code}/prescription` | EXE | `x-installation-id`, `x-sample-id`, `x-device-fingerprint`, `x-game-id` | Returns a signed envelope only when every binding matches. |
| `POST /api/v1/cases/{code}/apply-receipts` | EXE | `{installation_id,prescription_id,receipt}` | Stores application/rollback receipt metadata; never accepts commands. |

The `.gbcfg` signed envelope is `{ schema: "gameboost.signed-prescription/1",
payload, sha256, signature, key_id }`; the signature is Ed25519 over the ASCII
hex SHA-256. The EXE hashes canonical raw payload JSON, verifies signature with
the embedded public key, verifies Sample ID/device fingerprint/Game ID, then
re-runs its local allow-list before any action. Any failure prevents apply.

## Data and retention

Migration `0002_p1_network_loop.sql` creates: `installations`, `cases`,
`samples`, `reports`, `conversations`, `prescriptions`, `apply_receipts`,
`releases` (existing), and `audit_logs`. Case deletion removes dependent rows
and R2 sample/config objects. Raw samples are never rendered in public pages.
