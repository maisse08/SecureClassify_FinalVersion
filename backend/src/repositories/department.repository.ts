import Department from "../models/Department";
import { IDepartment } from "../interfaces/IDepartment";

class DepartmentRepository {

    async create(
        department: Partial<IDepartment>
    ): Promise<IDepartment> {

        return await Department.create(department);

    }


    async findById(
        id: string
    ): Promise<IDepartment | null> {

        return await Department.findById(id);

    }


    async findAll(): Promise<IDepartment[]> {

        return await Department.find({}).sort({ isActive: -1, createdAt: -1 });

    }


    async findByName(
        name: string
    ): Promise<IDepartment | null> {

        return await Department.findOne({
            name
        });

    }


    async findByCode(
        code: string
    ): Promise<IDepartment | null> {

        return await Department.findOne({
            code
        });

    }


    async update(
        id: string,
        data: Partial<IDepartment>
    ): Promise<IDepartment | null> {

        return await Department.findByIdAndUpdate(
            id,
            data,
            {
                new: true,
            }
        );

    }


    async deactivate(
        id: string
    ): Promise<IDepartment | null> {

        return await Department.findByIdAndUpdate(
            id,
            {
                isActive: false,
            },
            {
                new: true,
            }
        );

    }

    async findAllInactive(): Promise<IDepartment[]> {

        return await Department.find({ isActive: false }).sort({ createdAt: -1 });

    }

    async restore(
        id: string
    ): Promise<IDepartment | null> {

        return await Department.findByIdAndUpdate(
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
    ): Promise<IDepartment | null> {

        return await Department.findByIdAndDelete(id);

    }

}

export default new DepartmentRepository();