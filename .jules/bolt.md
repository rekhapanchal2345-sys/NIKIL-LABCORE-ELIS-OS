## 2026-10-27 - [N+1 Bottlenecks in Prisma Loops]
**Learning:** Sequential `for...of` loops that use `await prisma...` inside cause significant N+1 performance bottlenecks.
**Action:** Always map over the items using `Promise.all(items.map(async (item) => { ... }))` for concurrent execution, and when doing multiple mutations per item, wrap them in a `prisma.$transaction([])` for both concurrency and reduced database round-trips.
