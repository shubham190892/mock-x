# mock-x
One http mock server for all micro services
![mockx_h.png](web%2Fimage%2Fmockx_h.png)

## Features
- Web UI to add http endpoints to mock and update the mocked response dynamically
- Can support all http methods GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD etc
- Dynamic response support, can return different response for same endpoint based on request headers, request body, query params etc
- Multilayer response system for same endpoint, db, actual http server and custom response generator

## Setup
- Clone the repo https://github.com/shubham190892/mock-x
- Install mysql and keep it running, create table in mysql using the sql file in db folder `mysql/ddl`
- Update the config for the mysql db.
- Run `npm install`
- Now run the server `NODE_ENV=stage MYSQL_USER=root MYSQL_PASS=1234 node server.js`

## How to use
- Open the web UI `http://localhost:8755`
- Add Route you want to mock, requestKeyParams will be used to identify the request, It will be used to create requestKey for the request
- If you want to mock route with path params, you can use `__param` in the path, and the value will set the context as path param, e.g. `/user/__id` will id in the context as path param
- Add Response for the route, you can add multiple responses for the same route, based on the requestKey
- You can also add custom response generator in the `route-map.js`, which will be called to generate the response for the request
- Now use the following template to make the request to the mock server `http://localhost:8755/mockx/<service>/<path>?<query>`

Feel free to contribute to the project, raise issues and feature requests.
