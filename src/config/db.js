import { Sequelize } from "sequelize";

// Creates the Sequelize connection using DATABASE_URL from .env
// SSL is enabled automatically when the URL points to Render's hosted Postgres
// (detected by "render.com" or "dpg-" in the URL), so this works both
// locally (external Render URL) and in production (internal Render URL)
const isRenderDB =
  process.env.DATABASE_URL?.includes("render.com") ||
  process.env.DATABASE_URL?.includes("dpg-");

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false, // change to console.log to print generated SQL queries
  dialectOptions: {
    ssl: isRenderDB ? { require: true, rejectUnauthorized: false } : false,
  },
});

export default sequelize;
