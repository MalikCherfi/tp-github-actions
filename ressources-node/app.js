/**
 * app.js — API NexaCloud (version Node.js)
 * Mini API Express utilisée comme cible du pipeline CI/CD dans le TP GitHub Actions.
 */

const express = require('express');

const app = express();
app.use(express.json());

// Simule un résumé de logs issu du TP Bash / PowerShell
const LOG_SUMMARY = {
  info: 142,
  warning: 28,
  error: 12,
  critical: 3,
};

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'NexaCloud API', version: '1.1.0' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.get('/logs/summary', (req, res) => {
  res.json(LOG_SUMMARY);
});

app.get('/logs/critical', (req, res) => {
  const seuil = LOG_SUMMARY.critical;
  res.json({ critical_count: seuil, alerte: seuil > 0 });
});

app.get('/logs/stats', (req, res) => {
  const count = Object.values(LOG_SUMMARY).reduce((a, b) => a + b, 0);
  res.json({ count });
});

module.exports = app;

/* istanbul ignore next */
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`NexaCloud API démarrée sur http://localhost:${PORT}`);
  });
}
