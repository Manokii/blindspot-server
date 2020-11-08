const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIO = require("socket.io");
const INDEXFILE = '/index.html'

const port = process.env.PORT || 3100;

// const app = express();
// const server = http.createServer(app);

// app.get("/", (req, res) => {
//   res.send("Server is up and running");
// });

const server = express()
  .use((req, res) => res.sendFile(INDEXFILE, {root: __dirname}))
  .listen(port, () => {
  console.log(`[server] Listening to port: ${port}`);
});

const io = socketIO(server);
const livestream = io.of("/live");

// io.configure(function () { 
//   io.set("transports", ["xhr-polling"]); 
//   io.set("polling duration", 10); 
// });

setInterval(() => io.emit('time', new Date().toTimeString()), 1000 * 60);

let tournament, bracket, control, organizer;
let live = {
  match_current: {},
  match_widgets: [],
  popup: {
    imgUrl: "",
    title: "",
    icon: "",
    details: "",
    live: false,
  },
};
let tournaments = [];
livestream.on("connection", (socket) => {
  console.log(`[connection] ${socket.id}`);
  //  List all the data data to emit on join
  socket.emit("tournament", tournament);
  socket.emit("set_live_settings", live);
  //   socket.emit("tournaments", tournaments);
  socket.emit("bracket", bracket);
  socket.emit("organizer", organizer);
  socket.emit("status", true);

  // Tournament
  socket.on("tournament", (data) => {
    tournament = data;
    livestream.emit("tournament", data);
  });

  socket.on("set_live_settings", (data) => {
    live = { ...live, ...data };
    livestream.emit("set_live_settings", data);
  });

  socket.on("get_live_settings", () => {
    socket.emit("set_live_settings", live);
  });

  socket.on("add_match_widget", (data) => {
    console.log(`[Live] Added match widget`);
    // prettier-ignore
    live = live.match_widgets.find((match) => match.TournamentMatchId === data.TournamentMatchId)
      ? live
      : { ...live, match_widgets: [...live.match_widgets, data] };
    livestream.emit("add_match_widget", data);
  });

  socket.on("remove_match_widget", (tournamentId) => {
    // prettier-ignore
    live.match_widgets.splice(live.match_widgets.findIndex(match => match.TournamentMatchId === tournamentId),1)
    livestream.emit("remove_match_widget", tournamentId);
  });

  //   socket.on("tournaments", (data) => {
  //     tournaments = [...data];
  //     livestream.emit("tournaments", data);
  //   });

  // Organization
  socket.on("organizer", (data) => {
    organizer = data;
    livestream.emit("organizer", data);
    console.log(`[server] Organizer: ${data.OrganizerName}`);
  });

  socket.on("join", (data) => {
    console.log(data);
  });
  // current active bracket
  socket.on("active-bracket", (data) => {
    bracket = data;
    livestream.emit("active-bracket", data);
  });

  socket.on("disconnect", (boolean) => {
    socket.emit("status", false);
  });

  socket.on("check", (msg) => {
    console.log(msg);
  });
});
