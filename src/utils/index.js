const axios = require("axios");

async function makeRequest(method, url, params, data = null, headers = {}, timeout = 5000) {
    let response;
    if (method === 'GET') {
        response = await axios.get(url, {
            params: params,
            headers,
            timeout
        });
    } else if (method === 'POST') {
        response = await axios.post(url, data, {
            params: params,
            headers,
            timeout
        });
    } else {
        throw new Error('Unsupported HTTP method');
    }
    return response.data;
}
const trimSlash = (str) => {
    return str.replace(/^\/+|\/+$/g, '');
}
const isNilOrEmpty = (obj) => {
    if (obj === null) return true;
    if (typeof obj === 'string') return obj.trim() === '';
    if (Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
}

const contentTypeMapRev = {
    'application/json': 'json',
    'application/xml': 'xml',
    'text/html': 'html',
    'text/plain': 'text'
}

const contentTypeMap = {
    'json': 'application/json',
    'xml': 'application/xml',
    'html': 'text/html',
    'text': 'text/plain'
}

module.exports = {
    isNilOrEmpty: isNilOrEmpty,
    trimSlash: trimSlash,
    contentTypeMapRev: contentTypeMapRev,
    contentTypeMap: contentTypeMap,
    makeRequest: makeRequest
}