const express = require("express")
const { Server } = require("socket.io")
const http = require("http")
const getUserDetailFromToken = require("../helpers/getUserDetailFromToken")
const UserModel = require("../models/UserModel")
const { ConversationModel, MessageModel } = require('../models/ConversationModel')
const getConversation = require('../helpers/getConversation')

const app = express()

/**socket connection */

const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        // origin: process.env.FRONTEND_URL,
        origin: "wss://mern-chat-app-frontend-ecoe.onrender.com",
        methods: ['GET', 'POST'],
        credentials: true,
    },
    transports: ['websocket', 'polling'],
})


//online user
const onlineUser = new Set()

io.on('connection', async (socket) => {
    console.log('connected user', socket.id);

    const token = socket.handshake.auth.token

    //current user details
    const user = await getUserDetailFromToken(token)

    if(!user){
        console.log("invalid token, disconnecting socket:", socket.id);
        return socket.disconnect()
    }

    //create a room for the specific user to know if the users are online or not
    socket.join(user?._id?.toString())
    onlineUser.add(user?._id?.toString())

    //pass the online users to the client side
    io.emit('onlineUser', Array.from(onlineUser))

    socket.on('message-page', async (userId) => {
        // console.log('userId', userId);
        const userDetails = await UserModel.findById(userId).select("-password")

        const payload = {
            _id: userDetails?._id,
            name: userDetails?.name,
            email: userDetails?.email,
            profile_pic: userDetails?.profile_pic,
            online: onlineUser.has(userId)
        }

        socket.emit('message-user', payload)

        const getConversationMessage = await ConversationModel.findOne({
            "$or": [
                {
                    sender: user?._id,
                    receiver: userId
                },
                {
                    sender: userId,
                    receiver: user?._id
                }
            ]
        }).populate('messages').sort({ updatedAt: -1 })
        // console.log("getConversationMessage",getConversationMessage);


        // get previous message
        socket.emit('message', getConversationMessage?.messages || [])
    })



    //new message
    socket.on('new message', async (data) => {

        //check conversation is available for both user

        let checkConversation = await ConversationModel.findOne({
            "$or": [
                {
                    sender: data?.sender,
                    receiver: data?.receiver
                },
                {
                    sender: data?.receiver,
                    receiver: data?.sender
                }
            ]
        })

        // console.log('checkConversation', checkConversation);

        // if conversation is not available
        if (!checkConversation) {
            const createConversation = await ConversationModel({
                sender: data?.sender,
                receiver: data?.receiver
            })
            checkConversation = await createConversation.save()
        }

        const message = new MessageModel({

            text: data.text,
            imageUrl: data.imageUrl,
            videoUrl: data.videoUrl,
            msgByUserId: data?.msgByUserId

        })
        const saveMessage = await message.save()

        // console.log('new message', data);
        // console.log('checkConversation.....', checkConversation);

        const updateConversation = await ConversationModel.updateOne({ _id: checkConversation?._id }, {
            "$push": { messages: saveMessage?._id }
        })


        const getConversationMessage = await ConversationModel.findOne({
            "$or": [
                {
                    sender: data?.sender,
                    receiver: data?.receiver
                },
                {
                    sender: data?.receiver,
                    receiver: data?.sender
                }
            ]
        }).populate('messages').sort({ updatedAt: -1 })
        // console.log("getConversationMessage",getConversationMessage);

        io.to(data?.sender).emit('message', getConversationMessage?.messages || [])
        io.to(data?.receiver).emit('message', getConversationMessage?.messages || [])

        //send conversation
        const conversationSender = await getConversation(data?.sender)
        const conversationReceiver = await getConversation(data?.receiver)

        io.to(data?.sender).emit('conversation', conversationSender)
        io.to(data?.receiver).emit('conversation', conversationReceiver)


    })

    //sidebar
    socket.on('sidebar', async (currentUserId) => {
        console.log('current user', currentUserId);

        const conversation = await getConversation(currentUserId)

        socket.emit('conversation', conversation)

    })

    socket.on('seen', async (msgByUserId) => {

        let conversation = await ConversationModel.findOne({
            "$or": [
                {
                    sender: user?._id,
                    receiver: msgByUserId
                },
                {
                    sender: msgByUserId,
                    receiver: user?._id
                }
            ]
        })

        const conversationMessageId = conversation?.messages || []

        const updateMessages = await MessageModel.updateMany(
            {
                _id: { "$in": conversationMessageId },
                msgByUserId: msgByUserId
            },
            {
                "$set" : { seen : true }
            }
        )

        //send conversation
        const conversationSender = await getConversation(user?._id.toString())
        const conversationReceiver = await getConversation(msgByUserId)

        io.to(user?._id.toString()).emit('conversation', conversationSender)
        io.to(msgByUserId).emit('conversation', conversationReceiver)
    })
    
    
    // disconnect
    socket.on('disconnect', () => {
        onlineUser.delete(user?._id?.toString())
        console.log('disconnected user', socket.id);
        io.emit('onlineUser',Array.from(onlineUser))
    })
    
    socket.on('user-offline',userId =>{
        onlineUser.delete(userId)
        io.emit('online-users-updated',Array.from(onlineUser))
    })
})

module.exports = {
    app,
    server
}