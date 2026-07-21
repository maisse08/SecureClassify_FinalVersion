import Department from "../models/Department";
import { departments } from "./data/departments";

export async function seedDepartments() {
  for (const department of departments) {
    const exists = await Department.findOne({
      code: department.code,
    });

    if (exists) {
      console.log(`ℹ️ Department already exists: ${department.name}`);
      continue;
    }

    await Department.create(department);
    console.log(`✅ Department created: ${department.name}`);
  }
}