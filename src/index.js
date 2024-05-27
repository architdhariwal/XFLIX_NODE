const mongoose = require("mongoose");
const app = require("./app");
const config = require("./config/config");
const PORT = config.port;

const connectToMongoDB = async () => {
  try {
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
  }
};

app.listen(PORT, () => {
  console.log(`Server listening at port ${PORT}`);
});

connectToMongoDB();


