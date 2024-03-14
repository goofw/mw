const { mw } = require("./mw.js");

module.exports = () => {
    mw(...process.argv.slice(2, 7))
    .then(json => console.log(JSON.stringify(json, null, 4)))
    .catch(error => console.error(error));
};
