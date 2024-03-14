const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const { providers, mw } = require("./mw.js");

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
    res.send(
        providers.listSources().map(s => s.id).join(",") + "\n" +
        providers.listEmbeds().map(e => e.id).join(",") + "\n"
    );
});

app.get("/version", (req, res) => {
    res.send(
        require("fs").readFileSync(__dirname + "/VERSION", "utf-8") +
        require("./node_modules/@movie-web/providers/package.json").version + "\n"
    );
});

app.get("/ip", async (req, res) => {
    res.json(await (await fetch("https://ipinfo.io/json")).json());
});

app.use((req, res) => { res.sendStatus(403); });

module.exports = () => { app.listen(port, () => console.log(`Server ready on port ${port}.`)); };
