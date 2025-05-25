const mongoose = require('mongoose');
const {DB_NAME} = require('../constants');

const connectDB = async () => {
    try {
        const connenctionInstance = await mongoose.connect(`${process.env.MOONGODB_URI}/${DB_NAME}`)

        console.log(`\n Mongo DB connected !! DB Host: ${connenctionInstance.connection.host}`);
        
    } catch (error) {
        console.log("MONGODB Connenction Failed..!",error);
        process.exit(1)
    }
}

module.exports = connectDB