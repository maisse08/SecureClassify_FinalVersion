import User from "../models/User";
import { IUser } from "../interfaces/IUser";

export class UserRepository {
    async create(user: Partial<IUser>): Promise<IUser> {
        return await User.create(user);
    }

    async findById(id: string): Promise<IUser | null> {
        return await User.findById(id);
    }

    async findByEmail(email: string): Promise<IUser | null> {
        return await User.findOne({ email });
    }

    async findAll(): Promise<IUser[]> {
        return await User.find();
    }

    async update(
        id: string,
        data: Partial<IUser>
    ): Promise<IUser | null> {
        return await User.findByIdAndUpdate(
            id,
            data,
            {
                new: true,
            }
        );
    }

    async delete(id: string): Promise<IUser | null> {
        return await User.findByIdAndDelete(id);
    }

    async updatePassword(
    id: string,
    password: string
    ): Promise<IUser | null> {

    return await User.findByIdAndUpdate(
        id,
        {
            password
        },
        {
            new: true
        }
    );

}

async deactivate(id: string): Promise<IUser | null> {

    return await User.findByIdAndUpdate(

        id,

        {
            isActive: false
        },

        {
            new: true
        }

    );

}
async findActiveByDepartment(
    departmentId: string
): Promise<IUser[]> {

    return await User.find({

        department: departmentId,

        isActive: true

    });

}

async countByDepartment(
    departmentId: string
): Promise<number> {

    return await User.countDocuments({
        department: departmentId,
        isActive: true
    });

}

async countGroupedByDepartment(): Promise<Record<string, number>> {

    const rows = await User.aggregate([
        { $match: { department: { $ne: null }, isActive: true } },
        { $group: { _id: "$department", count: { $sum: 1 } } },
    ]);

    return rows.reduce((acc: Record<string, number>, row: any) => {
        acc[String(row._id)] = row.count;
        return acc;
    }, {});

}
}

export default new UserRepository();