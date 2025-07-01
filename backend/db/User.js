import mongoose from 'mongoose';
const Schema=mongoose.Schema;
const ObjectId=mongoose.ObjectId;

const userSchema = new Schema({
    username:{
        type:String,
        unique:true,
        required:true,
    },
    password:{
        type:String,
        required:true,
    },
    authProvider:{
        type:String,
        enum:['google','github','local'], // Extend as needed
        default:'local',
    },
},{timestamps:true});

const User=mongoose.model('User',userSchema);

export default User;

