const mongoose = require("mongoose");

const mentorSchema = new mongoose.Schema({
    mentorName:{
        type:String,
        required:true
    },
    assignedStudents : [
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Student"
        }
    ]
});

const Mentor = mongoose.model("Mentor",mentorSchema);
module.exports = Mentor;