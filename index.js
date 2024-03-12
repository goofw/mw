const { makeProviders, makeStandardFetcher, targets } = require('@movie-web/providers');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

async function makeTMDBRequest(url) {
    return fetch(new URL(url), {
        method: 'GET',
        headers: {
            accept: 'application/json',
            authorization: "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzNzIzYmFiNjEyZGQ2ODE0ZGU5N2NhNTM3NjliOGZmMiIsInN1YiI6IjY1MTVlYjBkY2FkYjZiMDJiZjAxMWZiNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.8m-XSM_5y3xP3UwfhDD_kmM54SU5NW0c9Oe_j_BZhdQ"
        }
    });
}

async function getIMDBId(query, media_type, id) {
    if (query.match(/tt\d+/))
        return query;
    let response = await makeTMDBRequest(`https://api.themoviedb.org/3/${media_type}/${id}?append_to_response=external_ids`);
    response = await response.json();
    return response.external_ids.imdb_id;
}

async function getEpisodeName(id, s, e) {
    let response = await makeTMDBRequest(`https://api.themoviedb.org/3/tv/${id}/season/${s}/episode/${e}`);
    response = await response.json();
    return response.name;
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
    const imdbId = await getIMDBId(query, response.media_type, response.id);
    
    if (response.media_type === "movie") {
        return {
            type: 'movie',
            title: response.title,
            releaseYear: Number(response.release_date.split('-')[0]),
            tmdbId: response.id,
            imdbId: imdbId
        };
    }
    
    if (response.media_type === "tv") {
        return {
            type: 'show',
            title: response.name,
            releaseYear: Number(response.first_air_date.split('-')[0]),
            tmdbId: response.id,
            imdbId: imdbId,
            season: {
                number: s
            },
            episode: {
                number: e,
                name: await getEpisodeName(response.id, s, e)
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
    let media = await getMediaDetails(req.params.query, req.params.s || 1, req.params.e || 1);
    const providers = makeProviders({
        fetcher: makeStandardFetcher(fetch),
        target: targets.ANY
    });

    let input = { media: media };
    if (req.query.so && req.query.so.length)
        input.sourceOrder = req.query.so.split(",");
    if (req.query.eo && req.query.eo.length)
        input.embedOrder = req.query.eo.split(",");
    let output = await providers.runAll(input) || {};
    output.media = media;
    res.json(output);
});

app.get("/metadata", async (req, res) => {
    const providers = makeProviders({
        fetcher: makeStandardFetcher(fetch),
        target: targets.ANY
    });
    res.json([providers.listSources(), providers.listEmbeds()]);
});

app.use('/version', express.static('VERSION'));
app.get("/version", async (req, res) => {
    res.send(require("./node_modules/@movie-web/providers/package.json").version);
});

app.use((req, res) => {
    res.redirect("https://goofw.github.io/mw");
});

app.listen(port, () => console.log(`Server ready on port ${port}.`));
