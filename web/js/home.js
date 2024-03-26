$(document).ready(async function () {
    //console.log('Home page loaded', performance.nvaigation.type);
    const modalOverlay = $('#modal-overlay');
    const routeList = $('#route-list');
    const serviceFilter = $('#service-filter');
    const methodFilter = $('#method-filter');
    const addRouteBtn = $('#add-route-btn');
    const saveRouteBtn = $('#save-route-btn');


    // Fetch routes from API
    const routes = await fetchRoutes();
    displayRoutes(routes);

    // Populate filter dropdowns
    populateFilters(routes);

    addRouteBtn.on('click', function() {
        let serviceList = [];
        if(routes) {
            serviceList = [...new Set(routes.map(route => route.service)), '_other'];
        }
        const uniqueServices  = Array.from(new Set(serviceList)).sort();
        $('#service-input').empty();
        uniqueServices.forEach(service => {
            const option = $('<option></option>').text(service);
            $('#service-input').append(option);
        });
        $('#other-service-input').show();
        modalOverlay.show(); // Show modal
    });

    $('#service-input').on('change', function() {
        if ($(this).val() === '_other') {
            // If "other" is selected, show input field
            $('#other-service-input').show();
        } else {
            $('#other-service-input').hide();
        }
    });


    saveRouteBtn.on('click', function() {
        let service = $('#service-input').val();
        const method = $('#method-input').val();
        const accept = $('#accept-input').val();
        const path = $('#path-input').val();
        const reqKeyParams = $('#reqKeyParams-input').val();
        const defaultTtl = $('#defaultTtl-input').val();
        const defaultHost = $('#defaultHost-input').val();
        if (!service || !method || !path) {
            console.error('Service, method, and path are required');
            alert('Service, method, and path are required');
            return;
        }
        if(service === '_other') {
            service = $('#other-service-input').val().toLocaleLowerCase();
        }
        const routeData = {
            service: service,
            method: method,
            accept: accept,
            path: path,
            reqKeyParams: reqKeyParams,
            defaultTtl: defaultTtl,
            defaultHost: defaultHost
        };

        $.ajax({
            url: '/api/route/save',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(routeData),
            success: async function(response) {
                console.log('Route saved successfully:', response);
                // Close the modal after saving
                await fetch('/api/route/list?bpc=true');
                modalOverlay.hide();
                location.reload(true);
            },
            error: function(xhr, status, error) {
                console.error('Error saving route:', error);
            }
        });
    });

    $('#cancel-route-btn').on('click', function() {
        modalOverlay.hide();
    });

    // Filter routes when service/method filters change
    serviceFilter.on('change', () => filterRoutes(routes));
    methodFilter.on('change', () => filterRoutes(routes));

    async function fetchRoutes() {
        const response = await fetch('/api/route/list');
        const data = await response.json();
        return data.routes;
    }

    function displayRoutes(routes) {
        routeList.empty();
        routes.forEach(route => {
            const row = `
                <tr>
                    <td class="route-id">${route.id}</td>
                    <td>${route.service}</td>
                    <td>${route.method}</td>
                    <td>${route.accept.split('/')[1]}</td>
                    <td>${route.path}</td>
                    <td>${route.reqKeyParams}</td>
                    <td>${route.defaultHost}</td>
                </tr>
            `;
            routeList.append(row);
        });
        $('.route-id').on('click', function() {
            const id = $(this).text();
            const url = '/route?id=' + id; // Use relative URL
            window.open(url, '_blank');
        });
    }

    function populateFilters(routes) {
        const services = [...new Set(routes.map(route => route.service))];
        const methods = [...new Set(routes.map(route => route.method))];
        const allServices = $('<option></option>').text('ALL');
        serviceFilter.append(allServices);
        services.forEach(service => {
            const option = $('<option></option>').text(service);
            serviceFilter.append(option);
        });
        const allMethods = $('<option></option>').text('ALL');
        methodFilter.append(allMethods);
        methods.forEach(method => {
            const option = $('<option></option>').text(method);
            methodFilter.append(option);
        });
    }

    function filterRoutes(routes) {
        const selectedService = serviceFilter.val();
        const selectedMethod = methodFilter.val();
        const filteredRoutes = routes.filter(route => {
            return (!selectedService || selectedService === 'ALL' || route.service === selectedService) &&
                (!selectedMethod || selectedMethod === 'ALL' || route.method === selectedMethod);
        });
        displayRoutes(filteredRoutes);
    }
});
