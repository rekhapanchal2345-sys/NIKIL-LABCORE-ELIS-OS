
## $(date +%Y-%m-%d) - Prevent N+1 Queries in Bulk Database Updates
**Learning:** Sequential `for...of` loops creating multiple database records within a transaction cause an N+1 query problem, slowing down operations like patient/order creation significantly. This happens specifically when inserting `sample` and `sampleTrackingHistory` records for each item in an order.
**Action:** Replace `for...of` loops executing sequential ORM `.create()` operations with concurrent `await Promise.all(items.map(async (item) => { ... }))` when iterating through multiple dependent entities to improve transaction performance and reduce latency.
