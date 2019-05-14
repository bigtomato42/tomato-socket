import { createServer, Server } from 'http';
import * as express from 'express';
import * as socketIo from 'socket.io';

import { Status } from './model/status.model';

export class ChatServer {
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
    }

    private createServer(): void {
        this.server = createServer(this.app);
    }

    private config(): void {
        this.port = process.env.PORT || ChatServer.PORT;
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


            socket.on('connected', (user) => {

                let updateItem = this.stats.find(stat => stat.user == user);

                if (updateItem != null) {
                    let index = this.stats.indexOf(updateItem);
                    this.stats[index] = { user, info: 'Online' };
                } else {
                    this.stats.push({ user, info: 'Online' });
                }

                console.log(this.stats);
            });

            socket.on('message', (m) => {
                console.log('[server](message): %s', JSON.stringify(m));

                this.io.emit('message', m);
            });

            socket.on('disconnected', (user) => {
                console.log('Client disconnected '+ user);
                // this.stats = this.stats.filter(stat => stat.user == user)
                let updateItem = this.stats.find(stat => stat.user == user);

                if (updateItem != null) {
                    let index = this.stats.indexOf(updateItem);
                    this.stats[index] = { user, info: 'Offline' };
                } else {
                    this.stats.push({ user, info: 'Offline' });
                }
                console.log(this.stats);

            });
        });
    }



    public getApp(): express.Application {
        return this.app;
    }
}