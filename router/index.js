const express = require("express")
const registerUser = require("../controller/registerUser")
const checkEmail = require("../controller/checkEmail")
const checkPassword = require("../controller/checkPassword")
const userDetails = require("../controller/userDetail")
const logout = require("../controller/logout")
const updateUserDetails = require("../controller/updateUserDetails")
const searchUser = require("../controller/searchUser")

const router = express.Router()

//Create user api
router.post('/register',registerUser)

//check user email
router.post('/email',checkEmail)

//check user password
router.post('/password', checkPassword)

//login user details
router.get('/user-details',userDetails)

//update user details
router.post('/update-user',updateUserDetails)

//logout user
router.get('/logout',logout)

//search user
router.post('/search-user',searchUser)


module.exports = router