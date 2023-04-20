const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const formatMessage = require("./utils/message");

const { userJoin, getCurrentUser,userLeave, getRoomUsers } = require("./utils/users")

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const botName = "Admin";

//set static folder
app.use(express.static(path.join(__dirname, 'public')));

//this will run when the user will connect

io.on("connection", (socket) => {
    // console.log("New Ws connection....")

    socket.on("joinRoom", ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);
        //welcome current user
        socket.emit('message', formatMessage(botName, "Welcome to the room"));

        //broadcast when user connect
        socket.broadcast.to(user.room).emit("message", formatMessage(botName, `${user.username} joined the room`));

        //send users and room info

        io.to(user.room).emit("roomUsers", {
            room : user.room,
            users : getRoomUsers(user.room)
        });

    })




    //listen for the chatMessage from the main.js
    socket.on("chatMessage", (msg) => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit("message", formatMessage(`${user.username}`, msg));
    });

    //run when user disconnect
    socket.on("disconnect", () => {
        const user = userLeave(socket.id);
        if(user){
        io.to(user.room).emit("message", formatMessage(botName, `${user.username} left the room`));
        
        // get users and room info
        io.to(user.room).emit("roomUsers", {
            room : user.room,
            users : getRoomUsers(user.room)
        });

        }
    });
});

const PORT = 3000 || process.env.PORT;
server.listen(PORT, () => { console.log(`server is listening on port ${PORT}`) })

