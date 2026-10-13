# Resume Bullets

Each bullet below is 116 characters, counting spaces and punctuation but excluding the Markdown `- ` prefix. Use the CI wording once this change is pushed and its GitHub Actions run is verified. The test and concurrency numbers describe local verification, not production scale or user growth.

- Built an interview platform with 4 coding languages, 11 coding problems, adaptive AI follow-ups, and saved feedback.
- Secured accounts through salted password hashing, persistent rate limits, session revocation and scoped data access.
- Added 67 tests and 31 API checks, with GitHub Actions validating builds, PostgreSQL data, and isolated code runners.
- Verified account persistence across 40 concurrent writes and blocked excess requests using atomic PostgreSQL quotas.

The first bullet describes existing product functionality. The additional engineering changes are local until committed and deployed; the isolated execution path needs a separate Docker-capable host. Do not claim normalized PostgreSQL tables, production latency improvements, a coverage percentage, or production load capacity from these measurements.
