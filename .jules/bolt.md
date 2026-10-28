## 2023-10-28 - [Prisma N+1 Sequential Query Bottleneck]
**Learning:** Sequential database operations within a `for...of` loop (e.g. sequentially updating overdue status for receivables) can cause a significant N+1 performance bottleneck, especially when dealing with Prisma models.
**Action:** Always replace sequential `await prisma...` calls inside loops with a single Prisma interactive transaction (`await prisma.$transaction(async (tx) => {...})`) combined with `await Promise.all()` and `Array.map()` to ensure the queries are batched/executed concurrently on a single connection.
