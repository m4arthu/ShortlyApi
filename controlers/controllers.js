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
            res.send({token})
            return
        }
        res.send({token:session.rows[0].token})
    } catch (e) {
        console.log(e)
        res.status(500).send(e)
    }
}

export const shortUrl = async (req,res) => {
    const {url} = req.body
    const nanoId = nanoid(8)
    let token = req.headers.authorization
    const authorization  = token.slice(7)
    const user  = await db.query("SELECT * FROM sessions WHERE token = $1",[authorization])
    try {
     await db.query(`INSERT INTO "shortUrls"("shortUrl",url,"visitCount","userId") VALUES ($1,$2,$3,$4)`,[nanoId,url,0,user.rows[0].userId])
     const urlId = await db.query(`SELECT * FROM "shortUrls" WHERE url = $1`,[url])
     res.status(201).send({
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
         if(shortUrlObjt.rowCount === 0){
            res.sendStatus(404)
            return
         }
        const response = shortUrlObjt.rows[0]
        delete response.visitCount
        delete response.userId
        res.send(response)

    } catch (e){
        console.log(e)
        res.status(500).send("pau no  server")
    }
}

export const openUrl = async (req,res) => {
    const  {shortUrl} = req.params
    try {
    const url = await db.query(`SELECT * FROM "shortUrls" WHERE "shortUrl" = $1 `,[shortUrl])
    if(url.rowCount ===  0 ){
        res.sendStatus(404)
        return
    }
    url.rows[0].visitCount += 1
    await db.query(`UPDATE "shortUrls" SET "visitCount" = $1`,[url.rows[0].visitCount])
    res.redirect(url.rows[0].url)
    } catch (e){
        console.log(e)
        res.status(500).send("deu pau no  server")
    }
}

export const deleteUrl = async (req,res) =>{
    const  {id} = req.params
    let token = req.headers.authorization
    const authorization  = token.slice(7)
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

export const getUsersMe = async (req,res) => {
    let token = req.headers.authorization
    const authorization  = token.slice(7)
    try {
        const user = await db.query("SELECT * FROM sessions WHERE token = $1",[authorization])
        const User = await db.query("SELECT * FROM users WHERE id=$1",[user.rows[0].userId])
        const shortUrls = await db.query(`SELECT * FROM "shortUrls" WHERE "userId" = $1 `,[user.rows[0].userId])
        let visitCount = 0
        shortUrls.rows.forEach((r)=>{
            visitCount += r.visitCount
        })
        const response = {
            id: user.rows[0].userId,
            name: User.rows[0].name,
            visitCount: visitCount,
            shortenedUrls: shortUrls.rows
        }
        res.send(response)
        } catch (e){
            console.log(e)
            res.status(500).send("pau no server")
        }
}


export const getRanking = async (req,res)=>{
    try {
        const shortUrls = await db.query(`
        SELECT * FROM users
        LEFT JOIN  "shortUrls" ON "shortUrls"."userId" = users.id
        GROUP BY users.name,users.id,"shortUrls".id,users.email,users.password,users."createdAt"`)
        const response = []
        for(let i = 0;i< shortUrls.rows.length;i++){
            let exist = false
            let responsePush = {
                id:shortUrls.rows[i].userId,
                name:shortUrls.rows[i].name,
                linksCount:1,
                visitCount:shortUrls.rows[i].visitCount
            }
                response.forEach((r)=>{
                    if(r.id === responsePush.id){
                     r.linksCount+= 1
                     r.visitCount += responsePush.visitCount
                    exist = true
                } 
            })
               response.push(responsePush)      
        } 
        response.sort(function(a,b) {
            return a.visitCount > b.visitCount ? -1 : a.visitCount < b.visitCount ? 1 : 0;
        })
        res.send(response)

    } catch(e){
        console.log(e)
        res.status(500).send(e)
    }

}