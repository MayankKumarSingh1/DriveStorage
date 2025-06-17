const mongoose  = require('mongoose')


const fileSchema = new mongoose.Schema({
    path:{
        type:String,
        required:[true, 'Path is required']
    },
    originalname: {
        type:String,
        required: [true, 'Original Name is required']
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:[true, 'User is required']
    }
})

const File = mongoose.model('File', fileSchema)

module.exports = File