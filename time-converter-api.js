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