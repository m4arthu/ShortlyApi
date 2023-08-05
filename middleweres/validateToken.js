import { db } from "../database/database.connection.js";

export const  tokenValidate =  async (req,res,next) =>{
    let  token = req.headers.authorization
     const authorization = token.slice(7)
    const tokenExist = await db.query("SELECT * FROM sessions WHERE token = $1",[authorization])
    if(tokenExist.rowCount > 0){
        next()
    } else {
        res.sendStatus(401) 
    }
}