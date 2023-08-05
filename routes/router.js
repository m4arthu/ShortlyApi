import  express from "express"
import { validateSchema } from "../middleweres/validateSchema.js"
import { loginSchema, registerSchema, shortUrlSchema } from "../schemas/schemas.js"
import { loginUser, registerUser, shortUrl,getUrl,openUrl,deleteUrl} from "../controlers/controllers.js"
import { tokenValidate } from "../middleweres/validateToken.js"
const app = express()
app.post("/signup",validateSchema(registerSchema),registerUser)
app.post("/signin",validateSchema(loginSchema),loginUser)
app.post("/urls/shorten",tokenValidate,validateSchema(shortUrlSchema),shortUrl)
app.get("/urls/:id",getUrl)
app.get("/urls/open/:shortUrl",openUrl)
app.delete("/urls/:id",tokenValidate,deleteUrl)
export const router = app