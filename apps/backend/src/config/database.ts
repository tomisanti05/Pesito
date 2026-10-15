import path from "node:path";
import dotenv from "dotenv";
import { Sequelize } from "sequelize";

dotenv.config({
  path: path.resolve(import.meta.dirname, "../../../../.env"),
  quiet: true,
});

const sequelize = new Sequelize({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false },
  },
});

export async function connectDatabase(): Promise<void> {
  await sequelize.authenticate();
}

export default sequelize;
