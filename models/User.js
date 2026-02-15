const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const UserSchema = new mongoose.Schema ({
  name: {
    type: String,
    required: [true, "Please provide a name"],
    minLength: 3,
    maxLength: 50,
  },
  email: {
    type: String,
    required: [true, "Please provide an email"],
    match: [/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, "Please provide valid email",],
    unique: true, // create a unique id
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minLength: 6,
  },
})

// Mongoose middleware that runs before a document is saved in MongoDB
UserSchema.pre ('save', async function () {
// Hashing password is added to the model
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

// JWT creation on the model
UserSchema.methods.createJWT = function () {
  return jwt.sign(
    {userId: this._id, name: this.name}, 
    process.env.JWT_SECRET, 
    {expiresIn: process.env.JWT_LIFETIME}
  )}

// Password comparison via bcrypt (check if plain password matches hashed password)
UserSchema.methods.comparePassword = async function(candidatePassword){
  const isMatch = await bcrypt.compare(candidatePassword, this.password)
  return isMatch
}


module.exports = mongoose.model('User', UserSchema)
