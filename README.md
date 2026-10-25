# SeatFinder — Smart Restaurant Seat Finder Using BFS

A simple, complete university-level project that finds the nearest available
restaurant table using the **Breadth-First Search (BFS)** algorithm.

Built with **only HTML, CSS, and vanilla JavaScript**. No frameworks, no
backend, no database, no API, no login. It runs as a static website.

## What it does

- Shows a restaurant floor plan as a grid: entrance, 6 numbered tables,
  walkable floor, and walls.
- The user picks a party size (2, 4, or 6 people) and clicks
  **Find Nearest Table**.
- BFS searches from the entrance, level by level, and recommends the
  **nearest reachable table that is available and has enough seats**.
- The search is animated: explored cells turn yellow, the final route turns
  dark blue, and the chosen table turns green.
- Clicking a table toggles it between available and occupied. Out-of-service
  tables stay unavailable until **Restore Demo Layout** is clicked.
- If no suitable table exists, a clear message explains why.

## How BFS works (viva-ready summary)

1. BFS starts from the entrance.
2. It visits neighbouring cells level by level — all cells one step away
   first, then two steps away, and so on.
3. A **queue** (first in, first out) controls the order of exploration.
4. A **visited** set prevents the same cell from being explored twice.
5. **Parent** references remember where each cell was reached from, so the
   final route can be traced back from the table to the entrance.
6. The first suitable table found is the nearest one, because BFS explores
   in order of distance.

Every move costs the same (1 step), which is why BFS finds the shortest route.

- **Time complexity:** O(V + E)
- **Space complexity:** O(V)

where V = number of cells and E = number of connections between neighbouring cells.

## Files

| File          | Purpose                                              |
| ------------- | ---------------------------------------------------- |
| `index.html`  | Page structure: header, dashboard, grid, controls, explanation |
| `style.css`   | All styling, including the colour legend and mobile layout |
| `script.js`   | Floor plan data, the BFS algorithm, animation, clicks |
| `README.md`   | This file                                            |

The BFS algorithm lives in the `bfsFindTable()` function in `script.js`.
It uses a real queue, a visited set, and a parent map — the answer is never
hardcoded.

## Run it locally

Option 1 — just open the file:

```
open index.html
```

Option 2 — serve it (recommended, avoids any browser file restrictions):

```bash
# Python 3
python3 -m http.server 8000

# or Node.js
npx serve .
```

Then visit http://localhost:8000

## Demo layout

| Table | Seats | Starting status |
| ----- | ----- | --------------- |
| T1    | 2     | Available       |
| T2    | 4     | Occupied        |
| T3    | 6     | Available       |
| T4    | 2     | Out of service  |
| T5    | 4     | Available       |
| T6    | 6     | Occupied        |

Try these: party of 2 → T1, party of 4 → T3, party of 6 → T3.
Then click T3 to mark it occupied and search for 6 people again — you
should get the "no suitable table" message.

## Deploy

This is a static site, so any static host works. On Vercel: import the
repository, keep the default settings (no build command, no framework),
and deploy.

## Note

Educational simulation with sample data — not a real reservation system.
