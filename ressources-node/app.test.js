/**
 * app.test.js — Tests Jest pour l'API NexaCloud
 */

const request = require('supertest');
const app = require('./app');

describe('GET /', () => {
  it('répond 200 avec le bon service', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('NexaCloud API');
  });
});

describe('GET /health', () => {
  it('retourne le statut healthy', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
  });
});

describe('GET /logs/summary', () => {
  it('retourne les 4 niveaux de log', async () => {
    const res = await request(app).get('/logs/summary');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('info', 142);
    expect(res.body).toHaveProperty('warning', 28);
    expect(res.body).toHaveProperty('error', 12);
    expect(res.body).toHaveProperty('critical', 3);
  });
});

describe('GET /logs/critical', () => {
  it('détecte une alerte critique', async () => {
    const res = await request(app).get('/logs/critical');
    expect(res.statusCode).toBe(200);
    expect(res.body.critical_count).toBe(3);
    expect(res.body.alerte).toBe(true);
  });

  describe('GET /logs/stats', () => {
    it('calcule le nombre total de logs', async () => {
      const res = await request(app).get('/logs/stats');
      expect(res.statusCode).toBe(200);
      expect(res.body.count).toBe(185);
    });
  });
});
