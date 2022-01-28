const express=require('express');
const path = require('path');
const http = require('http');
const {addUser,removeUser,getUser,getUsersInRoom}=require('./utils/users') 
const { generateMessage,generateLocationMessage } = require('../src/utils/messages');
const Filter = require('bad-words');
const socketio=require('socket.io');
const { emit } = require('process');
const port = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = socketio(server);
app.use(express.static(path.join(__dirname, "../public")));

io.on('connection', (socket) => { 
    console.log("new Web Socket Connection");
    
    socket.on('join', ({ username, room },callback) => {
        const { error, user } = addUser({ id: socket.id, username, room })
        if (error) {
            return callback(error);
        }
        socket.join(user.room);
        socket.emit('message', generateMessage('Admin','Welcome!'));
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined`));
        io.to(user.room).emit('roomData', {
              room:user.room,
            users: getUsersInRoom(user.room),       
        })
        callback();
    })
    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter()
       
        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed');
        }
        const user = getUser(socket.id);
        if (!user) {
            return callback("User Not Found");
        }
        io.to(user.room).emit('message', generateMessage(user.username,message));
        callback();
    })
    socket.on('sendLocation', (position, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username,`https://google.com/maps?q=${position.latitude},${position.longitude}`));
        callback();

    })
    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`));
            io.to(user.room).emit('roomData', {
                room:user.room,
              users: getUsersInRoom(user.room),       
          })
        }
       
    })

});

server.listen(port, () => {
    console.log("listening on", port);
});