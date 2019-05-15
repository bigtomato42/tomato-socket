import { TomatoSocketServer } from './server';

let app = new TomatoSocketServer().getApp();
export { app };