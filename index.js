const { makeProviders, makeStandardFetcher, targets } = require('@movie-web/providers');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

async function makeTMDBRequest(url) {
    return fetch(new URL(url), {
        method: 'GET',
        headers: {
            accept: 'application/json',
            authorization: `Bearer ${process.env.TMDB_READ_API_KEY}`
        }
    });
}

async function getMediaDetails(query, s = 1, e = 1) {
    let url = null;
    if (query.match(/tt\d+/))
        url = `https://api.themoviedb.org/3/find/${query}?external_source=imdb_id`;
    else
        url = `https://api.themoviedb.org/3/search/multi?query=${query}`;
    let response = await makeTMDBRequest(url);
    response = await response.json();
    if (response.results)
        response = response.results[0];
    else
        response = response.movie_results[0] || response.tv_results[0];
    if (response.media_type === "movie") {
        return {
            type: 'movie',
            title: response.title,
            releaseYear: Number(response.release_date.split('-')[0]),
            tmdbId: response.id
        };
    }
    if (response.media_type === "tv") {
        return {
            type: 'show',
            title: response.name,
            releaseYear: Number(response.first_air_date.split('-')[0]),
            tmdbId: response.id,
            season: {
                number: s
            },
            episode: {
                number: e
            }
        };
    }
}

app.set('json spaces', 4);

app.get("/:imdbId/:s?/:e?", async (req, res, next) => {
    if (req.params.imdbId.match(/tt\d+/))
        req.url = "/api" + req.url;
    next();
});

app.get("/api/:query/:s?/:e?", async (req, res) => {
    const media = await getMediaDetails(req.params.query, req.params.s || 1, req.params.e || 1);
    const providers = makeProviders({
        fetcher: makeStandardFetcher(fetch),
        target: targets.ANY
    });
    let output = await providers.runAll({ media: media })
    if (output)
        output.media = media;
    res.json(output);
});

app.use(express.static('movie-web'));

app.listen(port, () => console.log(`Server ready on port ${port}.`));
