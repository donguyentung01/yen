-- Feedback submitted from inside the app.
--
-- Deliberately holds nothing identifying. The app has no accounts, and adding
-- a device id here would create a way to link someone's messages together
-- across time — for an app people open at their lowest, that is not a trade
-- worth making for slightly easier triage.
--
-- platform and app_version exist only so a bug report can be placed.

CREATE TABLE IF NOT EXISTS feedback (
  id          TEXT PRIMARY KEY,
  created_at  TEXT NOT NULL,
  message     TEXT NOT NULL,
  platform    TEXT,
  app_version TEXT
);

CREATE INDEX IF NOT EXISTS feedback_created_at ON feedback (created_at DESC);
