"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http_1 = require("http");
var express = require("express");
var socketIo = require("socket.io");
var admin = require("firebase-admin");
var TomatoSocketServer = /** @class */ (function () {
    // private stats: Status[] = [];
    function TomatoSocketServer() {
        this.createApp();
        this.config();
        this.connectFirebase();
        this.createServer();
        this.sockets();
        this.listen();
    }
    TomatoSocketServer.prototype.createApp = function () {
        this.app = express();
        this.app.get('/', function (req, res) {
            res.send('GET request to the Tomato-Socket Homepage');
        });
        this.app.use(function (req, res) {
            res.send("Invalid Endpoint. :/");
        });
    };
    TomatoSocketServer.prototype.createServer = function () {
        this.server = http_1.createServer(this.app);
    };
    TomatoSocketServer.prototype.config = function () {
        this.port = process.env.PORT || TomatoSocketServer.PORT;
    };
    TomatoSocketServer.prototype.connectFirebase = function () {
        var serviceAccount = require("../service-account-file.json");
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://bigtomato42.firebaseio.com"
        });
        this.firebaseDB = admin.firestore();
    };
    TomatoSocketServer.prototype.sockets = function () {
        this.io = socketIo(this.server);
    };
    TomatoSocketServer.prototype.listen = function () {
        var _this = this;
        this.server.listen(this.port, function () {
            console.log('Running server on port %s', _this.port);
        });
        this.io.on('connect', function (socket) {
            console.log('Connected client on port %s.', _this.port);
            var currentUsername;
            var currentRoom;
            socket.on('connected', function (data) {
                currentUsername = data.user;
                currentRoom = data.room;
                socket.join(currentRoom, function () {
                    // let rooms = Object.keys(socket.rooms);
                    // console.log(rooms); // [ <socket.id>, 'room 237' ]
                });
                if (currentUsername && currentRoom) {
                    var userRef = _this.firebaseDB.collection("" + currentRoom)
                        .doc(currentUsername)
                        .set({ username: currentUsername, status: "Online" });
                    _this.io.in(currentRoom).emit('status', { username: currentUsername, status: "Online" });
                    var doc = _this.firebaseDB.collection("" + currentRoom);
                    var observer = doc.onSnapshot(function (docSnapshot) {
                        // console.log(`Received doc snapshot: ${docSnapshot}`);
                        var users = [];
                        docSnapshot.forEach(function (doc) {
                            users.push(doc.data());
                        });
                        socket.emit('users', users);
                    }, function (err) {
                        console.log("Encountered error: " + err);
                    });
                    // var usersRef = this.firebaseDB.collection(`${currentRoom}`).get().then(snapshot => {
                    //     snapshot.forEach(doc => {
                    //         users.push(doc.data())
                    //     });
                    //     // socket.emit('users', users);
                    //     console.log(users)
                    // })
                    //     .catch(err => {
                    //         console.log('Error getting documents', err);
                    //     });
                }
            });
            socket.on('message', function (data) {
                currentRoom = data.room;
                console.log('[server](message): %s', JSON.stringify(data.message));
                // this.io.to(room).emit('message', m);
                _this.io.in(currentRoom).emit('message', data.message);
            });
            socket.on('disconnected', function () {
                console.log('Client disconnected ' + currentUsername);
                if (currentUsername && currentRoom) {
                    _this.firebaseDB.collection("" + currentRoom).doc(currentUsername).set({ username: currentUsername, status: "Offline" });
                    _this.io.in(currentRoom.t).emit('status', { username: currentUsername, status: "Offline" });
                }
            });
            socket.on('disconnect', function () {
                console.log('Client disconnect ' + currentUsername);
                if (currentUsername && currentRoom) {
                    _this.firebaseDB.collection("" + currentRoom).doc(currentUsername).set({ username: currentUsername, status: "Offline" });
                    _this.io.in(currentRoom.t).emit('status', { username: currentUsername, status: "Offline" });
                }
            });
        });
    };
    TomatoSocketServer.prototype.getApp = function () {
        return this.app;
    };
    TomatoSocketServer.PORT = 8080;
    return TomatoSocketServer;
}());
exports.TomatoSocketServer = TomatoSocketServer;
