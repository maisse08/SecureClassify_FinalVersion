import Category from "../models/Category";
import { ICategory } from "../interfaces/ICategory";

class CategoryRepository {

    async create(
        category: Partial<ICategory>
    ): Promise<ICategory> {

        return await Category.create(category);

    }

    async findById(
        id: string
    ): Promise<ICategory | null> {

        return await Category.findById(id);

    }

    async findAll(): Promise<ICategory[]> {

        return await Category.find({}).sort({ isActive: -1, createdAt: -1 });

    }

    async findByName(
        name: string
    ): Promise<ICategory | null> {

        return await Category.findOne({
            name
        });

    }

    async update(
        id: string,
        data: Partial<ICategory>
    ): Promise<ICategory | null> {

        return await Category.findByIdAndUpdate(
            id,
            data,
            {
                new: true,
            }
        );

    }

    async deactivate(
        id: string
    ): Promise<ICategory | null> {

        return await Category.findByIdAndUpdate(
            id,
            {
                isActive: false,
            },
            {
                new: true,
            }
        );

    }

    async findAllInactive(): Promise<ICategory[]> {

        return await Category.find({ isActive: false }).sort({ createdAt: -1 });

    }

    async restore(
        id: string
    ): Promise<ICategory | null> {

        return await Category.findByIdAndUpdate(
            id,
            {
                isActive: true,
            },
            {
                new: true,
            }
        );

    }

    async permanentlyDelete(
        id: string
    ): Promise<ICategory | null> {

        return await Category.findByIdAndDelete(id);

    }

}

export default new CategoryRepository();