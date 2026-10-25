// ============================================================
// SeatFinder — Smart Restaurant Seat Finder using BFS
// Plain HTML/CSS/vanilla JavaScript. No frameworks, no backend.
// ============================================================

// ---------- 1. THE RESTAURANT MAP ----------
// One character per cell. Each row must have the same length (11).
//   '.'  = walkable floor
//   '#'  = wall (cannot be crossed)
//   'E'  = entrance (where BFS starts)
//   'T'  = a table (its details live in TABLES below)
const GRID = [
  ".....E.....",
  ".##.....##.",
  ".#T..T..#..",
  "....#......",
  ".T.##.T#...",
  "...........",
  ".#T..T..#..",
  "....#......",
  "...........",
];

const ROWS = GRID.length;
const COLS = GRID[0].length;

// Tables, in the order they appear on the map (top to bottom, left to right).
// status: "available" | "occupied" | "out-of-service"
const TABLES = [
  { id: "T1", row: 2, col: 2, seats: 2, status: "available" },
  { id: "T2", row: 2, col: 5, seats: 4, status: "occupied" },
  { id: "T3", row: 4, col: 1, seats: 6, status: "available" },
  { id: "T4", row: 4, col: 6, seats: 2, status: "out-of-service" },
  { id: "T5", row: 6, col: 2, seats: 4, status: "available" },
  { id: "T6", row: 6, col: 5, seats: 6, status: "occupied" },
];

// The demo layout, used by "Restore Demo Layout".
const DEMO_STATUS = {
  T1: "available",
  T2: "occupied",
  T3: "available",
  T4: "out-of-service",
  T5: "available",
  T6: "occupied",
};

// ---------- 2. SMALL HELPERS ----------
function key(row, col) { return row + "," + col; }

// Find the entrance cell ('E') on the map.
function findEntrance() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (GRID[r][c] === "E") return { row: r, col: c };
    }
  }
  return null;
}

// Look up a table by its position. Returns undefined for non-table cells.
function tableAt(row, col, tables) {
  return tables.find(function (t) { return t.row === row && t.col === col; });
}

// ---------- 3. THE BFS ALGORITHM ----------
// Searches from the entrance, level by level, for the nearest table that is
// available AND has enough seats for the party.
//
// Returns:
//   { table, path, visitedOrder, visitedCount } on success, or
//   { table: null, path: [], visitedOrder, visitedCount } when nothing fits.
//
//   table        = the recommended table object
//   path         = cells from the entrance to the table (inclusive)
//   visitedOrder = walkable cells discovered, in the order BFS found them
//   visitedCount = total cells BFS marked as visited (entrance included)
function bfsFindTable(tables, partySize) {
  const start = findEntrance();
  const queue = [start];              // FIFO queue: first in, first out
  const visited = new Set([key(start.row, start.col)]);
  const parent = {};                  // cell key -> key of the cell we came from
  parent[key(start.row, start.col)] = null;
  const visitedOrder = [];

  // Neighbour order: up, right, down, left (fixed, so results are repeatable).
  const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]];

  while (queue.length > 0) {
    const cell = queue.shift(); // take the front of the queue

    for (const [dr, dc] of directions) {
      const nr = cell.row + dr;
      const nc = cell.col + dc;

      // 1. Stay inside the map.
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      // 2. Never visit a cell twice.
      if (visited.has(key(nr, nc))) continue;
      // 3. Walls cannot be crossed.
      if (GRID[nr][nc] === "#") continue;

      const table = tableAt(nr, nc, tables);

      if (table) {
        // A table is a destination, never a corridor: we check it but we
        // do NOT walk through it to reach other cells.
        // BFS visits cells in order of distance, so the FIRST suitable
        // table found here is the nearest one.
        if (table.status === "available" && table.seats >= partySize) {
          // Reconstruct the route: follow parents back to the entrance.
          const path = [{ row: nr, col: nc }];
          let current = key(cell.row, cell.col);
          while (current !== null) {
            const [r, c] = current.split(",").map(Number);
            path.unshift({ row: r, col: c });
            current = parent[current];
          }
          return { table, path, visitedOrder, visitedCount: visited.size };
        }
        continue; // occupied, out-of-service, or too small: skip it
      }

      // Ordinary walkable cell: mark visited, remember the parent, enqueue.
      visited.add(key(nr, nc));
      parent[key(nr, nc)] = key(cell.row, cell.col);
      queue.push({ row: nr, col: nc });
      visitedOrder.push({ row: nr, col: nc });
    }
  }

  // The queue is empty and no suitable table was found.
  return { table: null, path: [], visitedOrder, visitedCount: visited.size };
}

// ---------- 4. PAGE INTERACTION (runs only in a browser) ----------
let animationTimers = []; // so Reset can stop a running animation

function cellElement(row, col) {
  return document.getElementById("cell-" + row + "-" + col);
}

function stopAnimation() {
  animationTimers.forEach(clearTimeout);
  animationTimers = [];
  document.getElementById("findBtn").disabled = false;
}

// Paint the grid from the current table statuses.
function renderGrid() {
  const gridEl = document.getElementById("floorGrid");
  gridEl.innerHTML = "";

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement("div");
      cell.id = "cell-" + r + "-" + c;
      cell.className = "cell";
      const ch = GRID[r][c];

      if (ch === "#") {
        cell.classList.add("cell-wall");
      } else if (ch === "E") {
        cell.classList.add("cell-entrance");
        cell.textContent = "🚪";
      } else if (ch === "T") {
        const table = tableAt(r, c, TABLES);
        cell.classList.add("cell-table");
        if (table.status === "available") cell.classList.add("cell-available");
        else if (table.status === "occupied") cell.classList.add("cell-occupied");
        else cell.classList.add("cell-out");
        cell.innerHTML = table.id + "<small>" + table.seats + " seats" +
          (table.status === "out-of-service" ? " · OUT" : "") + "</small>";
        // Click a table to toggle available <-> occupied.
        cell.addEventListener("click", function () { toggleTable(table); });
      }
      gridEl.appendChild(cell);
    }
  }
  updateDashboard();
}

// Update the four dashboard numbers from the current statuses.
function updateDashboard() {
  document.getElementById("totalTables").textContent = TABLES.length;
  document.getElementById("availableTables").textContent =
    TABLES.filter(function (t) { return t.status === "available"; }).length;
  document.getElementById("occupiedTables").textContent =
    TABLES.filter(function (t) { return t.status === "occupied"; }).length;
  document.getElementById("outOfServiceTables").textContent =
    TABLES.filter(function (t) { return t.status === "out-of-service"; }).length;
}

function toggleTable(table) {
  if (table.status === "out-of-service") {
    showMessage("This table is out of service. It stays unavailable until you restore the demo layout.");
    return;
  }
  hideMessage();
  table.status = table.status === "available" ? "occupied" : "available";
  clearSearchPainting(); // a status change invalidates the old search
  renderGrid();
}

function showMessage(text) {
  const box = document.getElementById("messageBox");
  box.textContent = text;
  box.hidden = false;
}

function hideMessage() {
  document.getElementById("messageBox").hidden = true;
}

// Remove only the animation colours, keep table statuses as they are.
function clearSearchPainting() {
  stopAnimation();
  document.querySelectorAll(".cell-exploring, .cell-path, .cell-selected")
    .forEach(function (el) {
      el.classList.remove("cell-exploring", "cell-path", "cell-selected");
    });
  document.getElementById("resultDetails").hidden = true;
  document.getElementById("resultEmpty").hidden = false;
}

// Animate the BFS result: visited cells in yellow, then the route in dark
// blue, then the chosen table in green. Uses the REAL order BFS produced.
function runSearch() {
  const partySize = Number(document.getElementById("partySize").value);
  clearSearchPainting();
  hideMessage();
  document.getElementById("findBtn").disabled = true;

  const result = bfsFindTable(TABLES, partySize);
  // Respect reduced-motion preference: show the final state at once
  // instead of the step-by-step animation. The BFS result is identical.
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const stepDelay = reducedMotion ? 0 : (result.visitedOrder.length > 60 ? 20 : 50);
  const pathDelay = reducedMotion ? 0 : 90;

  // 1. Light up explored cells one by one (yellow).
  result.visitedOrder.forEach(function (cell, i) {
    animationTimers.push(setTimeout(function () {
      const el = cellElement(cell.row, cell.col);
      if (el) el.classList.add("cell-exploring");
    }, i * stepDelay));
  });

  const afterExplore = result.visitedOrder.length * stepDelay;

  // 2. Draw the final route (dark blue), skipping entrance and table cells.
  const middlePath = result.path.slice(1, -1);
  middlePath.forEach(function (cell, i) {
    animationTimers.push(setTimeout(function () {
      const el = cellElement(cell.row, cell.col);
      if (el) {
        el.classList.remove("cell-exploring");
        el.classList.add("cell-path");
      }
    }, afterExplore + i * pathDelay));
  });

  // 3. Show the result.
  animationTimers.push(setTimeout(function () {
    if (result.table) {
      const tEl = cellElement(result.table.row, result.table.col);
      if (tEl) tEl.classList.add("cell-selected");
      document.getElementById("resTable").textContent = result.table.id;
      document.getElementById("resCapacity").textContent = result.table.seats;
      document.getElementById("resSteps").textContent = result.path.length - 1;
      document.getElementById("resVisited").textContent = result.visitedCount;
      document.getElementById("resExplanation").textContent =
        result.table.id + " is the nearest table from the entrance that is " +
        "available and has at least " + partySize + " seats. BFS explored " +
        "level by level, so no closer suitable table exists.";
      document.getElementById("resultEmpty").hidden = true;
      document.getElementById("resultDetails").hidden = false;
    } else {
      showMessage("No suitable table available. Every table with at least " +
        partySize + " seats is either occupied, out of service, or unreachable. " +
        "Try a smaller party, free a table by clicking it, or restore the demo layout.");
    }
    document.getElementById("findBtn").disabled = false;
  }, afterExplore + middlePath.length * pathDelay));
}

// Restore the original demo statuses and clear the search.
function restoreDemo() {
  TABLES.forEach(function (t) { t.status = DEMO_STATUS[t.id]; });
  clearSearchPainting();
  hideMessage();
  renderGrid();
}

function init() {
  renderGrid();
  document.getElementById("findBtn").addEventListener("click", runSearch);
  document.getElementById("resetBtn").addEventListener("click", function () {
    clearSearchPainting();
    hideMessage();
  });
  document.getElementById("restoreBtn").addEventListener("click", restoreDemo);
}

// Only start the page code in a browser. When this file is loaded by the
// Node.js test harness below, `document` does not exist and init() is skipped.
if (typeof document !== "undefined") {
  init();
}
