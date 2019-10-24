const express = require("express");
// const redis = require("redis");

const app = express(); // init express app

const server = require("http").createServer(app); // wrap app in HTTP server
const io = require("socket.io")(server); // init socket.io server

// const redisClient = redis.createClient(); // init redis client

let displayConfig = {
    youtubeId: "ZY3J3Y_OU0w",
    headingText: "Fall Coffeehouse 2019",
    headingColor: [255, 255, 255],
    position: ["centered"],
    playing: true
};

// socket for DISPLAY (visual output)
const displaySocket = io.of("/display");

const updateConfig = socket => socket.emit("display-config", displayConfig);

displaySocket.on("connection", socket => {
    updateConfig(socket);

    socket.on("player-state", state => {
        if (state == true || state == false) displayConfig.playing = state;
    });
});

// socket for ADMIN (administrator panel)
const adminSocket = io.of("/admin");

adminSocket.on("connection", socket => {
    console.log("admin connected");
    updateConfig(socket);

    socket.on("display-update-config", config => {
        // fix the security here! This sucks! Oh well, this is for one-time use anyways...
        let configKeys = Object.keys(config);
        configKeys.forEach((item, index) => {
            displayConfig[item] = config[item];
        });

        displaySocket.emit("display-update-config", config);
    });

    socket.on("update-heading-text", data => {

    })
});

app.use((req, res, next) => {
    req.headers['if-none-match'] = 'no-match-for-this';
    res.setHeader("Cache-Control", 'no-cache');
    next();
});

app.use(express.static(__dirname + "/static"));

app.get("/", (req, res) => {
    res.status(200).sendFile(__dirname + "/display.html");
});

app.get("/admin", (req, res) => {
    res.status(200).sendFile(__dirname + "/admin.html");
});

// listen server
const listener = server.listen(process.env.COFFEEHOUSE_PORT || 3050, () => console.log(`Server listening on port ${listener.address().port}`));