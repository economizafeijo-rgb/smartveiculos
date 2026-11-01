<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Project rules

- Garage data (vehicles + service records) lives in browser localStorage via `src/lib/garage/store.ts` (useSyncExternalStore, Zod-validated on load) — the app has no backend yet; swap the store implementation if cloud sync is added.
- Pure business rules (due status, reminders, totals, odometer) live in `src/lib/garage/logic.ts` with tests beside it — keep UI free of these calculations so they stay testable.
- The odometer only moves forward when a service record is saved; only the explicit "update km" action may set it lower — avoids old records rewinding mileage.
