import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

// Contact schema — matches the spec exactly (SQL table with integer PK)
const Contact = sequelize.define(
  "Contact",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    // Int? — references the id of the primary contact in the same table
    linkedId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    linkPrecedence: {
      type: DataTypes.ENUM("primary", "secondary"),
      allowNull: false,
      defaultValue: "primary",
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "contacts",
    timestamps: true, // manages createdAt and updatedAt automatically
  }
);

export default Contact;
