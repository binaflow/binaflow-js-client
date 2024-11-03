# binaflow

### Binary message exchanging via WebSocket.

This project is a JS library that provides tools for extremely fast binary message exchanging via WebSocket.
For defining schema used protobuf.

## Getting Started

### Prerequisites

- google-protobuf ^3.21.4 (as **dev** dependency)
- Protoc 28.3

### How to use

1) Add the following dependency to your project:

```shell
npm i @binaflow/binaflow-js-client
```

2) Create a protobuf schema:

```protobuf
syntax = "proto3";

message GetCitiesRequest {
  string messageType = 1;
  string messageId = 2;
  double latitude = 3;
  double longitude = 4;
  double maxDistance = 5;
  int64 minPopulation = 6;
}

message GetCitiesResponse {
  string messageType = 1;
  string messageId = 2;
  repeated City cities = 3;
}

message City {
  string name = 1;
  double latitude = 2;
  double longitude = 3;
  int64 population = 4;
}
```

**Note:** any message that will use as DTO must contain `string messageType = 1;` and `string messageId = 2;` fields.
There is really important, because BinaFlow uses these fields for routing messages. But if message is not DTO, you can
skip these fields, for example `City` message.

3) Generate classes from protobuf schema:

```json5
{
   // package.json
   "scripts": {
      "build": "protoc --js_out=import_style=commonjs,binary:src --proto_path=../proto-schema cities-picker-schema.proto && webpack"
   },
}
```

4) Create binaflow object and connect to the server:

```javascript
import BinaFlow from 'binaflow'

const schema = require('./cities-picker-schema_pb')

let binaFlow = new BinaFlow([schema]);
binaFlow.onOpen = () => {
   getCities();
}
binaFlow.connect();
```

5) Send a message to the server:

```javascript
function getCities() {
   let request = new schema.GetCitiesRequest();
   request.setMessagetype("GetCitiesRequest");
   request.setLatitude(0);
   request.setLongitude(0);
   request.setMaxdistance(1_000_000);
   request.setMinpopulation(100_000);
   binaFlow.send(request, (response) => {
      console.log('Cities', response.getCitiesList());
   }, (error) => {
      console.log('Error response', error);
   });
}
```