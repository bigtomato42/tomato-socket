import { createServer, Server } from 'http';
import * as express from 'express';
import * as socketIo from 'socket.io';

import { Status } from './model/status.model';

export class TomatoSocketServer {
    public static readonly PORT: number = 8080;
    private app: express.Application;
    private server: Server;
    private io: SocketIO.Server;
    private port: string | number;

    private stats: Status[] = [];

    constructor() {
        this.createApp();
        this.config();
        this.createServer();
        this.sockets();
        this.listen();
    }

    private createApp(): void {
        this.app = express();
        this.app.get('/', function (req, res) {
            res.send('GET request to the homepage')
          })
        this.app.use(function(req, res){
            res.send("Invalid Endpoint. :/");
        });
    }

    private createServer(): void {
        this.server = createServer(this.app);
    }

    private config(): void {
        this.port = process.env.PORT || TomatoSocketServer.PORT;
    }

    private sockets(): void {
        this.io = socketIo(this.server);
    }

    private listen(): void {
        this.server.listen(this.port, () => {
            console.log('Running server on port %s', this.port);
        });

        this.io.on('connect', (socket: any) => {
            console.log('Connected client on port %s.', this.port);
            let currentUsername;
            let currentRoom;

            socket.on('connected', (data) => {
                currentUsername = data.user;
                currentRoom = data.room;

                socket.join(currentRoom, () => {
                    // let rooms = Object.keys(socket.rooms);
                    // console.log(rooms); // [ <socket.id>, 'room 237' ]
                });

                let updateStatus = this.stats.find(stat => stat.username === currentUsername);

                if (updateStatus != null) {
                    let index = this.stats.indexOf(updateStatus);
                    this.stats[index] = { username: currentUsername, info: 'Online' };

                    this.io.in(currentRoom).emit('status', this.stats[index]);
                    console.log('a ' + currentRoom);
                    console.log(this.stats[index]);


                } else {
                    updateStatus = { username: currentUsername, info: 'Online' };
                    this.stats.push(updateStatus);

                    this.io.in(currentRoom).emit('status', updateStatus);
                    console.log('b ' + currentRoom);
                    console.log(updateStatus);


                }
                // console.log(this.stats);


            });

            socket.on('message', (data) => {
                currentRoom = data.room;
                console.log('[server](message): %s', JSON.stringify(data.message));

                // this.io.to(room).emit('message', m);
                this.io.in(currentRoom).emit('message', data.message);

            });

            socket.on('disconnected', () => {
                console.log('Client disconnected ' + currentUsername);
            });

            socket.on('disconnect', () => {
                console.log('Client disconnect ' + currentUsername);

                let updateStatus = this.stats.find(stat => stat.username === currentUsername);

                if (updateStatus != null) {
                    let index = this.stats.indexOf(updateStatus);
                    this.stats[index] = { username: currentUsername, info: 'Offline' };

                    this.io.in(currentRoom).emit('status', this.stats[index]);
                    console.log('dc ' + currentRoom);
                    console.log(this.stats[index]);

                }
                // console.log(this.stats);
            });
        });
    }



    public getApp(): express.Application {
        return this.app;
    }
}