const {trimSlash, isNilOrEmpty, contentTypeMapRev, makeRequest} = require("../utils");
const {getServiceMethodRoutes, getResFromHub, saveResHub} = require("../dal");
const RM = require('./route-map');
const R = require('ramda');
const config = require('config');
const {getResHubList} = require('./api-service');
const dal = require('../dal');

const matchPathPattern = async context => {
    const routeList = await getServiceMethodRoutes(context.service, context.method, true);
    let route = null;
    const pathParams = {};
    for (let r of  routeList) {
        const tokens = r.path.split('/');
        const pathTokens = context.path.split('/');
        if (tokens.length !== pathTokens.length) continue;
        let match = true;
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const pathToken = pathTokens[i];
            if (token.startsWith('__')) {
                pathParams[token.substring(2)] = pathToken;
                continue;
            }
            if (token !== pathToken) {
                match = false;
                break;
            }
        }
        if (match) {
            route = r;
            break;
        }
    }
    return {
        route: route,
        pathParams: pathParams
    };
}

const createContext = (req, res) => {
    try{
        const pathTokens = trimSlash(req.path).split('/');
        return {
            req: req,
            res: res,
            service: pathTokens[1],
            method: req.method.toUpperCase(),
            path: pathTokens.slice(2).join('/'),
            params: req.query,
            headers: req.headers,
            body: req.body
        }
    } catch (e) {
        console.log('Error creating context', e);
        throw new Error('Error creating context: ' + e.message);
    }
}

const prepareResHub = (context, res) => {
    return {
        routeId: context.route.id,
        reqKey: context.reqKey,
        type: contentTypeMapRev[context.route.accept] || 'json',
        content: JSON.stringify(res.content),
        ttl: res.ttl || -1
    };
}


const fetchFromHttpSource = async context => {
    let host = context.route.defaultHost;
    if(isNilOrEmpty(host)){
        host = R.pathOr(null, ['services', context.service, 'host'], config);
    }
    if(isNilOrEmpty(host)) {
        console.log('No host found for service:', context.service);
        return {
            content: null,
            ttl: -1
        };
    }
    const timeout = config['services'][context.service]['timeout'] || 5000;
    const url = `${host}/${context.path}`;
    const headers = context.headers;
    const data = context.body;
    let content = null;
    try{
        headers['Host'] = host.split('//')[1];
        content = await makeRequest(context.method, url, context.params, data, headers, timeout);
    }catch (e){
        console.log('Error fetching from http source:', e);
    }
    return {
        content: content,
        ttl: context.route.defaultTtl || -1
    }
}

const fetchResponseFromSource = async context => {
    let res;
    if(context.fetchTarget){
        res = await context.fetchTarget(context);
        res['source'] = 'custom';
    } else {
        res = await fetchFromHttpSource(context);
        res['source'] = 'http';
    }
    return res;
}

const generateRes = async context => {
    let res = await getResFromHub(context.route.id, context.reqKey, false);
    if(res && res.content && res.age < res.ttl) return {content: res.content, key: context.reqKey, source: res.source};
    let sourceRes = await fetchResponseFromSource(context);
    if(sourceRes.content) {
        const resHub = prepareResHub(context, sourceRes);
        console.log('Saving resHub for route:', context.route.path);
        await saveResHub(resHub);
        await dal.getResHubForRouteId(context.route.id, true);
        return {content: sourceRes.content, key: context.reqKey, source: sourceRes.source};
    }
    let defaultRes = await getResFromHub(context.route.id, 'default', false);
    return {content: defaultRes.content, key: 'default', source: defaultRes.source};
}

const calculateReqKey = context => {
    if(context.reqKeyGen) {
        console.log('Call reqKeyGen for route:', context.route.path)
        return context.reqKeyGen(context);
    }
    const keys = (context.route.reqKeyParams || '').split(',');
    if (keys.length === 0) return 'default';
    const values = ['rk'];
    keys.forEach(key => {
        if (context.params[key]) {
            values.push(context.params[key]);
        } else if (context.headers[key]) {
            values.push(context.headers[key]);
        } else if (context.pathParams[key]) {
            values.push(context.pathParams[key]);
        } else{
            const childKeys = key.split('.');
            const v = R.pathOr(null, childKeys, context.body);
            if(v) values.push(v);
        }
    });

    return values.join(':');
}

const handle = async (req, res) => {
    const context = createContext(req, res);
    const {route, pathParams} = await matchPathPattern(context);
    context.route = route;
    context.pathParams = pathParams;
    const mapKey = `${route.service}:${route.method}:${route.path}`;
    if (RM[mapKey]) {
        context['reqKeyGen'] = RM[mapKey].reqKeyGen;
        context['fetchTarget'] = RM[mapKey].fetchTarget;
        context['postProcess'] = RM[mapKey].postProcess;
    }
    context.reqKey = calculateReqKey(context);
    let {content, key, source} = await generateRes(context);
    let data = content;
    context['resKey'] = key;
    context['resSource'] = source;
    if (context.postProcess){
        console.log('Post processing data for route:', context.route.path);
        data = context.postProcess(context, data);
        context.res.set('res-pp', '1');
    }
    context.res.set('req-key', context.reqKey);
    context.res.set('res-key', context.resKey);
    context.res.set('res-source', context.resSource);
    if (!data) {
        res.status(404).send('No resource found');
        return;
    }
    if (typeof data === 'string') {
        if(context.route.accept.toLocaleLowerCase() === 'application/json') {
            try {
                data = JSON.parse(data);
            } catch (e) {
                console.log('Error parsing response:', e);
            }
        }
    }
    return {
        type: context.route.accept,
        data: data
    };
}

module.exports = {
    handle: handle
}