import { readFileSync } from "node:fs"
import { createServer } from 'node:http'
import { createServerAdapter } from '@whatwg-node/server'
import { createResponse, error, Router, text, withParams } from 'itty-router'
import { mw, metadata } from "./mw.mjs"

if (process.argv.length === 2 ) {
    const router = Router();
    const port = process.env.PORT || 3000;
    createServer(createServerAdapter(request => router
        .all("*", withParams)
        .get("/:imdb/:s?/:e?", req => {
            if (req.params.imdb.match(/tt\d+/)) {
                const new_url = new URL(req.url);
                new_url.pathname = "/api" + new_url.pathname
                return router.handle(new Request(new_url));
            }
        })
        .get("/api/:imdb/:s?/:e?", ({ imdb, s, e, query: { so, eo } }) => mw(imdb, s, e, so, eo))
        .get("/metadata", () => text(metadata))
        .get("/version", () => text(
            readFileSync(new URL('VERSION', import.meta.url), "utf-8") +
            JSON.parse(readFileSync("./node_modules/@movie-web/providers/package.json")).version + "\n"
        ))
        .get("/ip", () => fetch("https://ipinfo.io/json"))
        .all("*", () => error(404))
        .handle(request)
        .then(createResponse("application/json", v => JSON.stringify(v, null, 4)))
    )).listen(port, () => console.log(`Server ready on port ${port}.`));
} else {
    console.log(JSON.stringify(await mw(...process.argv.slice(2, 7)), null, 4));
}
