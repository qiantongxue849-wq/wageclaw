# WageClaw

A quiet desktop capybara with occasional local speech bubbles about earnings and time until rest.

The lightweight app provides today's and this month's estimated earnings, an off-work countdown, the next public holiday, personal Spring Festival leave, and an expected annual bonus date. It runs locally without login, with light/dark themes, salary privacy and a desktop pet: single-click for a short report, double-click for the detail panel.

Start with `npm install`, `npm run dev`, then `npm run electron`. Run `npm run check` for lint, type checks, domain tests and a production build. Set `WAGECLAW_DEV_SERVER_URL` if the development server is not on port 5173.

Earnings are estimates based on monthly salary and scheduled working days. Shifts are a single continuous block: lunch breaks count as working time and never pause accrual. They are not bank deposits. The app calculates from the current time, so closing or reopening it does not lose progress. Expected bonuses remain separate.

Only verified 2026 mainland China holiday arrangements are bundled; unknown years fall back to personal workweek settings with a notice. Legacy archives remain intact and are not converted into earned income.

The desktop host owns scheduling and atomic file storage; closing the detail panel destroys its window while the pet continues running. Current platform validation and measured limitations are recorded in [V2 verification](docs/DESKTOP_PET_V2_VERIFICATION.md).

See [README.md](README.md), [Architecture](docs/ARCHITECTURE.md), and [Implementation record](docs/LIGHTWEIGHT_IMPLEMENTATION.md) for details. Previous game, pet and authentication documents are historical references only.
