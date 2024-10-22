document.addEventListener('DOMContentLoaded', function () {
    const impactForm = document.getElementById('impact-form');
    if (impactForm) {
        impactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const cep = document.getElementById('cep').value;
            getCoordinatesAndPlacesFromCEP(cep);
        });
    }

    const addPointForm = document.getElementById('add-point-form');
    if (addPointForm) {
        addPointForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const latitude = parseFloat(document.getElementById('latitude').value);
            const longitude = parseFloat(document.getElementById('longitude').value);

            const newPoint = { name, latitude, longitude };

            fetch('/points', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newPoint)
            })
                .then(response => response.json())
                .then(data => {
                    alert('Ponto de coleta cadastrado com sucesso!');
                    addMarker({ lat: latitude, lng: longitude }, name);
                })
                .catch(error => console.error('Erro ao cadastrar ponto de coleta:', error));
        });
    }
});

async function getCoordinatesAndPlacesFromCEP(cep) {
    try {
        const response = await fetch(`http://localhost:3000/geocode/${cep}`);
        if (!response.ok) {
            throw new Error('Erro na resposta do servidor: ' + response.statusText);
        }
        const data = await response.json();
        if (!data.location || !data.places) {
            throw new Error('Estrutura de dados inesperada: ' + JSON.stringify(data));
        }
        const { location, places } = data;

        // Inicializa o mapa na localização obtida
        initMap(location.lat, location.lng);

        // Exibe e adiciona marcadores para os pontos de coleta
        displayPlaces(places);
    } catch (error) {
        console.error('Erro ao converter CEP:', error);
    }
}

async function displayPlaces(places) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    if (places.length > 0) {
        for (const place of places) {
            const distance = await calculateDistance(place.geometry.location);
            const placeElement = document.createElement('div');
            placeElement.innerHTML = `<strong>${place.name}</strong><br>
                                      Endereço: ${place.vicinity || 'Não disponível'}<br>
                                      Distância: ${distance}`;
            resultsDiv.appendChild(placeElement);

            // Adiciona marcador para cada ponto de coleta
            addMarker({ lat: place.geometry.location.lat, lng: place.geometry.location.lng }, place.name);
        }
    } else {
        resultsDiv.textContent = 'Nenhum ponto de coleta encontrado.';
    }
}

function initMap(lat = -23.55052, lng = -46.633308) {
    // Definindo o mapa no objeto window
    window.map = new google.maps.Map(document.getElementById('map'), {
        center: { lat, lng },
        zoom: 12
    });
}

function addMarker(position, title) {
    // Verifique se o mapa foi inicializado
    if (window.map) {
        new google.maps.Marker({
            position,
            map: window.map,
            title
        });
    } else {
        console.error('O mapa ainda não foi inicializado.');
    }
}

async function calculateDistance(location) {
    const origin = new google.maps.LatLng(window.map.getCenter().lat(), window.map.getCenter().lng());
    const destination = new google.maps.LatLng(location.lat, location.lng);

    const service = new google.maps.DistanceMatrixService();
    const request = {
        origins: [origin],
        destinations: [destination],
        travelMode: 'DRIVING',
    };

    return new Promise((resolve, reject) => {
        service.getDistanceMatrix(request, (response, status) => {
            if (status === 'OK') {
                const distance = response.rows[0].elements[0].distance.text;
                resolve(distance);
            } else {
                reject('Erro ao calcular distância');
            }
        });
    });
}
