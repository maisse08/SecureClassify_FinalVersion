import DataType from "../models/DataType";
import { dataTypes } from "./data/datatypes";

export async function seedDataTypes() {
  for (const dataType of dataTypes) {
    const exists = await DataType.findOne({
      name: dataType.name,
    });

    if (exists) {
      console.log(`ℹ️ Data Type already exists: ${dataType.name}`);
      continue;
    }

    await DataType.create(dataType);
    console.log(`✅ Data Type created: ${dataType.name}`);
  }
}