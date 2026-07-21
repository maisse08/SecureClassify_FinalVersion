import Category from "../models/Category";
import { categories } from "./data/categories";

export async function seedCategories() {
  for (const category of categories) {
    const exists = await Category.findOne({
      name: category.name,
    });

    if (exists) {
      console.log(`ℹ️ Category already exists: ${category.name}`);
      continue;
    }

    await Category.create(category);
    console.log(`✅ Category created: ${category.name}`);
  }
}