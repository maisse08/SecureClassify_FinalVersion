import bcrypt from "bcrypt";
import userRepository from "../repositories/user.repository";
import { IUser } from "../interfaces/IUser";
import { ROLES } from "../constants/roles";
import { ALL_PERMISSIONS, DEFAULT_EMPLOYEE_PERMISSIONS } from "../constants/permissions";
import User from "../models/User";
import AppError from "../exceptions/AppError";

class UserService {

    async getAllUsers() {

        return await userRepository.findAll();

    }



    async getUserById(id: string) {

        const user =
            await userRepository.findById(id);

        if (!user) {

            throw new AppError(
                "User not found",
                404
            );

        }

        return {

            id: user._id,

            firstName: user.firstName,

            lastName: user.lastName,

            email: user.email,

            role: user.role,

            department: user.department,

            isActive: user.isActive

        };

    }




    async createUser(user: Partial<IUser>, requester?: { id: string; role: string }) {

        const existingUser =
            await userRepository.findByEmail(user.email!);

        if (existingUser) {

            throw new AppError(
                "Email already exists",
                400
            );

        }

        // Only a real ADMIN may create another ADMIN account or hand out custom
        // permissions directly. A regular user who was delegated the
        // "users.create" permission can still create employee accounts, but
        // cannot use that delegated permission to escalate privileges (make
        // someone an admin, or grant admin-only permissions themselves).
        const requesterIsAdmin = requester?.role === ROLES.ADMIN;

        if (!requesterIsAdmin) {
            user.role = ROLES.EMPLOYEE;
            delete user.permissions;
        }

        const hashedPassword =
            await bcrypt.hash(user.password!, 10);

        // Determine initial permissions
        let permissions: string[];

        if ((user.role ?? ROLES.EMPLOYEE) === ROLES.ADMIN) {
            // Admin gets all permissions by default
            permissions = ALL_PERMISSIONS as string[];
        } else {
            // Every employee manages their own data by default — this is
            // always granted and cannot be left out by whatever an admin
            // delegates on top of it.
            const delegated = user.permissions && Array.isArray(user.permissions)
                ? (user.permissions as string[])
                : [];
            permissions = Array.from(new Set([...DEFAULT_EMPLOYEE_PERMISSIONS, ...delegated]));
        }

        const displayName = user.displayName ?? `${user.firstName} ${user.lastName}`;

        const newUser =
            await userRepository.create({

                ...user,

                password: hashedPassword,

                role: user.role ?? ROLES.EMPLOYEE,

                permissions,

                displayName

            });

        return {

            id: newUser._id,

            firstName: newUser.firstName,

            lastName: newUser.lastName,

            displayName: newUser.displayName ?? `${newUser.firstName} ${newUser.lastName}`,

            email: newUser.email,

            role: newUser.role,

            department: newUser.department,

            isActive: newUser.isActive,

            permissions: newUser.permissions || []

        };

    }




    async updateUser(
        id: string,
        data: Partial<IUser>,
        requester?: { id: string; role: string }
    ) {

        const user =
            await userRepository.findById(id);

        if (!user) {

            throw new AppError(
                "User not found",
                404
            );

        }

        // A delegated (non-admin) user granted the "users.update" permission
        // can update basic account fields, but cannot use that delegated
        // permission to promote someone to ADMIN or edit the permissions
        // array directly — those remain true-admin-only actions (handled by
        // the dedicated /permissions endpoints, which already require
        // roleMiddleware(ADMIN)).
        const requesterIsAdmin = requester?.role === ROLES.ADMIN;
        if (!requesterIsAdmin) {
            delete data.role;
            delete data.permissions;
        } else {
            const effectiveRole = data.role ?? user.role;
            const roleChangedFromAdminToEmployee = user.role === ROLES.ADMIN && effectiveRole === ROLES.EMPLOYEE;

            if (Array.isArray(data.permissions)) {
                // Own-data permissions can never be removed for an employee —
                // merge them back in regardless of what was submitted.
                // HOWEVER, if the role is changing FROM admin TO employee, ignore
                // any submitted permissions and use only employee defaults.
                if (roleChangedFromAdminToEmployee) {
                    data.permissions = DEFAULT_EMPLOYEE_PERMISSIONS;
                } else {
                    data.permissions = effectiveRole === ROLES.ADMIN
                        ? (ALL_PERMISSIONS as string[])
                        : Array.from(new Set([...DEFAULT_EMPLOYEE_PERMISSIONS, ...(data.permissions as string[])]));
                }
            } else if (data.role && data.role !== user.role) {
                // Role changed without an explicit permissions array: reset
                // to sensible defaults for the new role.
                data.permissions = effectiveRole === ROLES.ADMIN
                    ? (ALL_PERMISSIONS as string[])
                    : DEFAULT_EMPLOYEE_PERMISSIONS;
            }
        }

        if (data.password) {

            data.password =
                await bcrypt.hash(
                    data.password,
                    10
                );

        }

        const updatedUser =
            await userRepository.update(
                id,
                data
            );

        if (!updatedUser) {

            throw new AppError(
                "User not found",
                404
            );

        }

        return {

            id: updatedUser._id,

            firstName: updatedUser.firstName,

            lastName: updatedUser.lastName,

            displayName: updatedUser.displayName ?? `${updatedUser.firstName} ${updatedUser.lastName}`,

            email: updatedUser.email,

            role: updatedUser.role,

            department: updatedUser.department,

            isActive: updatedUser.isActive,

            permissions: updatedUser.permissions || []

        };

    }




    async addPermission(userId: string, permission: string) {

        const user = await userRepository.findById(userId);

        if (!user) {
            throw new AppError("User not found", 404);
        }

        const current = user.permissions || [];

        if (current.includes(permission)) {
            return {
                id: user._id,
                permissions: current
            };
        }

        const updated = await userRepository.update(userId, {
            permissions: [...current, permission]
        });

        if (!updated) {
            throw new AppError("User not found", 404);
        }

        return {
            id: updated._id,
            permissions: updated.permissions || []
        };

    }


    async removePermission(userId: string, permission: string) {

        const user = await userRepository.findById(userId);

        if (!user) {
            throw new AppError("User not found", 404);
        }

        const current = user.permissions || [];

        const updatedPermissions = current.filter(p => p !== permission);

        const updated = await userRepository.update(userId, {
            permissions: updatedPermissions
        });

        if (!updated) {
            throw new AppError("User not found", 404);
        }

        return {
            id: updated._id,
            permissions: updated.permissions || []
        };

    }


    async deleteUser(id: string) {

        const user =
            await userRepository.findById(id);

        if (!user) {

            throw new AppError(
                "User not found",
                404
            );

        }

        return await userRepository.deactivate(id);

    }




    async getProfile(userId: string) {

        const user =
            await userRepository.findById(userId);

        if (!user) {

            throw new AppError(
                "User not found",
                404
            );

        }

        return {

            id: user._id,

            firstName: user.firstName,

            lastName: user.lastName,

            email: user.email,

            role: user.role,

            department: user.department,

            isActive: user.isActive

        };

    }




    async updateProfile(userId: string, data: Partial<IUser>) {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw new AppError("User not found", 404);
        }

        // If email is being changed, check it's not already taken
        if (data.email && data.email !== user.email) {
            const existingUser = await userRepository.findByEmail(data.email);
            if (existingUser) {
                throw new AppError("Email already in use", 400);
            }
        }

        // Only allow updating safe fields (not role, permissions, isActive)
        const allowedFields: (keyof Partial<IUser>)[] = [
            "firstName",
            "lastName",
            "displayName",
            "email",
            "department",
        ];

        const updateData: Partial<IUser> = {};
        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                (updateData as any)[field] = data[field];
            }
        }

        // Auto-update displayName if firstName or lastName changed and no explicit displayName
        if (data.firstName || data.lastName) {
            if (!data.displayName) {
                updateData.displayName = `${data.firstName ?? user.firstName} ${data.lastName ?? user.lastName}`;
            }
        }

        const updatedUser = await userRepository.update(userId, updateData);
        if (!updatedUser) {
            throw new AppError("User not found", 404);
        }

        return {
            id: updatedUser._id,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            displayName: updatedUser.displayName ?? `${updatedUser.firstName} ${updatedUser.lastName}`,
            email: updatedUser.email,
            role: updatedUser.role,
            department: updatedUser.department,
            isActive: updatedUser.isActive,
            permissions: updatedUser.permissions || [],
        };
    }

    async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string
    ) {

        const user =
            await User.findById(userId)
                .select("+password");

        if (!user) {

            throw new AppError(
                "User not found",
                404
            );

        }

        const isMatch =
            await bcrypt.compare(
                currentPassword,
                user.password
            );

        if (!isMatch) {

            throw new AppError(
                "Current password is incorrect",
                400
            );

        }

        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                10
            );

        await userRepository.updatePassword(
            userId,
            hashedPassword
        );

        return {

            message: "Password changed successfully"

        };

    }

}

export default new UserService();