import { db } from "../database/database.connection.js"
import bcrypt from "bcrypt"
import { v4 as uuid } from "uuid"
import { nanoid } from  "nanoid"
export const registerUser = async (req, res) => {
    const { name, email, password, confirmPassword } = req.body
    if (password !== confirmPassword) {
        res.status(422).send("senha e confirmar senha precisam ser iguais")
        return
    }
    try {
        const nameExist = await db.query(`SELECT * FROM users WHERE email = $1`, [email])
        if (nameExist.rowCount > 0) {
            res.sendStatus(409)
            return
        }
        let encrypTedPassword = await bcrypt.hash(password, 10)
        await db.query(`INSERT INTO  users(name,email,password)
     VALUES ($1,$2,$3) `, [name, email, encrypTedPassword])
        res.sendStatus(201)
    } catch (e) {
        console.log(e)
        res.status(500).send(e)
    }
}

export const loginUser = async (req, res) => {
    const { email, password } = req.body
    try {
        const user = await db.query("SELECT * FROM users WHERE email = $1", [email])
        if (user.rowCount === 0) {
            res.sendStatus(401)
            return
        }
        if(!await bcrypt.compare(password, user.rows[0].password)){ 
            res.sendStatus(401)
            return
        }
        const userId = user.rows[0].id
        const session = await db.query(`SELECT * from sessions WHERE "userId" = $1`,[userId])
        if(session.rowCount === 0){
            let token = uuid(user.rows[0].id)
            await db.query(`INSERT INTO sessions(token,"userId")
            VALUES ($1,$2)`, [token, userId ])
            res.send(token)
            return
        }
        res.send(session.rows[0].token)
    } catch (e) {
        console.log(e)
        res.status(500).send(e)
    }
}

export const shortUrl = async (req,res) => {
    const {url} = req.body
    const nanoId = nanoid(8)
    const {authorization} = req.headers
    const user  = await db.query("SELECT * FROM sessions WHERE token = $1",[authorization])
    try {
     await db.query(`INSERT INTO "shortUrls"("shortUrl",url,"visitCount","userId") VALUES ($1,$2,$3,$4)`,[nanoId,url,1,user.rows[0].userId])
     const urlId = await db.query(`SELECT * FROM "shortUrls" WHERE url = $1`,[url])
     res.send({
        id: urlId.rows[0].id,
        shortUrl:urlId.rows[0].shortUrl
     })
    } catch (e){
        console.log(e)
        res.status(500).send("pau no  server")
    }

}

export  const  getUrl = async (req,res) =>{
    const id = req.params.id
    if(!id){
        res.sendStatus(404)
        return
    }
    try {
        const shortUrlObjt = await db.query(`SELECT * FROM  "shortUrls" WHERE id = $1`,[id])
        const response = shortUrlObjt.rows[0]
        delete response.visitCount
        delete response.userId
        res.send(response)

    } catch (e){
        res.status(500).send("pau no  server")
    }
}

export const openUrl = async (req,res) => {
    const  {shortUrl} = req.params
    try {
    const url = await db.query(`SELECT * FROM "shortUrls" WHERE "shortUrl" = $1 `,[shortUrl])
    const newUrl = url.rows[0]
    if(url.rowCount ===  0 ){
        res.sendStatus(404)
        return
    }
    newUrl.rows[0].visitCount++
    await db.query(`UPDATE "shortUrls" SET "visitCount" = $1`,[newUrl.rows[0].visitCount])
    res.redirect(url.rows[0].url)
    } catch (e){
        console.log(e)
        res.status(500).send("deu pau no  server")
    }
}

export const deleteUrl = async (req,res) =>{
    const  {id} = req.params
    const {authorization} = req.headers
    try {
        const user = await db.query("SELECT * FROM sessions WHERE token = $1",[authorization])
        const shortUrl = await db.query(`SELECT * FROM "shortUrls" WHERE id = $1 `,[id])
        if(shortUrl.rowCount === 0 ){
            res.sendStatus(404)
            return
        }
        if(shortUrl.rows[0].userId !== user.rows[0].userId){
            res.sendStatus(401)
            return
        }
        await db.query(`DELETE FROM "shortUrls" WHERE id = $1`,[id]) 
        res.sendStatus(204)
        
    }  catch (e) {
        console.log(e)
        res.status(500).send(e)
    }
}


