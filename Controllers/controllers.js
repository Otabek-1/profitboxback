const pool = require('./pg');
const queries = require('./queries');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');


// Faylni yuklash konfiguratsiyasi
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Fayllar saqlanadigan papka
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unikal fayl nomi
    }
});

const upload = multer({ storage });


function getUsers(req, res) {
    pool.query(queries.getUsers)
        .then(result => {
            res.json(result.rows);
        })
        .catch(error => {
            console.error('Xatolik:', error.stack);
            res.status(500).send('Xatolik yuz berdi');
        });
}

let globaccess = "";

function addUser(req, res) {
    const { firstname, lastname, uname, phoneNumber, email, password, address } = req.body;



    // Tekshiruv uchun alohida so'rovlar
    const checkPhoneQuery = "SELECT * FROM profitboxusers WHERE phone = $1";
    const checkEmailQuery = "SELECT * FROM profitboxusers WHERE email = $1";
    const checkUnameQuery = "SELECT * FROM profitboxusers WHERE username = $1";

    // 1. Telefon raqamni tekshirish
    pool.query(checkPhoneQuery, [phoneNumber])
        .then(phoneResult => {
            if (phoneResult?.rows?.length > 0) {
                return res.status(400).json({ message: "User with this phone number is already registered." });
            }

            // 2. Emailni tekshirish
            return pool.query(checkEmailQuery, [email]);
        })
        .then(emailResult => {
            if (emailResult?.rows?.length > 0) {
                return res.status(400).json({ message: "User with this email is already registered." });
            }

            // 3. Username'ni tekshirish
            return pool.query(checkUnameQuery, [uname]);
        })
        .then(unameResult => {
            if (unameResult?.rows?.length > 0) {
                return res.status(400).json({ message: "This username is already taken." });
            }
            const accessid = crypto.createHash('sha256').update(firstname).digest('hex') + Math.random() * 100;
            globaccess = accessid;
            const psw = crypto.createHash('sha256').update(password).digest('hex');
            return pool.query(
                queries.addUser,
                [firstname, lastname, uname, phoneNumber, accessid, address, email, psw]
            );
        })
        .then(() => {
            if (!res.headersSent) {
                res.json({ message: "User successfully added!", accessid: globaccess });
            }
        })
        .catch(err => {
            if (!res.headersSent) {
                console.error("Error:", err);
                res.status(500).json({ message: "An error occurred on the server." });
            }
        });
}

function getUser(req, res) {
    const { acc } = req.query;
    pool.query(queries.getUser, [acc])
        .then(response => {
            res.send(response.rows)
        })
        .catch(err => {
            res.send(err);
        })
}

async function Login(req, res) {
    try {
        const { email, psw } = req.body;
        const hashedPassword = crypto.createHash('sha256').update(psw).digest('hex');
        const result = await pool.query(queries.login, [email, hashedPassword]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: "An error occurred during login." });
    }
}


// Add shop clusters to the database

async function addShopCluster(req, res) {
    const { shopname, shopowner, shop_desc, categories } = req.body;
    const categories_ = categories.split(' ');
    const shop_picture = req.file ? req.file.path : null; // Rasm fayli yo'q bo'lsa, `null` saqlanadi

    try {
        const result = await pool.query(queries.addShopCluster, [shopname, shopowner, shop_picture, shop_desc, categories_]);
        if (result.rowCount > 0) {
            res.json({ message: "Shop cluster added successfully", shop_picture });
        } else {
            res.status(400).json({ message: "Error adding shop cluster" });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: `Error: ${error.message}` });
    }
}

async function getShopsOf(req, res) {
    const access = req.headers.authorization?.split(" ")[1];
    try {
        const result = await pool.query(queries.getshopsOf, [access]);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(400).json({ message: "error getting hops of", error });
        console.log(error);

    }
}

async function addEdu(req, res) {
    console.log("Request Body:", req.body);
    console.log("Uploaded File:", req.file);

    const { center_name, center_owner, edu_desc, categories } = req.body;
    const categories_ = categories ? categories.split(' ') : [];
    const edu_picture = req.file ? req.file.path : null;

    if (!center_name || !center_owner) {
        return res.status(400).json({ message: "center_name and center_owner are required!" });
    }

    try {
        const result = await pool.query(
            `
        INSERT INTO edu_centers 
        (center_name, center_owner, edu_picture, edu_desc, categories) 
        VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [center_name, center_owner, edu_picture, edu_desc, categories_]
        );

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Error adding education center:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

async function getEduCentersOf(req, res) {
    const access = req.headers.authorization?.split(" ")[1];
    try {
        const result = await pool.query(queries.getEduCenters, [access]);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(400).json({ message: "error getting hops of", error });
        console.log(error);

    }
}

async function ViewShop(req, res) {
    const { id, owner } = req.params;
    try {
        const result = await pool.query(queries.viewshop, [id, owner]);
        if(result.rowCount >0){
            res.status(200).json(result.rows[0]);
        }else{
            res.status(404).json({ message: "Shop not found!" });
        }
    } catch (error) {
        res.status(400).json({ message: error })
    }
}

async function getShopProducts(req, res) {
    const { id } = req.query;  // Query parameter orqali `id` ni olish
    try {
        const result = await pool.query(queries.getShopProducts, [id]);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(400).json({ message: error });
        console.log(error);
    }
}

async function addTelegramChannel(req,res){
    const { id, channel} = req.body;
    try {
        const result = await pool.query(queries.addTelegramChannel, [channel, id])
        res.status(200).json({message:"Channel added successfully."});
    } catch (error) {
        res.status(400).json({ message: error });
    }
}

// backend/routes/shop.js

// Add product to a shop
async function addProduct(req, res) {
    const { shop_id, product_name, product_desc, sizes } = req.body;
    const sizesArray = sizes ? sizes.split(' ') : []; // If sizes are provided, split by space
    const product_picture = req.file ? req.file.path : null;  // If a file is uploaded, use its path

    try {
        // Insert the product data into the database
        const result = await pool.query(queries.addProduct, [
            product_name,
            shop_id,
            product_picture,
            product_desc,
            sizesArray
        ]);
        
        if (result.rowCount > 0) {
            res.json({ message: "Product added successfully!", product_picture });
        } else {
            res.status(400).json({ message: "Error adding product" });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: `Error: ${error.message}` });
    }
}


async function ForgotPassword(req,res){
    const { email } = req.body;
    try {
        const user = await pool.query(queries.getUserByEmail, [email]);
        if(user.rows.length > 0){
            res.status(200).json({ message: "Password reset link sent to your email.", token });
        }else{
            res.status(404).json({ message: "User not found!" });
        }
    } catch (error) {
        res.status(400).json({ message: error });
    }
}


module.exports = {
    getUsers,
    addUser,
    getUser,
    Login,
    addShopCluster,
    getShopsOf,
    addEdu,
    getEduCentersOf,
    ViewShop,
    getShopProducts,
    addTelegramChannel,
    addProduct,
};
