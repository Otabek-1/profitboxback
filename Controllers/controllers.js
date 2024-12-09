const pool = require('./pg');
const queries = require('./queries');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const nodemailer = require("nodemailer");
const { log } = require('console');

// Email Transporter Configuration
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "burhonovotabek5@gmail.com", // Replace with your email
        pass: "bstc rlmw hfor xbla", // Replace with your email password or app password
    },
});

// Centralized File Upload Configuration
const upload = multer({
    storage: multer.diskStorage({
        destination: 'uploads/',
        filename: (req, file, cb) => {
            cb(null, Date.now() + path.extname(file.originalname));
        }
    }),
});

// Get All Users
function getUsers(req, res) {
    pool.query(queries.getUsers)
        .then(result => res.json(result.rows))
        .catch(error => {
            console.error('Error:', error.stack);
            res.status(500).send('Internal server error');
        });
}

// Add New User
function addUser(req, res) {
    const { firstname, lastname, uname, phoneNumber, email, password, address } = req.body;

    // Generate unique access ID and hashed password
    const accessid = crypto.createHash('sha256').update(firstname).digest('hex') + Math.random() * 100;
    const psw = crypto.createHash('sha256').update(password).digest('hex');

    // Check for existing phone, email, and username
    Promise.all([
        pool.query("SELECT * FROM profitboxusers WHERE phone = $1", [phoneNumber]),
        pool.query("SELECT * FROM profitboxusers WHERE email = $1", [email]),
        pool.query("SELECT * FROM profitboxusers WHERE username = $1", [uname])
    ])
        .then(([phoneResult, emailResult, unameResult]) => {
            if (phoneResult.rows.length > 0) {
                return res.status(400).json({ message: "User with this phone number is already registered." });
            }
            if (emailResult.rows.length > 0) {
                return res.status(400).json({ message: "User with this email is already registered." });
            }
            if (unameResult.rows.length > 0) {
                return res.status(400).json({ message: "This username is already taken." });
            }

            // Insert new user
            return pool.query(queries.addUser, [firstname, lastname, uname, phoneNumber, accessid, address, email, psw]);
        })
        .then(() => res.json({ message: "User successfully added!", accessid }))
        .catch(error => {
            console.error('Error:', error.stack);
            res.status(500).json({ message: "Internal server error" });
        });
}

// Get Single User
function getUser(req, res) {
    const { acc } = req.query;
    pool.query(queries.getUser, [acc])
        .then(response => res.json(response.rows))
        .catch(err => res.status(500).json({ message: "Internal server error", error: err.message }));
}

// User Login
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
        res.status(500).json({ message: "Internal server error" });
    }
}

// Add Shop Cluster
async function addShopCluster(req, res) {
    const { shopname, shopowner, shop_desc, categories } = req.body;
    const categories_ = categories.split(' ');
    const shop_picture = req.file ? req.file.path : null;

    try {
        const result = await pool.query(queries.addShopCluster, [shopname, shopowner, shop_picture, shop_desc, categories_]);

        if (result.rowCount > 0) {
            res.json({ message: "Shop cluster added successfully", shop_picture });
        } else {
            res.status(400).json({ message: "Error adding shop cluster" });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Get Shops for a User
async function getShopsOf(req, res) {
    const access = req.headers.authorization?.split(" ")[1];
    try {
        const result = await pool.query(queries.getshopsOf, [access]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function checkCode(req, res) {
    const { id, code } = req.body;
    try {
        const result = await pool.query(queries.getPassCode, [code, id]);
        if (result.rows.length > 0) {
            res.json({ message: "Code is correct", change: true });
            pool.query(queries.removeCode, [id, code]);
        } else {
            res.status(400).json({ message: "Code is incorrect" });
        }
    } catch (error) {
        res.status(500).json({ message: error })
    }
}

// Forgot Password
async function ForgotPassword(req, res) {
    const { email } = req.body;
    const code = Math.floor(10000 + Math.random() * 9000); // Generate a random 4-digit code

    try {
        const user = await pool.query(queries.getUserByEmail, [email]);

        if (user.rows.length > 0) {
            const mailOptions = {
                from: "burhonovotabek5@gmail.com",
                to: email,
                subject: "Password reset code",
                text: `Your password reset code is: ${code}`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                    return res.status(500).json({ message: "Error sending email", error });
                }
                res.json({ message: "Password reset code sent to your email.", data: user.rows[0] });
                pool.query(queries.addPassCode, [user.rows[0].id, code])
                console.log(info);

            });
        } else {
            res.status(404).json({ message: "User not found with this email!" });
        }
    } catch (error) {
        console.error('Error during password reset:', error);
        res.status(500).json({ message: "Internal server error" });
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
        if (result.rowCount > 0) {
            res.status(200).json(result.rows[0]);
        } else {
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

async function addTelegramChannel(req, res) {
    const { id, channel } = req.body;
    try {
        const result = await pool.query(queries.addTelegramChannel, [channel, id])
        res.status(200).json({ message: "Channel added successfully." });
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

async function updatePassword(req,res) {
    const { id, newPassword } = req.body;
    const psw = crypto.createHash('sha256').update(newPassword).digest('hex');
    try {
        const result = await pool.query(queries.updatePassword, [psw, id]);
        res.status(200).json({ message: "Password updated successfully"})
    } catch (error) {
        res.status(400).json({ message: "Error updating password" });
    }
    
}


// Exports
module.exports = {
    getUsers,
    addUser,
    Login,
    getUser,
    addShopCluster,
    getShopsOf,
    addEdu,
    getEduCentersOf,
    ViewShop,
    getShopProducts,
    addTelegramChannel,
    addProduct,
    ForgotPassword,
    checkCode,
    updatePassword,
};
