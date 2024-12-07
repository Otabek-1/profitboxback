
const getUsers = "SELECT  * FROM profitboxusers";
const addUser = `
  INSERT INTO profitboxusers (firstname, lastname, username, phone, accessid, adress, email, password)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
`;
const getUser = `SELECT * FROM profitboxusers WHERE accessid = $1`;
const login = `SELECT * FROM profitboxusers WHERE email = $1 AND password = $2`;
const addShopCluster = `INSERT INTO shops (shopname,shopowner,shop_picture,shop_desc,categories) VALUES ($1, $2, $3, $4, $5)`;
const getshopsOf = `SELECT * FROM shops WHERE shopowner = $1`;
const viewshop = `SELECT * FROM shops WHERE id = $1 AND shopowner = $2`;
const getShopProducts = `SELECT * FROM shop_products WHERE shop_id = $1`;

const addEduCenter = `INSERT INTO edu_centers (center_name, center_owner, edu_picture, edu_desc,categories) VALUES ($1, $2,$3,$4,$5)`;
const getEduCenters = `SELECT * FROM edu_centers where center_owner = $1`;
const addTelegramChannel = `UPDATE shops SET telegram_channel = $1 WHERE id = $2;`;
// backend/queries.js
const getUserByEmail = `SELECT * FROM users WHERE email=$1`;
// Add product query
const addProduct = `
    INSERT INTO shop_products (product_name, shop_id, product_image, product_desc, sizes) 
    VALUES ($1, $2, $3, $4, $5) RETURNING *;
`;

module.exports = {
  getUsers,
  addUser,
  getUser,
  login,
  addShopCluster,
  getshopsOf,
  addEduCenter,
  getEduCenters,
  viewshop,
  getShopProducts,
  addTelegramChannel,
  addProduct,
  getUserByEmail
}