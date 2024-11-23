const getUsers = "SELECT  * FROM profitboxusers";
const addUser = `
  INSERT INTO profitboxusers (firstname, lastname, username, phone, accessid, adress, email, password)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
`;


module.exports = {
    getUsers,
    addUser,
}