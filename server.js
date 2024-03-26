const express = require('express');
const path = require('path');
const config = require('config');
const PORT = process.env.PORT || 8755;
const health = require('./src/services/health.js');
const {handle} = require('./src/services/mocker.js');
const AS = require('./src/services/api-service');

const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, 'web')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'web', 'home.html'));
});

app.get('/route', (req, res) => {
    res.sendFile(path.join(__dirname, 'web', 'route.html'));
});

app.get('/mockx/*', async (req, res) => {
    const h = await handle(req, res);
    res.type(h.type).send(h.data);
});

app.post('/mockx/*', async (req, res) => {
    const h = await handle(req, res);
    res.type(h.type).send(h.data);
});

app.put('/mockx/*', async (req, res) => {
    const h = await handle(req, res);
    res.type(h.type).send(h.data);
});

app.get('/healthcheck', async (req, res) => {
    const data = await health.getHealth();
    res.json(data);
});

app.post('/api/route/save', async (req, res) => {
    const data = await AS.insertRoute(req);
    res.json(data);
});

app.get('/api/route/list', async (req, res) => {
    const data = await AS.getRoutes(req);
    res.json(data);
});

app.get('/api/route', async (req, res) => {
    const data = await AS.getRouteById(req);
    res.json(data);
});

app.get('/api/res-hub/list', async (req, res) => {
    const data = await AS.getResHubList(req);
    res.json(data);
});

app.get('/api/res-hub', async (req, res) => {
    const data = await AS.getResHub(req);
    res.json(data);
});

app.post('/api/res-hub/upsert', async (req, res) => {
    const data = await AS.upsertResHub(req);
    res.json(data);
});

app.listen(PORT, () => {
    console.log(`Server is running on port:${PORT}, env:${config.name}`);
});
