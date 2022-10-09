const http = require("http");
const app = require("express")();
app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"))

app.listen(8888, () => console.log("Listening on http port 8888"))
const websocketServer = require("websocket").server
const httpServer = http.createServer();
httpServer.listen(9090, () => console.log("Listening.. on 9090"))
//hashmap clients
const clients = {};
const games = {};

const wsServer = new websocketServer({
    "httpServer": httpServer
})
wsServer.on("request", request => {

    //connect
    const connection = request.accept(null, request.origin);
    connection.on("open", () => console.log("opened!"))
    connection.on("close", () => console.log("closed!"))
    connection.on("message", message => {

        const result = JSON.parse(message.utf8Data)

        //Client create a new game
        if (result.method === "create") {

            const clientId = result.clientId;
            // const gameId = guid();
            const gameId = "asdf";

            games[gameId] = {
                "id": gameId,
                "limit": result.limit,
                "clients": []
            }

            const payLoad = {
                "method": "create",
                "game": games[gameId]
            }

            const con = clients[clientId].connection;
            con.send(JSON.stringify(payLoad));
        }

        //Client join to game
        if (result.method === "join") {
            if (result.gameId in games) {
                console.log(result);
                console.log(typeof result.gameId);
                const clientId = result.clientId;
                const clientName = result.clientName;
                const gameId = result.gameId;
                const score = result.pscore;
                const defaultPLV = 1;
                const game = games[gameId];

                if (game.clients.length > 5) {
                    return;
                }

                const color = {
                    "0": "Red",
                    "1": "Green",
                    "2": "Blue",
                    "3": "#4C0033",
                    "4": "Black",
                }[game.clients.length]

                game.clients.push({
                    "clientId": clientId,
                    "color": color,
                    "clientName": clientName,
                    "defaultPLV": defaultPLV,
                })

                //start the game
                if (game.clients.length === 2) updateGameState();

                const payLoad = {
                    "method": "join",
                    "game": game
                }

                //loop through all clients and tell them that people has joined
                game.clients.forEach(c => {
                    clients[c.clientId].connection.send(JSON.stringify(payLoad))
                })
            } else {
                const payLoad = {
                    "method": "game doesnt exits",
                    "msg": "Please create or join game"
                }

                clients[result.clientId].connection.send(JSON.stringify(payLoad))

            }
        }

        //Client plays (click button)
        if (result.method === "play") {

            const gameId = result.gameId;
            const clientID = result.clientId;
            const clientName = result.clientName;
            const ballId = result.ballId;
            const color = result.color;
            let score = result.pscore;
            let state = games[gameId].state;
            let state2 = games[gameId].state2;
            let state3 = games[gameId].state3;

            if (!state)
                state = {}
            if (!state2)
                state2 = {}
            if (!state3)
                state3 = {}

            state[ballId] = color;
            state2[clientID] = score;
            state3[clientID] = clientName;
            games[gameId].state = state;
            games[gameId].state2 = state2;
            games[gameId].state3 = state3;
        }

    })

    //generate a new clientId
    const clientId = guid();
    clients[clientId] = {
        "connection": connection
    }

    const payLoad = {
        "method": "connect",
        "clientId": clientId,
        "pickaxe":1,
    }
    //send back the client connect
    connection.send(JSON.stringify(payLoad))

})


function updateGameState() {

    for (const g of Object.keys(games)) {
        const game = games[g]
        const payLoad = {
            "method": "update",
            "game": game
        }

        game.clients.forEach(c => {
            clients[c.clientId].connection.send(JSON.stringify(payLoad))
        })
    }

    // set delay
    setTimeout(updateGameState, 50);
}



function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0, 3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();