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
    const orderCollections = client.db("FoddieDB").collection("orders");

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
      try {
        const email = req.query.email;

        if (!email) {
          return res
            .status(400)
            .send({ error: "Email query parameter is required." });
        }

        const filter = { "addedBy.email": email }; // Use dot notation for nested queries
        const result = await foodCollections.find(filter).toArray();

        res.status(200).send(result);
      } catch (error) {
        console.error("Error fetching foods:", error);
        res.status(500).send({ error: "Failed to fetch foods" });
      }
    });
    app.get("/all-foods", async (req, res) => {
      const result = await foodCollections.find().toArray();
      res.send(result);
    });

    app.put("/food/:id", async (req, res) => {
      const id = req.params.id;
      const food = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateFood = {
        $set: {
          food_name: food.food_name,
          food_image: food.food_image,
          food_category: food.food_category,
          quantity: food.quantity,
          price: food.price,
          origin: food.origin,
          ingredients: food.igredients,
        },
      };
      const update = await foodCollections.updateOne(
        query,
        updateFood,
        options
      );
      res.send(update);
    });

    app.get("/food/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollections.findOne(query);
      res.status(200).send(result);
    });

    //! Food Orders
    app.post("/order", async (req, res) => {
      const newOrder = req.body;
      const sellerEmail = newOrder.addedBy.email;
      const buyerEmail = newOrder.buyerEmail;

      if (buyerEmail === sellerEmail) {
        return res
          .status(400)
          .send("You are the seller. You can not oder this food ");
      }

      const result = await orderCollections.insertOne(newOrder);
      res.status(201).send(result);
    });

    app.get("/orders", async (req, res) => {
      const result = await orderCollections.find().toArray();
      res.status(201).send(result);
    });

    app.delete("/order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await orderCollections.deleteOne(query);
      res.send(result);
    });

    app.get("/my-orders", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res.status(400).send("Please login with email..");
      }
      const filter = {
        buyerEmail: email,
      };
      const result = await orderCollections.find(filter).toArray();
      res.send(result);
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
