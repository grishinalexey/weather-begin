const path = require('path')
const express = require('express')
const requestPromise = require('request-promise')
const exphbs = require('express-handlebars')

const app = express();

app.engine('.hbs', exphbs({
    defaultLayout: 'main',
    extname: '.hbs',
    layoutsDir: path.join(__dirname, 'views/layouts')
}));
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

app.get('/favicon.ico', () => {});
app.get('/:city', (req, res) => {
    let wheather = {};
    requestPromise({
        uri: 'http://apidev.accuweather.com/locations/v1/search',
        qs: {
            q: req.params.city,
            apiKey: process.env.API_KEY,
        },
        json: true,
        simple: false
    })
    .then((data) => {
        if(data.length === 0){
            throw new Error('Bad request');
        }
        wheather.city = data[0].EnglishName;
        return requestPromise({
            uri: 'http://apidev.accuweather.com/currentconditions/v1/' + data[0].Key,
            qs: {
                language: 'en',
                apiKey: process.env.API_KEY,
            },
            json: true
        });
    })
    .then((data) => {
        const iconNumber = data[0].WeatherIcon;
        const preparedIconNumber = iconNumber < 10 ? ('0' + iconNumber) : iconNumber;
        res.render('index', {
            city: wheather.city,
            temperature: {
                value: data[0].Temperature.Metric.Value,
                unit: data[0].Temperature.Metric.Unit,
            },
            description: data[0].WeatherText,
            icon: {
                url: 'http://apidev.accuweather.com/developers/Media/Default/WeatherIcons/' + preparedIconNumber + '-s.png',
            }
        });
    })
    .catch((err) => {
        console.log(err);
        res.render('error', { error: { message: err.message, stack: err.stack } });
    });
});
app.listen(3000);