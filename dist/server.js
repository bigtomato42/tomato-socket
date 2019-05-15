"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http_1 = require("http");
var express = require("express");
var socketIo = require("socket.io");
var TomatoSocketServer = /** @class */ (function () {
    function TomatoSocketServer() {
        this.stats = [];
        this.createApp();
        this.config();
        this.createServer();
        this.sockets();
        this.listen();
    }
    TomatoSocketServer.prototype.createApp = function () {
        this.app = express();
    };
    TomatoSocketServer.prototype.createServer = function () {
        this.server = http_1.createServer(this.app);
    };
    TomatoSocketServer.prototype.config = function () {
        this.port = process.env.PORT || TomatoSocketServer.PORT;
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
                var updateStatus = _this.stats.find(function (stat) { return stat.username === currentUsername; });
                if (updateStatus != null) {
                    var index = _this.stats.indexOf(updateStatus);
                    _this.stats[index] = { username: currentUsername, info: 'Online' };
                    _this.io.in(currentRoom).emit('status', _this.stats[index]);
                    console.log('a ' + currentRoom);
                    console.log(_this.stats[index]);
                }
                else {
                    updateStatus = { username: currentUsername, info: 'Online' };
                    _this.stats.push(updateStatus);
                    _this.io.in(currentRoom).emit('status', updateStatus);
                    console.log('b ' + currentRoom);
                    console.log(updateStatus);
                }
                // console.log(this.stats);
            });
            socket.on('message', function (data) {
                currentRoom = data.room;
                console.log('[server](message): %s', JSON.stringify(data.message));
                // this.io.to(room).emit('message', m);
                _this.io.in(currentRoom).emit('message', data.message);
            });
            socket.on('disconnected', function () {
                console.log('Client disconnected ' + currentUsername);
            });
            socket.on('disconnect', function () {
                console.log('Client disconnect ' + currentUsername);
                var updateStatus = _this.stats.find(function (stat) { return stat.username === currentUsername; });
                if (updateStatus != null) {
                    var index = _this.stats.indexOf(updateStatus);
                    _this.stats[index] = { username: currentUsername, info: 'Offline' };
                    _this.io.in(currentRoom).emit('status', _this.stats[index]);
                    console.log('dc ' + currentRoom);
                    console.log(_this.stats[index]);
                }
                // console.log(this.stats);
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
