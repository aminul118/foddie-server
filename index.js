const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running.....");
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.b4uwa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();

    const usersCollections = client.db("FoddieDB").collection("users");
    const foodCollections = client.db("FoddieDB").collection("foods");

    //  Create a new user
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const email = newUser.email;

      // Find user by email
      const find = await usersCollections.findOne({ email });
      if (find) {
        return res.status(409).send("User already exists"); // 409 Conflict
      }
      // console.log("New User Email:", email);
      // Insert the new user into the database
      const result = await usersCollections.insertOne(newUser);
      res.status(201).send(result); // 201 Created
    });

    // GET /users - Get all users
    app.get("/users", async (req, res) => {
      const users = await usersCollections.findOne();
      res.status(200).send(users); // 200 OK
    });

    // Foods collections
    app.post("/add-food", async (req, res) => {
      const newFood = req.body;
      const result = await foodCollections.insertOne(newFood);
      res.status(201).send(result);
    });

    app.get("/foods", async (req, res) => {
      const result = await foodCollections.find().toArray();
      res.status(200).send(result);
    });
    app.get("/food/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollections.findOne(query);
      res.status(200).send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (error) {
    console.error("Error during operation:", error);
  }
}

run().catch(console.dir);

app.listen(port, () => console.log("Server is running on port", port));
