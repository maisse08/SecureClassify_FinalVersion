import { IDepartment } from "../interfaces/IDepartment";
import departmentRepository from "../repositories/department.repository";
import userRepository from "../repositories/user.repository";
import dataRepository from "../repositories/data.repository";
import AppError from "../exceptions/AppError";

class DepartmentService {

    async getAllDepartments() {

        const departments = await departmentRepository.findAll();
        const counts = await userRepository.countGroupedByDepartment();

        return departments.map((department: any) => {
            const plain = department.toObject ? department.toObject() : department;
            return {
                ...plain,
                userCount: counts[String(department._id)] || 0,
            };
        });

    }

    async getArchivedDepartments() {

        const departments = await departmentRepository.findAllInactive();
        const counts = await userRepository.countGroupedByDepartment();

        return departments.map((department: any) => {
            const plain = department.toObject ? department.toObject() : department;
            return {
                ...plain,
                userCount: counts[String(department._id)] || 0,
            };
        });

    }

    async getDepartmentById(id: string) {

        const department =
            await departmentRepository.findById(id);

        if (!department) {

            throw new AppError(
                "Department not found",
                404
            );

        }

        return department;

    }

    async createDepartment(
        department: Partial<IDepartment>
    ) {

        const existingName =
            await departmentRepository.findByName(
                department.name!
            );

        if (existingName) {

            throw new AppError(
                "Department name already exists",
                400
            );

        }

        const existingCode =
            await departmentRepository.findByCode(
                department.code!
            );

        if (existingCode) {

            throw new AppError(
                "Department code already exists",
                400
            );

        }

        return await departmentRepository.create(department);

    }

    async updateDepartment(
        id: string,
        data: Partial<IDepartment>
    ) {

        const department =
            await departmentRepository.findById(id);

        if (!department) {

            throw new AppError(
                "Department not found",
                404
            );

        }

        return await departmentRepository.update(
            id,
            data
        );

    }

    async deactivateDepartment(id: string) {

        const department =
            await departmentRepository.findById(id);

        if (!department) {

            throw new AppError(
                "Department not found",
                404
            );

        }

        // Deactivating hides the department from new assignments; it does
        // not require first removing its existing users (consistent with
        // how categories and data types can be deactivated regardless of
        // how many datasets currently reference them).
        return await departmentRepository.deactivate(id);

    }

    async activateDepartment(id: string) {

        const department =
            await departmentRepository.findById(id);

        if (!department) {

            throw new AppError(
                "Department not found",
                404
            );

        }

        return await departmentRepository.restore(id);

    }

    async permanentlyDeleteDepartment(id: string) {

        const department =
            await departmentRepository.findById(id);

        if (!department) {

            throw new AppError(
                "Department not found",
                404
            );

        }

        if (department.isActive) {

            throw new AppError(
                "Only archived departments can be permanently deleted. Archive it first.",
                400
            );

        }

        const userCount = await userRepository.countByDepartment(id);
        const datasetCount = await dataRepository.countByDepartment(id);

        if (userCount > 0 || datasetCount > 0) {

            throw new AppError(
                "Cannot permanently delete this department: it is still referenced by " +
                userCount + " user(s) and " + datasetCount + " dataset(s).",
                400
            );

        }

        return await departmentRepository.permanentlyDelete(id);

    }

}

export default new DepartmentService();
