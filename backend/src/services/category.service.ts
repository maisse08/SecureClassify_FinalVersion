import { ICategory } from "../interfaces/ICategory";
import categoryRepository from "../repositories/category.repository";
import dataRepository from "../repositories/data.repository";
import AppError from "../exceptions/AppError";

class CategoryService {

    async getAllCategories() {

        const categories = await categoryRepository.findAll();
        const counts = await dataRepository.countGroupedByCategory();

        return categories.map((category: any) => {
            const plain = category.toObject ? category.toObject() : category;
            return {
                ...plain,
                datasetCount: counts[String(category._id)] || 0,
            };
        });

    }

    async getArchivedCategories() {

        const categories = await categoryRepository.findAllInactive();
        const counts = await dataRepository.countGroupedByCategory();

        return categories.map((category: any) => {
            const plain = category.toObject ? category.toObject() : category;
            return {
                ...plain,
                datasetCount: counts[String(category._id)] || 0,
            };
        });

    }

    async getCategoryById(id: string) {

        const category =
            await categoryRepository.findById(id);

        if (!category) {

            throw new AppError(
                "Category not found",
                404
            );

        }

        return category;

    }

    async createCategory(
        category: Partial<ICategory>
    ) {

        const existingCategory =
            await categoryRepository.findByName(
                category.name!
            );

        if (existingCategory) {

            throw new AppError(
                "Category name already exists",
                400
            );

        }

        return await categoryRepository.create(
            category
        );

    }

    async updateCategory(
        id: string,
        data: Partial<ICategory>
    ) {

        const category =
            await categoryRepository.findById(id);

        if (!category) {

            throw new AppError(
                "Category not found",
                404
            );

        }

        return await categoryRepository.update(
            id,
            data
        );

    }

    async deactivateCategory(id: string) {

        const category =
            await categoryRepository.findById(id);

        if (!category) {

            throw new AppError(
                "Category not found",
                404
            );

        }

        return await categoryRepository.deactivate(
            id
        );

    }

    async activateCategory(id: string) {

        const category =
            await categoryRepository.findById(id);

        if (!category) {

            throw new AppError(
                "Category not found",
                404
            );

        }

        return await categoryRepository.restore(id);

    }

    async permanentlyDeleteCategory(id: string) {

        const category =
            await categoryRepository.findById(id);

        if (!category) {

            throw new AppError(
                "Category not found",
                404
            );

        }

        if (category.isActive) {

            throw new AppError(
                "Only archived categories can be permanently deleted. Archive it first.",
                400
            );

        }

        const usageCount = await dataRepository.countByCategory(id);

        if (usageCount > 0) {

            throw new AppError(
                "Cannot permanently delete this category: it is still referenced by " +
                usageCount + " dataset(s).",
                400
            );

        }

        return await categoryRepository.permanentlyDelete(id);

    }

}

export default new CategoryService();
