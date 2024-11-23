const { ConversationModel } = require("../models/ConversationModel");

const getConversation = async(currentUserId) =>{
    if (currentUserId) {
        const currentUserConversation = await ConversationModel.find({
            "$or": [
                { sender: currentUserId },
                { receiver: currentUserId }
            ]
        }).sort({ updatedAt: -1 }).populate('messages').populate('sender').populate('receiver')

        // console.log("currentUserConversation", currentUserConversation);


        const conversation = currentUserConversation.map((conv) => {

            // console.log("conv", conv);

            const countUnseenMsg = conv.messages.reduce((prev, curr) => {
                if(curr?.msgByUserId?.toString() !== currentUserId){
                    return prev + (curr.seen ? 0 : 1)
                }else{
                    prev
                }
            }, 0)

            return {
                _id: conv?._id,
                sender: conv?.sender,
                receiver: conv?.receiver,
                unseenMsg: countUnseenMsg,
                lastMsg: conv?.messages[conv?.messages?.length - 1]
            }
        })

        return conversation

        

    }else{
        return []
    }
}

module.exports = getConversation