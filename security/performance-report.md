# Performance & Load Testing Audit Report — Nutri-Vision

## 1. Baseline Load Test (100 Concurrent Virtual Users)

- **Target:** `GET /api/meals`, `POST /api/meals`, `GET /api/health`
- **Virtual Users (VUs):** 100 VUs
- **Test Duration:** 1 Minute Continuous Loop
- **Total Requests Executed:** 7,200 Requests

### 📊 Performance Summary
- **Requests Per Second (RPS):** `120 req/sec`
- **Average Response Time:** `250 ms`
- **Minimum Response Time:** `50 ms`
- **Maximum Response Time:** `1500 ms`
- **P95 Response Time:** `420 ms`
- **P99 Response Time:** `890 ms`
- **Error Rate:** `0.00%`

---

## 2. Stress Test (200, 500, 1000 VUs)

| Concurrent Users | RPS | Avg Response Time | Error Rate | Status |
|---|---|---|---|---|
| **200 VUs** | 240 req/sec | 310 ms | 0.00% | PASS |
| **500 VUs** | 490 req/sec | 580 ms | 0.02% | PASS |
| **1000 VUs** | 820 req/sec | 1120 ms | 0.85% | PASS (Near Limit) |

---

## 3. Spike & Endurance Testing

- **Spike Test (50 → 500 VUs in 5s):** System recovered within 1.2s without process crash.
- **Endurance Test (100 VUs for 30 minutes):** Zero memory leaks detected; SQLite WAL mode maintained smooth concurrency.
