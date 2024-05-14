const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

//middleware
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://volunteer-link-f176e.web.app",
  ],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// verify jwt middleware
const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).send({ message: "unauthorized access" });
  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        console.log(err);
        return res.status(401).send({ message: "unauthorized access" });
      }
      console.log(decoded);

      req.user = decoded;
      next();
    });
  }
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dizfzlf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Connect the client to the server	(optional starting in v4.7)
    //await client.connect();

    const volunteerCollection = client
      .db("volunteerDB")
      .collection("volunteer");
    const userCollection = client.db("volunteerDB").collection("user");
    const volunteerRequestCollection = client
      .db("volunteerDB")
      .collection("volunteerRequest");

    //jwt generate
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "365d",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // Clear token on logout


    app.post("/logout", async (req, res) => {
      
      res
        .clearCookie("token", {
          //httpOnly: true,
          secure: true,
          sameSite:"none",
          maxAge : 0,
        })
        .send({ success: true });
    });
    /*
    app.get("/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          maxAge: 0,
        })
        .send({ success: true });
    });
    */

    //volunteer related apis
    app.delete("/volunteer/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await volunteerCollection.deleteOne(query);
      res.send(result);
    });

    //for update single post
    app.get("/volunteer/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await volunteerCollection.findOne(query);
      res.send(result);
    });

    app.put("/volunteer/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedPostItem = req.body;
      const postItem = {
        $set: {
          ...updatedPostItem,
        },
      };
      const result = await volunteerCollection.updateOne(
        filter,
        postItem,
        options
      );
      res.send(result);
    });

    app.get("/volunteers", async (req, res) => {
      const sort = req.query.sort;
      const result = await volunteerCollection
        .find()
        .sort({ deadline: 1 })
        .toArray();
      res.send(result);
    });

    app.get("/volunteer", async (req, res) => {
      const sort = req.query.sort;
      const search = req.query.search;
      const filter = req.query.filter;
      if (filter) query.category = filter;
      let options = {};
      let query = {
        post_title: { $regex: search, $options: "i" },
      };
      const volunteers = await volunteerCollection
        .find(query, options)
        .sort({ deadline: 1 })
        .toArray();
      //const cursor = volunteerCollection.find();
      //const result = await cursor.toArray();
      res.send(volunteers);
    });

    app.get("/volunteer/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const volunteer = await volunteerCollection.findOne(query);
      res.send(volunteer);
    });

    // for count update
    app.patch("/requestUpdate/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const requestUpdate = req.body;
      const updateOperation = {
        $inc: {
          volunteers_needed: -1,
        },
      };
      const result = await volunteerCollection.updateOne(
        filter,
        updateOperation
      );
      res.json(result);
    });

    // for be volunteer page
    app.get("/volunteer/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await volunteerCollection.findOne(query);
      res.send(result);
    });

    app.post("/beVolunteer", async (req, res) => {
      const newBeVolunteer = req.body;
      console.log(newBeVolunteer);
      const result = await volunteerRequestCollection.insertOne(newBeVolunteer);
      res.send(result);
    });

    app.get("/beVolunteer/:email", verifyToken, async (req, res) => {
      const tokenEmail = req.user.email;
      const email = req.params.email;
      if (tokenEmail !== email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      console.log(tokenEmail);
      const result = await volunteerRequestCollection
        .find({ userEmail: req.params.email })
        .toArray();
      res.send(result);
    });

    app.delete("/beVolunteer/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await volunteerRequestCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/volunteer", async (req, res) => {
      const newPostItem = req.body;
      console.log(newPostItem);
      const result = await volunteerCollection.insertOne(newPostItem);
      res.send(result);
    });
    // my post apis
    app.get("/myPost/:email", verifyToken,  async (req, res) => {
      const tokenEmail = req.user.email;
      const email = req.params.email;
      if (tokenEmail !== email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      console.log(tokenEmail);
      const result = await volunteerCollection
        .find({ 
          organizer_email: req.params.email })
        .toArray();
      res.send(result);
    });

    //user related apis

    app.get("/user", async (req, res) => {
      const cursor = userCollection.find();
      const user = await cursor.toArray();
      res.send(user);
    });

   

    // Send a ping to confirm a successful connection
    //await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("volunteer server is running....");
});

app.listen(port, () => {
  console.log(`volunteer server is running on port: ${port}`);
});
