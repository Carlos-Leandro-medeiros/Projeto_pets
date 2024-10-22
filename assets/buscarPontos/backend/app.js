import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

// Configuração do dotenv
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiKey = process.env.GOOGLE_API_KEY;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(express.json());

app.get('/geocode/:cep', async (req, res) => {
    const { cep } = req.params;
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${cep}&key=${apiKey}`;

    try {
        const geocodeResponse = await fetch(geocodeUrl);
        const geocodeData = await geocodeResponse.json();

        if (geocodeData.status === 'OK') {
            const location = geocodeData.results[0].geometry.location;
            const { lat, lng } = location;

            const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&keyword=reciclagem&key=${apiKey}`;
            const placesResponse = await fetch(placesUrl);
            const placesData = await placesResponse.json();

            if (placesData.status === 'OK') {
                const filteredPlaces = placesData.results.filter(place =>
                    place.name.toLowerCase().includes('reciclagem') ||
                    place.name.toLowerCase().includes('coleta') ||
                    place.name.toLowerCase().includes('ferro velho') ||
                    place.name.toLowerCase().includes('recycling')
                );

                res.json({ location, places: filteredPlaces });
            } else {
                res.status(404).json({ error: 'Nenhum lugar encontrado', message: placesData.status });
            }
        } else {
            res.status(404).json({ error: 'CEP não encontrado', message: geocodeData.status });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erro ao processar requisição', message: error.message });
    }
});

app.post('/points', (req, res) => {
    const newPoint = req.body;
    fetch('http://localhost:3002/points', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPoint)
    })
        .then(response => response.json())
        .then(data => res.json(data))
        .catch(error => res.status(500).json({ error: 'Erro ao cadastrar ponto de coleta' }));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
