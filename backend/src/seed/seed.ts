import mongoose from "mongoose";
import { env } from "../config/env";

import { seedDepartments } from "./department.seed";
import { seedUsers } from "./user.seed";
import { seedCategories } from "./category.seed";
import { seedDataTypes } from "./datatype.seed";

async function seed() {
  try {
    await mongoose.connect(env.MONGODB_URI);

    console.log("✅ Connected to MongoDB");

    await seedDepartments();
    await seedUsers();
    await seedCategories();
    await seedDataTypes();

    console.log("\n🎉 Database seeded successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
}

seed();