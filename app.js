const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require('cookie-parser');
const cors = require("cors")
const connection = require("./connection");
const run = require("./controller/run");
const ResponseRouter = require("./Routers/Response");
const UserRouter = require("./Routers/User");
dotenv.config();
const app = express();
const PORT = process.env.PORT || 1042;
app.use(express.json())
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true,
}))
app.use(cookieParser());
app.use("/" , ResponseRouter)
app.use("/" , UserRouter)
connection()
.then(()=>{
    app.post("/" , async(req , res)=>{
        const {input} = req.body;
        run(input)
    })
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      })
})
