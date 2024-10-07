const express = require("express")
const registerUser = require("../controller/registerUser")

const router = express.Router()

//Create user api
router.post('/register',registerUser)


module.exports = router