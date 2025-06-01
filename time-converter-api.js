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

app.get('/adjust-time', (req, res) => {
  const { time, add, subtract, timezone } = req.query;
  if (!time) {
    return res.status(400).json({ error: 'Missing time query parameter' });
  }

  let originalTimezone = timezone || 'UTC';

  // Validate timezone
  const isValidAlias = Object.hasOwnProperty.call(TIMEZONE_ALIASES, originalTimezone);
  const isValidGMT = /^GMT[+-]?\d+(\.\d+)?$/.test(originalTimezone);
  const isUTC = originalTimezone === 'UTC';

  if (!(isValidAlias || isValidGMT || isUTC)) {
    return res.status(400).json({ error: `Invalid timezone '${originalTimezone}'. Use valid alias like EST, CST or GMT+/-offset.` });
  }

  let resolvedTimezone = originalTimezone;
  if (isValidAlias) {
    resolvedTimezone = TIMEZONE_ALIASES[originalTimezone];
  } else if (isValidGMT) {
    const offset = parseFloat(originalTimezone.replace('GMT', ''));
    const sign = offset >= 0 ? '+' : '';
    resolvedTimezone = `UTC${sign}${offset}`;
  }

  let baseDate = new Date(time);
  if (isNaN(baseDate.getTime())) {
    return res.status(400).json({ error: 'Invalid date format. Use something like: May 31, 2025 12:00 PM' });
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
    resolvedTimezone,
    timezoneAliases: TIMEZONE_ALIASES
  });
});