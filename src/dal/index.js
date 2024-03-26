const cache = require('memory-cache');
const {mysql} = require('../../mysql/pool');

const getAllRoutes = async (bpc) => {
    console.log('Getting all routes');
    const key = 'routes';
    let routes = cache.get(key);
    if (!routes || bpc) {
        routes = await mysql.query('SELECT * FROM routes order by service, method, path');
        cache.put(key, routes, 60000*5);
    }
    return routes;
}

const getServiceRoutes = async (service, bpc) => {
    console.log('Getting routes for service:', service);
    const key = `routes-${service}`;
    let routes = cache.get(key);
    if (!routes || bpc) {
        routes = await mysql.query('SELECT * FROM routes WHERE service = ?', [service]);
        cache.put(key, routes, 60000*5);
    }
    return routes;
}

const getServiceMethodRoutes = async (service, method, bpc) => {
    console.log('Getting routes for service:', service, 'method:', method);
    let routes = await getServiceRoutes(service, bpc);
    routes = routes.filter((r) => r.method === method);
    return routes;
}

const getRouteForRouteId = async (routeId, bpc) => {
    console.log('Getting route for routeId:', routeId);
    const key = `route-${routeId}`;
    let route = cache.get(key);
    if (!route || bpc) {
        route = await mysql.query('SELECT * FROM routes WHERE id = ?', [routeId]);
        route = route.shift();
        cache.put(key, route, 60000*5);
    }
    return route;
}

const saveRoute = async (route) => {
    console.log('Saving route:', route.id, route.path);
    const q = 'INSERT INTO routes (service, method, accept, path, reqKeyParams, defaultTtl, defaultHost) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE reqKeyParams = VALUES(reqKeyParams), defaultTtl = VALUES(defaultTtl)';
    const values = [route.service, route.method, route.accept, route.path, route.reqKeyParams, route.defaultTtl, route.defaultHost];
    try{
        return await mysql.query(q, values);
    } catch (e) {
        console.error('Error saving route:', e);
        return false;
    }
}

const getResFromHub = async (routeId, reqKey, bpc) => {
    console.log('Getting res from hub for routeId:', routeId, 'reqKey:', reqKey);
    const key = `hub-${routeId}-${reqKey}`;
    let source = 'm-cache'
    let rhRow = cache.get(key);
    if (!rhRow || bpc) {
        const q = 'SELECT TIMESTAMPDIFF(SECOND, updatedAt, NOW()) AS age,routeId,reqKey,type,ttl,content FROM res_hub WHERE routeId = ? AND reqKey = ?';
        rhRow = {};
        try{
            const rows = await mysql.query(q, [routeId, reqKey]);
            rhRow = rows.shift();
        }catch (e) {
            console.log('Error getting resHub from db:', e);
        }
        source = 'db';
        cache.put(key, rhRow, 60000);
    }
    rhRow['source'] = source;
    return rhRow;
}

const getResHubForRouteId = async (routeId, bpc) => {
    console.log('Getting resHub for routeId:', routeId);
    const key = `hub-${routeId}`;
    let res = cache.get(key);
    if (!res || bpc) {
        const q = 'SELECT routeId,reqKey,type,ttl,SUBSTR(content, 1, 100) as content FROM res_hub WHERE routeId = ?';
        res = await mysql.query(q, [routeId]);
        cache.put(key, res, 60000);
    }
    return res;
}

const saveResHub = async resHub => {
    console.log('Saving resHub for routeId:', resHub.routeId, 'reqKey:', resHub.reqKey);
    let content = resHub.content;
    const q = 'INSERT INTO res_hub (routeId, reqKey, type, content, ttl) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE content = VALUES(content), ttl = VALUES(ttl), type = VALUES(type), updatedAt = now()';
    const values = [resHub.routeId, resHub.reqKey, resHub.type, content, resHub.ttl];
    try{
        return await mysql.query(q, values);
    } catch (e) {
        console.error('Error saving resHub:', e);
        return false;
    }
}


const getServices = async (bpc) => {
    console.log('Getting services');
    const key = 'services';
    let services = cache.get(key);
    if (!services || bpc) {
        services = await mysql.query('SELECT DISTINCT service FROM routes');
        cache.put(key, services, 60000*15);
    }
    return services;

}

module.exports = {
    getRouteForRouteId: getRouteForRouteId,
    getServices: getServices,
    saveResHub: saveResHub,
    getResHubForRouteId: getResHubForRouteId,
    getResFromHub: getResFromHub,
    saveRoute: saveRoute,
    getAllRoutes: getAllRoutes,
    getServiceMethodRoutes: getServiceMethodRoutes,
    getServiceRoutes: getServiceRoutes
}