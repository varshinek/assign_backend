const express = require("express");
const Student = require("../Models/student");
const Mentor = require("../Models/mentor");

const router = express.Router();

//CREATE NEW STUDENT
router.post("/add", async (req, res) => {
  try {
    const studentdata = req.body;
    const studentName = studentdata.studentName;
    const findStudent = await Student.findOne({ studentName });

    if (!findStudent) {
      const student = new Student(req.body);
      await student.save();
      res.status(200).send(student);
    } else {
      return res
        .status(400)
        .json({ message: "StudentName is already exisits" });
    }
  } catch (err) {
    res.status(400).json({ message: "Error while adding student", error: err });
  }
});

//GET ALL STUDENTS DETAILS
router.get("/show", async (req, res) => {
  try {
    const allstudents = await Student.aggregate([
      {
        $lookup:{
          from: "mentors",
          localField: "currentMentor",
          foreignField: "_id",
          as: "currentMentorName"
        }
      },
      {
        $unwind:{
          path: "$currentMentorName",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup:{
          from: "mentors",
          localField: "previousMentors",
          foreignField: "_id",
          as: "previousMentorsNames"
        }
      },
      {
        $unwind:{
          path: "$previousMentorsNames",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project:{
          _id:1,
          studentName:1,
          currentMentorID:"$currentMentorName._id",
          currentMentorName:"$currentMentorName.mentorName",
          previousMentorsName:"$previousMentorsNames.mentorName",
          previousMentorsID:"$previousMentorsNames._id"
        }
      },
      {
        $group:{
          _id: "$_id",
          studentName:{$addToSet:"$studentName"},
          currentMentorName:{$addToSet:"$currentMentorName"},
          currentMentorID:{$addToSet:"$currentMentorID"},
          previousMentorsName:{$addToSet:"$previousMentorsName"},
          previousMentorsID:{$addToSet:"$previousMentorsID"}
        }
      }
    ]);

    res.status(200).json({
      "Total_Students": allstudents.length,
      allstudents,
    });
  } catch (err) {
    res.status(400).send(err);
  }
});

//SHOW THE PARTICULAR STUDNET PREVIOUS MENTORS
router.get("/show/:studentID", async (req, res) => {
  try {
    const _id = req.params.studentID;
    const newStudent = await Student.findOne({ _id });
    const StudentData = await Student.aggregate([
      {
        $match:{
          _id:newStudent._id
        }
      },
      {
        $lookup:{
          from: "mentors",
          localField: "currentMentor",
          foreignField: "_id",
          as: "currentMentorName"
        }
      },
      {
        $unwind:{
          path: "$currentMentorName",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup:{
          from: "mentors",
          localField: "previousMentors",
          foreignField: "_id",
          as: "previousMentorsNames"
        }
      },
      {
        $unwind:{
          path: "$previousMentorsNames",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project:{
          _id:1,
          studentName:1,
          currentMentorName:"$currentMentorName.mentorName",
          currentMentorID:"$currentMentorName._id",
          previousMentors:"$previousMentorsNames.mentorName"
        }
      },
      {
        $group:{
          _id: "$studentName",
          currentMentorName:{$addToSet:"$currentMentorName"},
          currentMentorID:{$addToSet:"$currentMentorID"},
          previousMentors:{$addToSet:"$previousMentors"}
        }
      }
    ]);

    res.status(200).json({StudentData:StudentData[0]});
  } catch (err) {
    res.status(400).json({ message: `Error \b ${err}` });
  }
});

//UPDATE SPECIFIC STUDENT TO ASSIGN A MENTOR
router.put("/update/:studentID", async (req, res) => {
  try {
    const _id = req.params.studentID;
    const { studentName, currentMentor } = req.body;
    const newStudent = await Student.findOne({ _id });
    const newMentor = await Mentor.findOne({ _id: currentMentor });
    const allMentor = await Mentor.find();

    if (!currentMentor || currentMentor == newStudent.currentMentor) {
      await Student.updateOne({ _id }, { studentName });
    } else {
      allMentor.forEach(async (ele) => {
        if (ele._id.toString() != currentMentor) {
          const checkStudent = ele.assignedStudents;
          const arrStringStudentID = checkStudent.map((ele) => ele.toString());
          const arr_result = arrStringStudentID.filter((value) => value != _id);
          await Mentor.updateOne(
            { _id: ele._id },
            { assignedStudents: arr_result }
          );
        }
      });

      const mentorAssignedStudents = newMentor.assignedStudents;
      const checkForMentorAssign = mentorAssignedStudents.map((ele) =>
        ele.toString()
      );

      const result = checkForMentorAssign.filter((ele) => ele == _id);
      if (result.length == 0) {
        mentorAssignedStudents.push(_id);
        await Mentor.updateOne(
          { _id: currentMentor },
          { assignedStudents: mentorAssignedStudents }
        );
      }

      if (!newStudent.currentMentor) {
        await Student.updateOne({ _id }, { studentName, currentMentor });
      } else if (newStudent.currentMentor.toString() != currentMentor) {
        const prevMentor = newStudent.currentMentor;
        const prevMentorArray = newStudent.previousMentors;
        if (prevMentorArray.length == 0) {
          prevMentorArray.push(prevMentor);
          await Student.updateOne(
            { _id },
            { studentName, currentMentor, previousMentors: prevMentorArray }
          );
        } else {
          const checkArray = prevMentorArray.map((ele) => ele.toString());
          let check = checkArray.filter((ele) => ele == prevMentor.toString());
          if (check.length == 0) {
            prevMentorArray.push(prevMentor);
            await Student.updateOne(
              { _id },
              { studentName, currentMentor, previousMentors: prevMentorArray }
            );
          } else {
            await Student.updateOne({ _id }, { studentName, currentMentor });
          }
        }
      } else {
        return res
          .status(400)
          .json({ message: "Student Already Assigned to this mentor" });
      }
    }
    res.status(200).json({ message: "Successfull" });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error while updating student data", error: err });
  }
});

//DELETE SPECIFIC STUDENT
// router.delete("/delete/:studentID", async (req, res) => {
//   try {
//     const _id = req.params.studentID;
//     const newStudent = await Student.findOne({ _id });
//     await Student.deleteOne({ _id });
//     res
//       .status(200)
//       .send(`Deleted ${newStudent.studentName} student data Successfully`);
//   } catch {
//     res.status(400), send(err);
//   }
// });

module.exports = router;
