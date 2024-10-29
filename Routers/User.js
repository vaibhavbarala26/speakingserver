const router = require("express");
const { UserModel, HistoryModel } = require("../Schema/User");
const run = require("../controller/run");
const UserRouter = router();

UserRouter.post("/auth", async (req, res) => {
  const { name, email } = req.body;

  // Check if user already exists
  const found = await UserModel.findOne({ email });
  if (found) {
    // Set a cookie for existing users to indicate they are logged in, with user data
  
    return res.status(200).json("User successfully logged in");
  }

  // Create a new user if not found
  const createduser = await UserModel.create({ name, email });
  const Prompt_Used = process.env.GEMINI_NOT_FIRST_TIME_PROMPT
                .replace("Language", "english")
                .replace("Domain", "personal development")
                .replace("Level", "beginner")
            console.log( Prompt_Used);
            const FonundHistory = new HistoryModel({
              user:{name , email},
              history:[]
            })
            const response = await run(Prompt_Used , FonundHistory)
            FonundHistory.history.push({ role: "user", parts: [{ texts: Prompt_Used }] });
            FonundHistory.history.push({ role: "model", parts: [{ texts: response }] });
            await FonundHistory.save()
  // Set a cookie for new users with user data and 10-year expiration
  res.cookie("savedUser", { name: createduser.name, email: createduser.email }, { 
    maxAge: 315360000000, // 10 years
    httpOnly: true 
  });

  return res.status(200).json("User successfully registered");
});

module.exports = UserRouter;
