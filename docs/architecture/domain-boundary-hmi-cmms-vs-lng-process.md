# Domain Boundary ADR: HMI/CMMS vs LNG-Process

**Status:** Accepted (documents existing, already-in-practice behavior)
**Date:** 2026-09-17
**Related:** [`lng-process-data-map.md`](./lng-process-data-map.md) (PRE-FLIGHT II audit,
2026-09-16), Stage 1 `usePowerThermalStorage` extraction (commit `7d42a2a`), CSV-exposure
nav fix (commit `e240f56`).

> Note on provenance: this document was reconstructed by inspecting the current repo
> tree and commit history directly (`src/` top-level listing, `git show` on the cited
> commits), not transcribed verbatim from a "Task 3" diagnostic file — no such file
> exists in the repo. Where a claim below is repo-verifiable, it was verified as part
> of writing this ADR. Treat this as the current source of truth going forward.

---

## 1. Domain Definitions

### HMI/CMMS domain
Top-level `src/` directories using the `cmms-` prefix:

```
src/cmms-auth/        src/cmms-daily-ops/    src/cmms-environment/
src/cmms-field-guard/ src/cmms-moc/          src/cmms-mro-bridge/
src/cmms-trucking/
```

Plus `src/hmi/` (alarm/HMI overlay logic — same architectural family, no `cmms-`
prefix). Characteristic shape: SQLite-backed via a per-module DB singleton
(`cmmsDbSingleton.ts` or module-local equivalent) + a DAO layer (`dao/*.ts`) +
dedicated read/write hooks (e.g. `src/cmms-daily-ops/hooks/usePatrolSaveHandler.ts`).
Components never touch `localStorage`/`fetch`/the DB layer directly.

### LNG-Process domain
`src/components/locations/**` — `NiasTerminalView.tsx`, `ArunTerminalView.tsx`,
`MvSaviourView.tsx`, and their `arun/`, `saviour/`, `nias/` sub-trees — plus the
domain data/services that back them: `src/context/PortalDataContext.tsx`,
`src/services/tankOperationsService.ts`, `src/types/lng.ts`,
`src/data/pltmgEngineSpec.ts` and siblings. Characteristic shape (pre-existing):
nearly every tab reads/writes through `usePortalData()` → `PortalDataContext.tsx`
(localStorage-backed), not a SQLite DAO.

### The one exception: `src/gas-metering/`
HMI/CMMS-**style** module (own DB singleton `gasMeteringDbSingleton.ts`, DAO
`gasMeteringLedgerDao.ts`, hook `useGasMeteringLedger.ts`, API route
`/api/v1/cmms/gas-metering-ledger`) that does **not** use the `cmms-` prefix,
because it was carved out of the LNG-Process `NiasGasQualityTab.tsx` /
`NiasGasQualityLedgerTab.tsx` (commit `e240f56`) to give gas-metering ledger data a
real DAO instead of `PortalDataContext` localStorage. It sits physically outside
`src/components/locations/`, so treat it as HMI/CMMS-domain for persistence-pattern
purposes despite the naming mismatch.

---

## 2. Rule Going Forward

**Any NEW LNG-Process file that needs persistence MUST go through a dedicated
hook.** Never call `localStorage`/`fetch`/a DB client directly inside a component
body. Three accepted reference patterns already in the codebase:

| Hook | Module | Backing store |
|---|---|---|
| `usePatrolSaveHandler` | `cmms-daily-ops` | SQLite via DAO |
| `useGasMeteringLedger` | `gas-metering` | SQLite via DAO, over `fetch` |
| `useNiasPowerThermalStorage` | `locations/nias/hooks` (Stage 1, commit `7d42a2a`) | `localStorage` |

The last one matters most for LNG-Process: it does **not** require a DB migration
to comply with this rule. Wrapping the same `localStorage` calls in a hook is
sufficient — the point is the abstraction boundary, not the storage medium.

```ts
// Not allowed in a component body:
window.localStorage.setItem(KEY, JSON.stringify(state));

// Required instead:
const { save } = useSomeDomainStorage();
save(state);
```

This is a forward-looking rule for new files only — see §3 for why it is not
retroactively enforced on the existing LNG-Process surface.

---

## 3. Known, Accepted Exception: `PortalDataContext.tsx`

Nearly the entire **pre-existing** LNG-Process domain reads/writes directly through
`usePortalData()` → `PortalDataContext.tsx` (localStorage-backed), confirmed as a
ZERO-TOUCH/hard-block file across the PRE-FLIGHT II audit
(`docs/architecture/lng-process-data-map.md`) and every prior stage's HARD-BLOCK
FILES list. **This is not a violation of §2 to "fix" retroactively** — it is an
accepted, load-bearing exception:

- **Blast radius:** `PortalDataContext` has **32 consumer files** across the
  codebase (`grep -rln PortalDataContext src`, verified 2026-09-17). A migration
  off it is a cross-cutting architecture change, not a component-local refactor.
- **Related, still-open context:** the 2026-09-16 CSV-exposure fix (commit
  `e240f56`) removed the `LngEnergyOperationView` nav route that rendered raw CSVs
  directly and replaced its ledger reads with the new `gas-metering` DAO/hook
  (commit `9a91b6e` then ingested the ground-truth data). That closed the *UI*
  exposure path. It did **not** remove the underlying `public/data/*.csv` files —
  those remain physically present under `public/` (Next.js serves `public/`
  statically, so they are still web-reachable by direct URL). Full closure of the
  CSV-exposure issue is a separate, still-open item — out of scope for this ADR,
  flagged here only because it is adjacent evidence of the same theme: **partial,
  staged migration off legacy storage is normal and acceptable in this codebase;
  it does not imply the legacy path itself is now open for ad hoc rewrites.**

**Any future stage that wants to migrate an *existing* `PortalDataContext`
consumer off localStorage (not just wrap a new file per §2) requires an explicit,
separately-scoped HJ decision before any code is written.** This ADR documents the
boundary; it does not grant that approval.

---

## 4. Checklist: "If You Are About to Touch `PortalDataContext.tsx`"

1. **Stop.** Do not edit `PortalDataContext.tsx` as a side effect of an unrelated
   task. It has been a HARD-BLOCK / ZERO-TOUCH file in every stage to date.
2. Confirm the task you were given actually names `PortalDataContext.tsx` as
   in-scope. If it doesn't, whatever you're trying to fix belongs in a wrapper
   hook per §2, not in the context file itself.
3. If the task genuinely requires changing `PortalDataContext.tsx` (schema shape,
   migration off localStorage, etc.): stop before writing code and get explicit,
   separately-scoped HJ approval first. There is currently no standalone
   `overview.md` gate document in this repo (checked 2026-09-17, does not exist)
   — until one exists, **this ADR (§3) is the approval-requirement reference**;
   treat "no HJ sign-off cited for this specific change" as blocking, the same
   way the ALTER-only DB policy in `CLAUDE.md` §5 requires a stop-and-confirm.
4. Re-run the 32-consumer grep (`grep -rln PortalDataContext src`) before scoping
   any migration — the count will drift as the codebase grows; do not trust a
   cached number from this document.
5. Never combine a `PortalDataContext.tsx` change with unrelated feature work in
   the same commit — its blast radius deserves its own isolated review.
