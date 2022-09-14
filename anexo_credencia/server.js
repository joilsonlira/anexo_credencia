require('dotenv').config()

const express = require('express')

const app = express()
app.set('view engine', 'ejs')
// app.use(express.static('public'))
app.use(express.static(__dirname + '/public'));
app.use(express.json())

const paypal = require('@paypal/checkout-server-sdk')
const Environment = process.env.NODE_ENV === 'production' 
    ?paypal.core.LiveEnvironment
    :paypal.core.SandboxEnvironment
const paypalClient = new paypal.core.PayPalHttpClient(new Environment(
    process.env.PAYPAL_CLIENT_ID, 
    process.env.PAYPAL_CLIENT_SECRET
))

const storeItems = ([
    [1,{price:100, name:"ingresso para Feira"}]
    [1,{price:200, name:"ingresso para Palestra"}]
])

app.get('/', (req, res)=>{
        res.render('index', {paypalClientId: process.env.PAYPAL_CLIENT_ID,
    })
})
app.get('/cadastro', (req, res)=>{
        res.render('cadastro')
})
app.get('/ingresso', (req, res)=>{
    res.render('ingresso')
})
app.post('/create-order', (req, res) => {
    const request = new paypal.orders.OrdersCreateRequest()
    const total = req.body.items.reduce((sum, item) =>{
        return sum + storeItems.get(item.id).price * item.quantity
    }, 0)
    request.prefer("return=representation")
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [
            {
                amount:{
                    currency_code: 'BRL',
                    value: total,
                    breakdown:{
                        item_total: {
                            currency_code: "BRL",
                            value: total
                        }
                    }
                },
                items: req.body.items.map(item => {
                    const storeItems = storeItems.get(item.id)
                    return{
                        name: storeItem.name,
                        unit_amount: {
                            currency_code: "BRL",
                            value: storeItem.price
                        },
                        quantity:item.quantity
                    }
                })
            }
        ]
    })

    try{
        const order = paypalClient.execute(request)
        console.log(order)
    }catch(e){
        res.status(500).json({ error: e.message })
    }
})

app.listen(3000)