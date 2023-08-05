import { db } from "../database/database.connection.js";

export const  tokenValidate =  async (req,res,next) =>{
    const  token = req.headers.authorization
    const tokenExist = await db.query("SELECT * FROM sessions WHERE token = $1",[token])
    if(tokenExist.rowCount > 0){
        next()
    } else {
        res.sendStatus(401)
    }
}