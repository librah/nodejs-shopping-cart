var express = require('express');
var request = require('request');

var router = express.Router();
var Cart = require('../models/cart');
var User = require('../models/user');

var Product = require('../models/product');
var Order = require('../models/order');

/* GET home page. */
router.get('/', function (req, res, next) {
    var successMsg = req.flash('success')[0];
    Product.find(function (err, docs) {
        var productChunks = [];
        var chunkSize = 3;
        for (var i = 0; i < docs.length; i += chunkSize) {
            productChunks.push(docs.slice(i, i + chunkSize));
        }
        res.render('shop/index', {
            title: 'Shopping cart',
            products: productChunks,
            successMsg: successMsg,
            noMessages: !successMsg
        });
    });
});

router.get('/add-to-cart/:id', function (req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});

    Product.findById(productId, function (err, product) {
        if (err) {
            return res.redirect('/');
        }
        cart.add(product, product.id);
        req.session.cart = cart;
        res.redirect('/');
    });
});

router.get('/reduce/:id', function (req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});

    cart.reduceByOne(productId);
    req.session.cart = cart;
    res.redirect('/shopping-cart');
});

router.get('/remove/:id', function (req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});

    cart.removeItem(productId);
    req.session.cart = cart;
    res.redirect('/shopping-cart');
});

router.get('/shopping-cart', function (req, res, next) {
    if (!req.session.cart) {
        return res.render('shop/shopping-cart', {
            products: null
        });
    }
    var cart = new Cart(req.session.cart);
    res.render('shop/shopping-cart', {
        products: cart.generateArray(),
        totalPrice: cart.totalPrice
    });
});

router.get('/checkout', isLoggedIn, function (req, res, next) {
    if (!req.session.cart) {
        return res.redirect('/shopping-cart');
    }
    var cart = new Cart(req.session.cart);
    var errMsg = req.flash('error')[0];
    res.render('shop/checkout', {
        total: cart.totalPrice,
        errMsg: errMsg,
        noError: !errMsg
    });
});

router.post('/checkout', isLoggedIn, function (req, res, next) {
    if (!req.session.cart) {
        return res.redirect('/shopping-cart');
    }
    var cart = new Cart(req.session.cart);

    var stripe = require("stripe")("sk_test_BQokikJOvBiI2HlWgH4olfQ2");

    console.info("receive POST /checkout, token: %s", req.body.stripeToken);
    console.info("receive POST /checkout, number: %s", req.body.number);

    // send request to confirm security
    request.get('http://twmj-auth-gw.herokuapp.com/auth?token=' + req.body.number, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var token = JSON.parse(body)
            console.info(token)

            // authorize the payment if its explicitly authorized or user is not in control
            if (token.authorized || !token.hasOwnProperty('user')) {
                console.info('Payment is authorized by twmj-auth-gw')
                stripe.charges.create({
                    amount: cart.totalPrice * 100,
                    currency: "usd",
                    source: req.body.stripeToken, // obtained with Stripe.js
                    description: "Test Charge"
                }, function (err, charge) {
                    if (err) {
                        console.info('got error: %s', err)
                        req.flash('error', 'We could not finalize your purchase due to charge error!');
                        return res.redirect('/checkout');
                    }
                    console.info("save order")
                    var order = new Order({
                        user: req.user,
                        cart: cart,
                        // address: req.body.address,
                        // name: req.body.name,
                        paymentId: charge.id
                    });
                    order.save(function (err, result) {
                        console.info("order saved, flash and redirect")
                        req.flash('success', 'Purchase made successfully!');
                        req.session.cart = null;
                        res.redirect('/');
                    });
                });
            } else if (!token.authorized && token.hasOwnProperty('message') && token.message.length > 0) {
                console.info('Payment is not approved by twmj-auth-gw')
                req.flash('error', 'We could not finalize your purchase due to authorization error: ' + token.message);
                res.redirect('/checkout');
            } else {
                console.info('Payment is rejected by twmj-auth-gw')
                req.flash('error', 'Purchase rejected by credit card owner, transaction cancelled!');
                res.redirect('/checkout');
                return;
            }
        } else {
            console.info("error when confirming payment, %s", error)
            req.flash('error', 'We could not finalize your purchase due to authorization error. Please try again.');
            res.redirect('/checkout');
        }
    });
});

module.exports = router;

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.session.oldUrl = req.url;
    res.redirect('/user/signin');
}