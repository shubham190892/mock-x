const mock_x_GET_api_route_list = {
    reqKeyGen: context => {
        return `rk-g-${context.route.service}:${context.route.method}`;
    },
    fetchTarget: async context => {
        return {
            content: '{"routes":[]}',
            ttl: -1
        };
    },
    postProcess: (context, data) => {
        return data;
    }
}

module.exports = {
    "mock-x:GET:api/route/list": mock_x_GET_api_route_list
}