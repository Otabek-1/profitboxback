// server.js
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const controllers = require("./Controllers/controllers"); // Controllerlar import qilindi
const startBot = require('./bot'); // bot.js dan startBot funksiyasini import qilish

const app = express();
const PORT = 4000;
const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// Static fayllar uchun (rasm korish uchun)
app.use('/uploads', express.static('uploads'));

// Marshrutlar
app.get('/', controllers.getUsers);
app.post("/register", controllers.addUser);
app.post('/login', controllers.Login);
app.get('/getuser', controllers.getUser);
app.post('/addShop', upload.single('shop_picture'), controllers.addShopCluster); // Multer ishlatilgan
app.get('/shopsOf', controllers.getShopsOf);
app.post('/addedu', upload.single('edu_picture'), controllers.addEdu);
app.get('/centerof', controllers.getEduCentersOf);
app.get('/shop/:id/:owner', controllers.ViewShop);
app.get('/getshopproducts', controllers.getShopProducts);
app.put('/addtgch', controllers.addTelegramChannel);
app.post('/addproduct', upload.single('product_picture'), controllers.addProduct);
app.post('/forgot-password', controllers.ForgotPassword);
app.post('/check-code', controllers.checkCode);
app.put('/update-password', controllers.updatePassword);
// Serverni ishga tushirish
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

// Botni ishga tushirish
startBot();
