[![Build Status](https://travis-ci.org/brenohq/nodejs-shopping-cart.svg?branch=master)](https://travis-ci.org/librah/nodejs-shopping-cart)

This shopping cart demo is built based on the work from
[NerdStore - Carrinho de Compras - NodeJS/Express](https://github.com/brenohq/nodejs-shopping-cart)

# Live Demo on Heroku:
[maruji-store.herokuapp.com](https://maruji-store.herokuapp.com/)


### Run Locally on Your Machine
You need Node, NPM and MongoDB properly installed.

Clone this repository
``` shell
    git clone https://github.com/brenohq/nodejs-shopping-cart.git
```
Setup the environment variables replacing <MONGODB-PORT> with your mongodb port, usually is 27017.
``` shell
    export MONGODB_URI=mongodb://localhost:<MONGODB-PORT>/shopping
```
Install dependencies
``` shell
    npm install
```

With your mongod service running, this will populate shopping database
``` shell
    node seed/product-seeder.js 
```
This will start dev server at http://localhost:3000 with Nodemon.
``` shell
    npm run dev
```

### Tests
``` shell
    npm test
```

### Technologies
###### Back-end
NodeJS, Express, MongoDB, Mongoose. 
###### Fron-end
Handlebars and Bootstrap.