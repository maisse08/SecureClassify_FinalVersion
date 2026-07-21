import bcrypt from "bcrypt";
import Department from "../models/Department";
import User from "../models/User";
import { users } from "./data/users";
import { ROLES } from "../constants/roles";

export async function seedUsers() {
  const hashedPassword = await bcrypt.hash("Admin@123", 10);

  for (const user of users) {
    const exists = await User.findOne({
      email: user.email,
    });

    if (exists) {
      console.log(`ℹ️ User already exists: ${user.email}`);
      continue;
    }

    let departmentId;

    if ( user.departmentCode ) {
      const department = await Department.findOne({
        code: user.departmentCode,
      });

      if (!department) {
        console.log(
          `❌ Department ${user.departmentCode} not found for ${user.email}`
        );
        continue;
      }

      departmentId = department._id;
    }

    await User.create({
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      email: user.email,
      password: hashedPassword,
      role: user.role,
      department: departmentId,
      permissions: user.permissions,
      isActive: user.isActive,
    });

    console.log(`✅ User created: ${user.email}`);
  }
}