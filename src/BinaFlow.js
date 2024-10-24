let baseSchema = require('./base-schema_pb')

export default class BinaFlow {

    callbacks; // Map. Key - message id, value - {successCallback, errorCallback}
    webSocket;
    messageIdCounter = 0;
    connectionUrl = '/binaflow';
    schemas = [baseSchema];
    onOpen = () => {
        console.log('[BinaFlow] WebSocket connection established');
    };

    constructor(schemas) {
        this.callbacks = new Map();
        this.onMessage = this.onMessage.bind(this);
        this.send = this.send.bind(this);
        // add to this.schemas all schemas that were passed to the constructor
        for (let schema of schemas) {
            this.schemas.push(schema);
        }
    }

    connect() {
        this.webSocket = new WebSocket(this.connectionUrl);
        this.webSocket.onopen = this.onOpen;
        this.webSocket.onmessage = this.onMessage;
    }

    onMessage(event) {
        event.data.arrayBuffer().then(buffer => {
            let binaryMessage = new Uint8Array(buffer);
            let baseMessage = baseSchema.BaseMessage.deserializeBinary(binaryMessage);
            let callbackEntry = this.callbacks.get(baseMessage.messageid);
            let message;
            for (let schema of this.schemas) {
                if (schema[baseMessage.getMessagetype()] !== undefined) {
                    message = schema[baseMessage.getMessagetype()].deserializeBinary(binaryMessage);
                    break;
                }
            }
            if (message === undefined) {
                console.error("Can't deserialize message");
                return;
            }
            if (message.getMessagetype() === 'Error') {
                if (callbackEntry.errorCallback) {
                    callbackEntry.errorCallback(message);
                    this.callbacks.delete(message.messageid);
                }
            } else {
                if (callbackEntry.successCallback) {
                    callbackEntry.successCallback(message);
                    this.callbacks.delete(message.messageid);
                }
            }
        });
    }

    send(message, successCallback, errorCallback) {
        if (message.getMessagetype() === undefined || message.getMessagetype() === null) {
            throw new Error('Message type is not defined');
        }
        this.messageIdCounter++;
        message.setMessageid(this.messageIdCounter.toString());
        this.webSocket.send(message.serializeBinary());
        this.callbacks.set(message.messageid, {
            successCallback: successCallback,
            errorCallback: errorCallback
        });
    }

    close() {
        this.webSocket.close();
    }
}