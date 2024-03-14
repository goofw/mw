const server = require("./server.js");
const cli = require("./cli.js");

process.argv.length === 2 ? server() : cli();
