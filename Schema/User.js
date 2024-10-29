const mongoose = require("mongoose");

// Define User Schema
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,  // You might want to add validation
    },
    email: {
        type: String,
        required: true,
    }
});
//
// Define Parts Schema
const PartsSchema = new mongoose.Schema({
    texts: {
        type: String,
        required: true,
    }
});
const RoleSchema = new mongoose.Schema({
    role:{
        type:String,
    },
    parts: [PartsSchema],
    date:{
        type:Date,
        default:Date.now
    }
});
const HistorySchema = new mongoose.Schema({
    user: {
        type: UserSchema,  // Embedding UserSchema
        required: true,
    },
    
    history: [RoleSchema]  // Array of Roles
});
const ResultSchema = new mongoose.Schema({
    user: {
        type: UserSchema,  // Embedding UserSchema
        required: true,
    },
    
    result: [RoleSchema]
})
// Create the User Model
const UserModel = mongoose.model("Speaking-User", UserSchema);

// Create the History Model
const HistoryModel = mongoose.model("Speaking-History", HistorySchema);
const ResultModel = mongoose.model("Speaking-Result" , ResultSchema)
module.exports = {
    UserModel,
    ResultModel,
    HistoryModel
};
