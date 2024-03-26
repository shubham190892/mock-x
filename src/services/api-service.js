const dal = require('../dal');
const {trimSlash, contentTypeMapRev} = require("../utils");

const insertRoute = async (req) => {
    const body = req.body;
    const r = {
        service: body.service,
        method: body.method.toUpperCase(),
        accept: body.accept || 'application/json',
        path: trimSlash(body.path),
        reqKeyParams: body.reqKeyParams,
        defaultTtl: body.defaultTtl || -1,
        defaultHost: body.defaultHost
    }
    const res = await dal.saveRoute(r);
    const routeId = res.insertId;
    const resHub = {
        routeId: routeId,
        reqKey: 'default',
        type: contentTypeMapRev[r.accept] || 'json',
        ttl: -1,
        content: '{}'
    }
    await dal.saveResHub(resHub);
    return {
        msg: res
    }
}

const getRoutes = async (req) => {
    const params = req.query;
    const bpc = params.bpc === 'true'
    let routes;
    if(params.service && params.method){
        routes =  await dal.getServiceMethodRoutes(params.service, params.method, bpc);
    } else if(params.service){
        routes = await dal.getServiceRoutes(params.service, bpc);
    } else {
        routes = await dal.getAllRoutes(bpc);
    }
    return {
        routes: routes
    }
}

const getRouteById = async (req) => {
    const params = req.query;
    const bpc = params.bpc === 'true'
    const routeId = params.routeId;
    return  await dal.getRouteForRouteId(routeId, bpc);
}

const upsertResHub = async (req) => {
    const body = req.body;
    const resHub = {
        routeId: body.routeId,
        reqKey: body.reqKey,
        type: body.type,
        content: body.content,
        ttl: body.ttl || -1
    }
    const res = await dal.saveResHub(resHub);
    return {
        msg: res
    }
}

const getResHub = async (req) => {
    const params = req.query;
    const bpc = params.bpc === 'true';
    const res = await dal.getResFromHub(params.routeId, params.reqKey, bpc);
    return {
        resHubInfo: res
    }
}

const getResHubList = async (req) => {
    const routeId = req.query.routeId;
    const bpc = req.query.bpc === 'true';
    const res = await dal.getResHubForRouteId(routeId, bpc)
    return {
        resHubList: res
    }
}



module.exports = {
    getResHub: getResHub,
    getResHubList: getResHubList,
    upsertResHub: upsertResHub,
    getRoutes: getRoutes,
    getRouteById: getRouteById,
    insertRoute: insertRoute
}