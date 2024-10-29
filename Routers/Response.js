const express = require("express");
const { UserModel, HistoryModel, ResultModel } = require("../Schema/User");
const run = require("../controller/run");
const ResponseRouter = express.Router();

ResponseRouter.post("/chat", async (req, res) => {
    try {
        const { level, domain, name, email, language , timer, pertopictime } = req.body;
        let Prompt_Used = "";

        // Check if user is returning based on cookie
        if (req.cookies.savedUser) {
            Prompt_Used = process.env.GEMINI_NOT_FIRST_TIME_PROMPT
                .replace("Language", language)
                .replace("Domain", domain)
                .replace("Level", level)
                .replace("count" , String(Number(timer/pertopictime)));
            console.log("Returning user prompt:", Prompt_Used);
        } else {
            // If not found in cookies, check in database
            const foundUser = await UserModel.findOne({ email });
            if (!foundUser) {
                // New user registration
                await UserModel.create({ name, email });
                console.log("New user registered and cookie set.");
                res.cookie("savedUser", { name: name, email: email }, {
                    maxAge: 315360000000, // 10 years
                    httpOnly: true
                });

                Prompt_Used = process.env.GEMINI_FIRST_TIME_PROMPT
                    .replace("Language", language)
                    .replace("Domain", domain)
                    .replace("Level", level)
                    .replace("count" , String(Number(timer/pertopictime)))
                console.log("First-time user prompt:", Prompt_Used);
            } else {
                // If user exists in the database but cookie isn't set
                res.cookie("savedUser", { name: name, email: email }, {
                    maxAge: 315360000000, // 10 years
                    httpOnly: true
                });
                Prompt_Used = process.env.GEMINI_NOT_FIRST_TIME_PROMPT
                    .replace("Language", language)
                    .replace("Domain", domain)
                    .replace("Level", level)
                    .replace("count" , String(Number(timer/pertopictime)))
                console.log("User exists in database but no cookie set, prompt:", Prompt_Used);
            }
        }

        let FonundHistory = await HistoryModel.findOne({ "user.email": email });
        if (!FonundHistory) {
            FonundHistory = new HistoryModel({
                user: { name, email },
                history: [],
            });
            FonundHistory.history.push({ role: "user", parts: [{ texts: Prompt_Used }] });
            const response = await run(Prompt_Used, []);
            FonundHistory.history.push({ role: "model", parts: [{ texts: response }] });
            await FonundHistory.save();
            const newresponse = (JSON.parse(response));
            
            return res.status(200).json({ message: newresponse });
        } else {
            const filteredArray = FonundHistory.history.map((fou) => {
                return { role: fou.role, parts: fou.parts.map((part) => ({ text: part.texts })) };
            });
            console.log(filteredArray);

            const response = await run(Prompt_Used, filteredArray);
            const newresponse = (JSON.parse(response));
            
            FonundHistory.history.push({ role: "user", parts: [{ texts: Prompt_Used }] });
            FonundHistory.history.push({ role: "model", parts: [{ texts: response }] });
            await FonundHistory.save()
            res.status(200).json({ message: newresponse});
        }
    } catch (error) {
        console.error("Error in /chat route:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
});
ResponseRouter.post("/user-chat", async (req, res) => {
    try {
        const { userinput, topic, name, email } = req.body;
        console.log(userinput,topic , name , email);
        
        const FonundHistory = await HistoryModel.findOne({ "user.email": email });
        console.log(FonundHistory);
        
        const filteredArray = FonundHistory.history.map((fou) => {
            return { role: fou.role, parts: fou.parts.map((part) => ({ text: part.texts })) };
        });
        let Prompt_Used = process.env.USER_RESPONSE_PROMPT.replace("Topic" , topic).replace("input" , userinput)
        const response = await run(Prompt_Used, filteredArray);
        const newresponse = (JSON.parse(response));
            
        FonundHistory.history.push({ role: "user", parts: [{ texts: Prompt_Used }] });
        FonundHistory.history.push({ role: "model", parts: [{ texts: response }] });
        await FonundHistory.save()
        let FoundResult = await ResultModel.findOne({"user.email":email})
        if(!FoundResult){
            FoundResult = new ResultModel({
                user:{name , email},
                result:[]
            })
        }
        FoundResult.result.push({role:"user" , parts:{texts:userinput}})
        FoundResult.result.push({role:"model" , parts:{texts:response}})
        await FoundResult.save()
        res.status(200).json({ message: newresponse  });
    } catch (error) {
        console.error("Error in /user-chat route:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
});
ResponseRouter.get("/streak" , async(req ,  res)=>{
    const {email} = req.query
    const FonundHistory = await HistoryModel.findOne({"user.email":email})
    let isStreak = 0
    if(!FonundHistory){
        return res.status(200).json("no streak")
    }

    const dates = FonundHistory.history.map((h)=>new Date(h.date))
    dates.sort((a, b)=> b-a);
    const today = new Date();
    const oneDay = 24*60*60*1000;
    for(let i = 0 ; i<dates.length ; i++){
        const diff = Math.round((today-dates[i])/oneDay)
        if(diff === isStreak){
            isStreak++;
        }
        else{
            break;
        }
    }
    if(isStreak>0){
        return res.status(200).json({isStreak})
    }
    else{
        return res.status(200).json(0)
    }
})
ResponseRouter.get("/user-response" , async(req , res)=>{
    const {name, email} = req.query
    const FoundResult = await ResultModel.findOne({"user.email":email})
    if(!FoundResult){
        return res.status(200).json("no results are found")
    }
    return res.status(200).json(FoundResult)
})
module.exports = ResponseRouter;
