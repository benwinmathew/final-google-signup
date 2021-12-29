const express = require('express');
const app = express();

const port = process.env.PORT || 5000;

const {OAuth2Client} = require('google-auth-library');

const CLIENT_ID = '1006794615933-r2qu918flj6rld4v28t89j557774soj3.apps.googleusercontent.com'

const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const mongoUrl = 'mongodb+srv://benwin:benwin123@cluster0.hzxez.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
let db;
const secret = 'himynameisbenwin';
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
app.use(cors());

app.get('/', (req, res) => {
    res.send('Hello guys');
})

// app.get('/index', (req, res) => {
//     res.render('index');
// })

async function verify(client, token) {
    let ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    return ticket.getPayload();
    // const userid = payload['sub'];
    // If request specified a G Suite domain:
    // const domain = payload['hd'];
}

app.get('/gauthenticate', async(req, res) => {
    let token = req.query.id_token;
    const client = new OAuth2Client(CLIENT_ID);
    let x = await verify(client, token).catch(console.error);
    // console.log(x)
    // res.send(x);
    if (x.email_verified) {
        db.collection('user').find({email: x.email}).toArray((err, result) => {
            if(err) throw(err);
            if(result.length<1){
                db.collection('user').insert([{
                    name: x.name,
                    email: x.email,
                    password: bcrypt.hashSync(x.at_hash, 8)
                }])
                db.collection('user').find({email: x.email}).toArray((err, result) => {
                    if(err) throw(err);
                    let tkn = jwt.sign({id: result[0]._id}, secret);
                    res.send({
                        auth: true,
                        token: tkn
                    })
                })
            }
            else{
                token = jwt.sign({id: result[0]._id}, secret);
                res.send({
                    auth: true,
                    token: token
                })
            }
        })
    }
    else {
        res.send({
            auth: false,
            messege: "User unauthorized"
        })
    }
})


MongoClient.connect(mongoUrl, (err, client) => {
    if(err) {
        console.log('Error while connecting');
    }
    else{
        db = client.db('google-signup');
    }
})

app.listen(port, () => {
    console.log("Listening to port: " + port);
})