import dotenv from  "dotenv"
import pg from  "pg"
dotenv.config()
const {Pool} = pg

let configDatabase
if(process.env.NODE_ENV === "producion"){
     configDatabase =  {
        connectionString: process.env.DATABASE_URL,
        ssl:true
    }
} else {
    configDatabase =  {
        connectionString: process.env.DATABASE_URL,
       
    }
}

console.log(configDatabase)
export const db  = new Pool(configDatabase)
