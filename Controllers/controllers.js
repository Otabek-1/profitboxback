const pool = require('./pg');
const queries = require('./queries');

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

function addUser(req, res) {
    const { firstname, lastname, uname, phoneNumber, email, password, address } = req.body; // Changed 'adress' to 'address'

    const accessid = "accesskeyid";

    pool.query(queries.addUser, [firstname, lastname, uname, phoneNumber, accessid, address, email, password])  // Changed 'adress' to 'address'
        .then(result => {
            res.json({ message: "User successfully added!" });
        })
        .catch(err => {
            console.error(err);
            res.json({ message: "User failed to be added" });
        });
}


module.exports = {
    getUsers,
    addUser
};
