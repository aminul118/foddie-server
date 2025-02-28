const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://foddie-resturant.netlify.app",
      "https://foddie-32758.web.app",
    ],
    credentials: true,
  })
);
// Middleware
app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  console.log("Token is inside the verify token", token);
  // If token is not here we don't give the data to user
  if (!token) {
    return res.status(401).send({ message: "Unauthorized Access 1" });
  }
  // Verify The token
  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      res.status(401).send({ message: "Unauthorized Access 2" });
    }
    req.user = decoded;

    next();
  });
};

/**
 * ------------------------------------------------------
 *  JWT
 * ------------------------------------------------------
 */

app.post("/jwt", async (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.SECRET_KEY, { expiresIn: "5h" });
  res
    .cookie("token", token, {
      httpOnly: true,
      maxAge: 3600 * 1000,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    })
    .send({ success: true });
});

app.post("/logout", (req, res) => {
  res
    .clearCookie("token", {
      httpOnly: true,
      maxAge: 0,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    })
    .send({ success: true });
});

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
    // await client.connect();

    /**
     * ------------------------------------------------------
     * !     DB collections
     * ------------------------------------------------------
     */
    const db = client.db("FoddieDB");
    const usersCollections = db.collection("users");
    const foodCollections = db.collection("foods");
    const orderCollections = db.collection("orders");

    /**
     * ------------------------------------------------------
     * !     Users collections
     * ------------------------------------------------------
     */
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
    app.get("/users", verifyToken, async (req, res) => {
      const { email } = req.query;
      const query = { email };
      const users = await usersCollections.findOne(query);
      res.status(200).send(users); // 200 OK
    });

    /**
     * ------------------------------------------------------
     *  !    Foods collections
     * ------------------------------------------------------
     */

    app.post("/add-food", verifyToken, async (req, res) => {
      const newFood = req.body;
      const result = await foodCollections.insertOne(newFood);
      res.status(201).send(result);
    });

    app.get("/foods", verifyToken, async (req, res) => {
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
        // console.error("Error fetching foods:", error);
        res.status(500).send({ error: "Failed to fetch foods" });
      }
    });

    app.get("/topSelling", async (req, res) => {
      try {
        const result = await foodCollections
          .aggregate([
            { $sort: { purchased_count: -1 } }, // Sort by purchased_count in descending order
            { $limit: 6 }, // Optional: Limit to top 10 results
          ])
          .toArray(); // Convert cursor to array

        res.send(result); // Send the sorted result
      } catch (error) {
        console.error("Error fetching top-selling items:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    app.get("/all-foods", async (req, res) => {
      const { search, sort, selectedPage, foodPerPage } = req.query;
      const page = parseInt(foodPerPage);
      const selected = parseInt(selectedPage);
      const skip = (selected - 1) * page;

      const sortOrder = sort === "asc" ? 1 : -1;

      const matchStage = {
        $match: {
          $or: [
            { food_name: { $regex: search, $options: "i" } },
            { food_category: { $regex: search, $options: "i" } },
            { ingredients: { $regex: search, $options: "i" } },
          ],
        },
      };

      const totalFood = await foodCollections.countDocuments(matchStage.$match);

      const aggregate = [
        matchStage,
        { $sort: { price: sortOrder } },
        { $skip: skip },
        { $limit: page },
      ];

      const foods = await foodCollections.aggregate(aggregate).toArray();
      res.send({ totalFood, foods });
    });

    app.get("/food/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollections.findOne(query);
      res.status(200).send(result);
    });

    app.put("/foods/:id", async (req, res) => {
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

    app.delete("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollections.deleteOne(query);
      res.send(result);
    });

    /**
     * ------------------------------------------------------
     *  !    Food Orders
     * ------------------------------------------------------
     */

    app.post("/order", async (req, res) => {
      const newOrder = req.body;
      const sellerEmail = newOrder.addedBy.email;
      const buyerEmail = newOrder.buyerEmail;
      const orderQuentity = newOrder.orderQuantity;

      if (buyerEmail === sellerEmail) {
        return res
          .status(400)
          .send("You are the seller. You can not oder this food ");
      }
      const id = newOrder.food_id;
      const filter = { _id: new ObjectId(id) };
      const update = {
        $inc: {
          quantity: -orderQuentity,
          purchased_count: 1,
        },
      };
      const updateQuantity = await foodCollections.updateOne(filter, update);

      const result = await orderCollections.insertOne(newOrder);
      res.status(201).send(result);
    });

    app.get("/orders", verifyToken, async (req, res) => {
      const result = await orderCollections.find().toArray();
      res.status(201).send(result);
    });
    app.get("/order/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await orderCollections.findOne(query);
      res.send(result);
    });

    app.get("/my-orders", verifyToken, async (req, res) => {
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

    app.delete("/order/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const foodDetails = await orderCollections.findOne(query);
      const orderQuantity = foodDetails.orderQuantity;
      const foodId = foodDetails.food_id;
      const findFood = { _id: new ObjectId(foodId) };
      const updateInfo = {
        $inc: {
          quantity: +orderQuantity,
          purchased_count: -1,
        },
      };
      const update = await foodCollections.updateOne(findFood, updateInfo);
      // console.log("Food info", foodId);

      const result = await orderCollections.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } catch (error) {
    console.error("Error during operation:", error);
  }
}

run().catch(console.dir);

app.listen(port, () => console.log("Server is running on port", port));
