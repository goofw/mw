import { mw, metadata } from "./mw.mjs"
import express from "express"
import fs from "fs"

if (process.argv.length === 2 ) {
    const app = express();
    const port = process.env.PORT || 3000;
    
    app.set('json spaces', 4);
    
    app.get("/:imdbId/:s?/:e?", async (req, res, next) => {
        if (req.params.imdbId.match(/tt\d+/))
            req.url = "/api" + req.url;
        next();
    });
    
    app.get("/api/:query/:s?/:e?", async (req, res) => {
        res.json(await mw(req.params.query, req.params.s, req.params.e, req.query.so, req.query.eo));
    });
    
    app.get("/metadata", async (req, res) => {
        res.send(metadata);
    });
    
    app.get("/version", (req, res) => {
        res.send(
            fs.readFileSync(import.meta.url.split('/').slice(2,-1).join('/') + "/VERSION", "utf-8") +
            JSON.parse(fs.readFileSync("./node_modules/@movie-web/providers/package.json")).version + "\n"
        );
    });
    
    app.get("/ip", async (req, res) => {
        res.json(await (await fetch("https://ipinfo.io/json")).json());
    });
    
    app.use((req, res) => { res.sendStatus(403); });
    
    app.listen(port, () => console.log(`Server ready on port ${port}.`));
} else {
    const json = await mw(...process.argv.slice(2, 7));
    console.log(JSON.stringify(json, null, 4));
}
