import "@testing-library/jest-dom/vitest";

// Env vars required by modules that guard on import (base-agent, db/index)
// Values are dummy — the actual clients are mocked in each test file
process.env.ANTHROPIC_API_KEY ??= "test-key-for-vitest";
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
