const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/convert', (req, res) => {
  const decimal = parseFloat(req.query.decimal);
  if (isNaN(decimal)) {
    return res.status(400).json({ error: 'Invalid decimal value' });
  }

  const hours = Math.floor(decimal);
  const minutesFloat = (decimal - hours) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = Math.round((minutesFloat - minutes) * 60);

  const parts = [];
  if (hours) parts.push(`${hours} hour(s)`);
  if (minutes) parts.push(`${minutes} minute(s)`);
  if (seconds) parts.push(`${seconds} second(s)`);

  const formatted = (hours || minutes || seconds)
    ? parts.join(' ')
    : 'No time recorded.';

  res.json({
    input: decimal,
    hours,
    minutes,
    seconds,
    formatted
  });
});

app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`);
});

app.get('/to-unix', (req, res) => {
  const iso = req.query.iso;
  if (!iso) {
    return res.status(400).json({ error: 'Missing ISO input (e.g. ?iso=2025-05-27T14:00:00Z)' });
  }

  const date = new Date(iso);
  if (isNaN(date.getTime())) {
    return res.status(400).json({ error: 'Invalid ISO 8601 date format' });
  }

  const unix = Math.floor(date.getTime() / 1000);
  res.json({
    input: iso,
    unix
  });
});

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Timezone aliases
const TIMEZONE_ALIASES = {
  EST: "America/New_York",
  EDT: "America/New_York",
  CST: "America/Chicago",
  CDT: "America/Chicago",
  MST: "America/Denver",
  MDT: "America/Denver",
  PST: "America/Los_Angeles",
  PDT: "America/Los_Angeles",
  AEST: "Australia/Sydney",
  AEDT: "Australia/Sydney",
  CEST: "Europe/Berlin",
  CET: "Europe/Berlin",
  GMT: "Etc/GMT"
};

// Validate IANA timezone
function isValidIanaTimezone(tz) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch (err) {
    return false;
  }
}

// Parse add/subtract time string
function parseTimeString(str) {
  const match = str.match(/(?:(\d+)w)?(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
  return {
    weeks: parseInt(match?.[1] || 0),
    days: parseInt(match?.[2] || 0),
    hours: parseInt(match?.[3] || 0),
    minutes: parseInt(match?.[4] || 0),
    seconds: parseInt(match?.[5] || 0)
  };
}

// Adjust the date
function adjustDate(date, adjustment, sign = 1) {
  const ms =
    (adjustment.weeks || 0) * 7 * 24 * 60 * 60 * 1000 +
    (adjustment.days || 0) * 24 * 60 * 60 * 1000 +
    (adjustment.hours || 0) * 60 * 60 * 1000 +
    (adjustment.minutes || 0) * 60 * 1000 +
    (adjustment.seconds || 0) * 1000;

  return new Date(date.getTime() + sign * ms);
}

// Main endpoint
app.get('/adjust-time', (req, res) => {
  const { time, add, subtract, timezone } = req.query;

  if (!time) {
    return res.status(400).json({ error: 'Missing time query parameter' });
  }

  let originalTimezone = timezone || 'UTC';

  const isValidAlias = Object.hasOwnProperty.call(TIMEZONE_ALIASES, originalTimezone);
  const isValidGMT = /^GMT[+-]?\d+(\.\d+)?$/.test(originalTimezone);
  const isValidIana = isValidIanaTimezone(originalTimezone);
  const isUTC = originalTimezone === 'UTC';

  if (!(isValidAlias || isValidGMT || isValidIana || isUTC)) {
    return res.status(400).json({
      error: `Invalid timezone '${originalTimezone}'. Use valid alias like EST, CST, GMT+/-offset, or a valid IANA timezone.`
    });
  }

  // Resolve alias or GMT to IANA-compatible format
  let resolvedTimezone = originalTimezone;
  if (isValidAlias) {
    resolvedTimezone = TIMEZONE_ALIASES[originalTimezone];
  } else if (isValidGMT) {
    const offset = parseFloat(originalTimezone.replace('GMT', ''));
    const sign = offset >= 0 ? '+' : '';
    resolvedTimezone = `UTC${sign}${offset}`;
  }

  // Parse base time
  const baseDate = new Date(time);
  if (isNaN(baseDate.getTime())) {
    return res.status(400).json({
      error: 'Invalid date format. Use something like: May 31, 2025 12:00 PM'
    });
  }

  let resultDate = new Date(baseDate);

  if (add) {
    const addTime = parseTimeString(add);
    resultDate = adjustDate(resultDate, addTime, +1);
  }

  if (subtract) {
    const subTime = parseTimeString(subtract);
    resultDate = adjustDate(resultDate, subTime, -1);
  }

  res.json({
    input: time,
    adjusted: resultDate.toString(),
    unix: Math.floor(resultDate.getTime() / 1000),
    originalTimezone,
    resolvedTimezone
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`API is running on port ${PORT}`);
});

app.get('/timezones', (req, res) => {
  res.json({
    aliases: TIMEZONE_ALIASES,
    note: "You can also use IANA timezones like 'Europe/Berlin' or 'Australia/Sydney'. GMT offsets like 'GMT+5' work too."
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});