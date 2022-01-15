const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
const NodeCache = require('node-cache');

const port = process.env.PORT || 4000;

//ttl 180sec
const myCache = new NodeCache({
    stdTTL: 180
})

const app = express();

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
method  GET
route   /
body    list of all moves 
*/
app.get("/", async (req, res) => {
    const movesList = []
    if (myCache.has("movesList")) {
        console.log("getting from cache");
        return res.send(myCache.get("movesList"))
    }
    else {
        await axios.get("https://www.chessgames.com/chessecohelp.html")
            .then(res => {
                const $ = cheerio.load(res.data);
                $("body > font > p > table > tbody > tr ").each((index, element) => {
                    const tds = $(element).find("td");
                    //console.log($(tds[0]).text())
                    movesList.push({
                        code: $(tds[0]).text(),
                        move: $(tds[1]).text()
                    })
                })
            })
            .catch(err => { console.log(err) });
        myCache.set("movesList", movesList);
        console.log("getting from API");
        res.send(movesList);
    }
})

/*
method  GET
route   /CODE/..
body    get move associated with code 
*/
app.get("/CODE/:id", async (req, res) => {
    let codeId = req.params.id;
    console.log(codeId)
    let data;
    if (myCache.has("movesList")) {
        const movesList = myCache.get("movesList");
        data = movesList.find(move => move.code === codeId)
        if (!data) return res.status(400).send("error in moveID..");
        console.log("getting code from cache")
        res.send(data.move);
    }
    else {
        await axios.get("https://www.chessgames.com/chessecohelp.html")
            .then(res => {
                const $ = cheerio.load(res.data);
                $("body > font > p > table > tbody > tr ").each((index, element) => {
                    const tds = $(element).find("td");
                    if ($(tds[0]).text() == codeId) {
                        data = $(tds[1]).text();
                        return false;
                    }
                })
            })
            .catch(err => { console.log(err) });
        if (!data) res.status(400).send("error in moveID..")
        console.log("getting code from API")
        res.send(data);
    }
})

app.listen(port, () => { console.log('Connected') })
