import express, { json } from  "express"
import  cors from  "cors"
import { router } from "./routes/router.js"
import dotenv from  "dotenv"
const app = express()
const port = process.env.PORT | 5000
app.use(cors())
app.use(json())
dotenv.config
app.use(router)

app.listen(port,()=>{
    console.log("Server rodando  da porta 5000")
})