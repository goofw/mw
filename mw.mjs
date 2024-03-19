const {
    buildProviders,
    getBuiltinSources,
    getBuiltinEmbeds,
    makeProviders,
    makeStandardFetcher,
    targets
} = await (async () => {
    try {
        return await import('@movie-web/providers')
    } catch {
        return await import('npm:@movie-web/providers')
    }
})();

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

export async function mw(query, s = 1, e = 1, so = "", eo = "", ip = false) {
    const media = await getMediaDetails(query, s, e);
    let input = { media: media };
    if (so && so.length)
        input.sourceOrder = so.split(",");
    if (eo && eo.length)
        input.embedOrder = eo.split(",");
    
    const sources = input.sourceOrder ?? getBuiltinSources().map(s => s.id);
    const embeds = input.embedOrder ?? getBuiltinEmbeds().map(e => e.id);
    let providers = buildProviders()
        .setFetcher(makeStandardFetcher(fetch))
        .setTarget(targets.ANY)
    if (ip)
        providers.enableConsistentIpForRequests()
    for (let source of sources)
        providers.addSource(source)
    for (let embed of embeds)
        providers.addEmbed(embed)
    providers = providers.build();
    
    let output = await providers.runAll(input) || {};
    //let output = await providers.runSourceScraper({...input, id: input.sourceOrder[0]}) || {};
    output.media = media;
    return output;
}

const default_providers = makeProviders({
    fetcher: makeStandardFetcher(fetch),
    target: targets.ANY,
    consistentIpForRequests: true
});
export const metadata =
    default_providers.listSources().map(s => s.id).join(",") + "\n"+
    default_providers.listEmbeds().map(e => e.id).join(",") + "\n";
