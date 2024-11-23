const UserModel = require("../models/UserModel")

async function searchUser(request,response){
    try {
        const { search, excludeUserId } = request.body
        console.log(search, excludeUserId);
        

        const query = search ? new RegExp(search,"i","g") : null;

        const user = await UserModel.find({
            "$or" : [
              query ? {name : query} : {},
              query ? {email : query} : {}
            ],
            _id : { $ne : excludeUserId }
        }).select("-password")

        return response.json({
            message : "all user",
            data : user,
            success : true
        })
        
    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true
        })
    }
}

module.exports = searchUser