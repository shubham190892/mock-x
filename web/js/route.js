$(document).ready(async function () {
    const routeDetailsContainer = $('#route-details');
    const mockedResponseList = $('#mocked-response-list');
    const mockEditOverlay = $("#mock-edit-overlay");
    const meError = $('#me-error');

    mockEditOverlay.hide();

    // Fetch route details and mocked responses
    const routeId = getUrlParameter('id');
    const routeDetails = await fetchRouteDetails(routeId);
    const mockedResponses = await fetchMockedResponses(routeId);

    // Display route details
    displayRouteDetails(routeDetails);

    // Display mocked responses
    displayMockedResponses(mockedResponses);

    function displayRouteDetails(routeDetails) {
        // Construct HTML for route details
        const html = `
            <div data-label="ID:">${routeDetails.id}</div>
            <div data-label="Service:">${routeDetails.service}</div>
            <div data-label="Method:">${routeDetails.method}</div>
            <div data-label="Path:">${routeDetails.path}</div>
            <div data-label="ReqKeys:">${routeDetails.reqKeyParams}</div>
        `;
        routeDetailsContainer.html(html);
    }

    function displayMockedResponses(mockedResponses) {
        mockedResponseList.empty();
        mockedResponses.forEach(response => {
            const row = `
                <tr>
                    <td class="edit-cell"><a href="#" class="edit-link"><img src="image/edit.svg" alt="Edit" width="24" height="24"></a></td>
                    <td>${response.reqKey}</td>
                    <td>${response.type}</td>
                    <td id="fixed-cell">${response.content}</td>
                </tr>
            `;
            mockedResponseList.append(row);
        });
    }

    $('#add-mock-btn').on('click', function() {
        mockEditOverlay.show();
    });

    $('.edit-link').on('click', async function(e) {
        e.preventDefault(); // Prevent default link behavior
        console.log('Edit cell clicked');
        mockEditOverlay.show();
        // Populate the fields
        const row = $(this).closest('tr');
        const reqKey = row.find('td:eq(1)').text();
        const type = row.find('td:eq(2)').text();
        const routeResHub = await fetch(`/api/res-hub?routeId=${routeId}&reqKey=${reqKey}&bpc=true`);
        const routeResHubData = await routeResHub.json();
        const content = routeResHubData.resHubInfo.content;
        const ttl = routeResHubData.resHubInfo.ttl;
        const age = routeResHubData.resHubInfo.age;
        $("#ttl-label").text('TTL (Age: ' + age + 's):');

        $('#me-reqKey').val(reqKey);
        $('#me-type').val(type);
        $('#me-ttl').val(ttl)
        $('#me-content').val(content);
    });

    $('#me-formatContent').on('click', function(e) {
        console.log('Format content clicked');
        e.preventDefault();
        //TODO: Format the content in the content field
    });

    $('#me-saveButton').on('click', function(e) {
        e.preventDefault(); // Prevent default form submission behavior
        // Get the data from the form fields
        const reqKey = $('#me-reqKey').val();
        const type = $('#me-type').val();
        const content = $('#me-content').val();
        const ttl = $('#me-ttl').val();
        // Prepare the data to be sent to the API
        const requestData = {
            "routeId": routeId,
            "reqKey": reqKey,
            "type": type,
            "ttl": ttl,
            "content": content,
        };
        // Send AJAX request to the API
        $.ajax({
            url: '/api/res-hub/upsert',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(requestData),
            success: async function (response) {
                // Handle success response
                console.log('Data saved successfully:', response);
                await fetch(`/api/res-hub?routeId=${routeId}&reqKey=${reqKey}&bpc=true`);
                location.reload(true);
                meError.hide();
                mockEditOverlay.hide();
            },
            error: function (xhr, status, error) {
                console.error('Error saving data:', error);
                meError.text('Error saving data: ' + error);
                meError.show();
            }
        });
    });

    $('#me-cancel').on('click', function(e) {
        e.preventDefault();
        meError.hide();
        mockEditOverlay.hide();
    });


    async function fetchRouteDetails(routeId) {
        const response = await fetch(`/api/route?routeId=${routeId}`);
        return await response.json();
    }

    async function fetchMockedResponses(routeId) {
        // Fetch mocked responses for the route from your API
        // Replace this with your actual API endpoint
        const response = await fetch(`/api/res-hub/list?routeId=${routeId}`);
        const data = await response.json();
        return data.resHubList;
    }

    // Function to get URL parameters
    function getUrlParameter(name) {
        name = name.replace(/[[]/, '\\[').replace(/[\]]/, '\\]');
        const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        const results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

});
