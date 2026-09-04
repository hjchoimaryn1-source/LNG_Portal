<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes ??APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` ??verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# NIAS LNG Portal - Industrial SCADA & CMMS Architecture Guidelines

## 1. Zero-Token Scan & Targeted Inspection Protocol
- NEVER load entire large files (>250 lines) into context at once.
- Always use CLI tools (PowerShell / ripgrep) to locate specific line numbers before editing:
  - Line count check: `(Get-Content <path> | Measure-Object -Line).Lines`
  - Pattern pinpointing: `Select-String -Path <path> -Pattern "<target>"`
- Only view targeted line ranges (e.g., `Viewed file.tsx:100-150`) to strictly minimize token consumption.

## 2. Architecture-First Requirement (Strict Approval Gate)
- DO NOT start coding immediately upon receiving new requirements, draft views, or feature requests.
- First, propose the module directory structure and file breakdown (with file names and their single responsibilities).
- Wait for explicit user approval before writing any implementation code.

## 3. Industrial SCADA-Grade File Design & Thresholds
- **Max File Length (Hard Cap)**: No single file may exceed **250 lines**. If logic expands, extract child components, custom hooks, or helper functions into separate files immediately.
- **Strict Separation of Concerns**:
  - **UI Layer (`*View.tsx`, `tabs/*Tab.tsx`)**: Pure layout, rendering DOM, and user interactions. Maximum 250 lines.
  - **State Layer (`hooks/use*.ts`)**: Encapsulate multi-state workflows, drag-and-drop, complex forms, and calendars.
  - **Logic/Data Layer (`utils/*.ts`, `services/*.ts`)**: Physics formulas, mass-balance math, date calculations, sorting, and CSV/Excel file exports must reside in pure functions without React bindings.
  - **Modals & Drawers (`modals/*Modal.tsx`, `modals/*Drawer.tsx`)**: Strictly standalone files. NEVER declare modals inline inside view or tab JSX.

## 4. In-Place Refactoring Protocol (The Boy Scout Rule)
Whenever revisiting, modifying, or extending any existing domain or tab:
1. Check the target file size first via CLI.
2. If the file exceeds 250 lines or contains inline modals/heavy calculations:
   - Perform an IN-PLACE extraction FIRST before implementing any new features.
   - Clean dead code immediately (unused states, ghost modal JSX, uncalled handlers).
3. Run `node_modules/typescript/bin/tsc --noEmit` to verify 0 errors after every modification.

## 5. Output Constraints for AI Assistants
- Do not output entire updated files when providing changes. Provide concise diffs or focused, targeted commands.
- Always verify TypeScript compilation (`tsc --noEmit`) after refactoring or file creation.
