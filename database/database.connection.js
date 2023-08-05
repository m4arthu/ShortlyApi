import dotenv from  "dotenv"
import pg from  "pg"
dotenv.config()
const {Pool} = pg

const  configDatabase =  {
    connectionString: process.env.DATABASE_URL,
    ssl: true
}

export const db  = new Pool(configDatabase)
