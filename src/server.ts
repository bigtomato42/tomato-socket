import { createServer, Server } from 'http';
import * as express from 'express';
import * as socketIo from 'socket.io';
import * as admin from 'firebase-admin';

import { Firestore } from '@google-cloud/firestore';

export class TomatoSocketServer {
    public static readonly PORT: number = 8080;
    private app: express.Application;
    private server: Server;
    private io: SocketIO.Server;
    private port: string | number;

    private firebaseDB: Firestore;


    // private stats: Status[] = [];

    constructor() {
        this.createApp();
        this.config();
        this.connectFirebase()
        this.createServer();
        this.sockets();
        this.listen();
    }

    private createApp(): void {
        this.app = express();
        this.app.get('/', function (req, res) {
            res.send('GET request to the Tomato-Socket Homepage')
        })
        this.app.use(function (req, res) {
            res.send("Invalid Endpoint. :/");
        });
    }

    private createServer(): void {
        this.server = createServer(this.app);
    }

    private config(): void {
        this.port = process.env.PORT || TomatoSocketServer.PORT;
    }

    private connectFirebase(): void {
        var serviceAccount = require("../service-account-file.json");

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://bigtomato42.firebaseio.com"
        });
        this.firebaseDB = admin.firestore()
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

                if (currentUsername && currentRoom) {
                    var userRef = this.firebaseDB.collection(`${currentRoom}`)
                        .doc(currentUsername)
                        .set({ username: currentUsername, status: "Online" })

                    this.io.in(currentRoom).emit('status', { username: currentUsername, status: "Online" });

                    var doc = this.firebaseDB.collection(`${currentRoom}`);

                    var observer = doc.onSnapshot(docSnapshot => {
                        // console.log(`Received doc snapshot: ${docSnapshot}`);
                        let users = [];
                        docSnapshot.forEach(doc => {
                            users.push(doc.data())
                        });
                        socket.emit('users', users);
                    }, err => {
                        console.log(`Encountered error: ${err}`);
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

            socket.on('message', (data) => {
                currentRoom = data.room;
                console.log('[server](message): %s', JSON.stringify(data.message));

                // this.io.to(room).emit('message', m);
                this.io.in(currentRoom).emit('message', data.message);

            });

            socket.on('disconnected', () => {
                console.log('Client disconnected ' + currentUsername);

                if (currentUsername && currentRoom) {
                    this.firebaseDB.collection(`${currentRoom}`).doc(currentUsername).set({ username: currentUsername, status: "Offline" })
                    this.io.in(currentRoom.t).emit('status', { username: currentUsername, status: "Offline" });
                }
            });

            socket.on('disconnect', () => {
                console.log('Client disconnect ' + currentUsername);

                if (currentUsername && currentRoom) {
                    this.firebaseDB.collection(`${currentRoom}`).doc(currentUsername).set({ username: currentUsername, status: "Offline" })
                    this.io.in(currentRoom.t).emit('status', { username: currentUsername, status: "Offline" });
                }
            });
        });
    }



    public getApp(): express.Application {
        return this.app;
    }
}