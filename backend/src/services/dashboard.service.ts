import { ROLES } from "../constants/roles";
import dataRepository from "../repositories/data.repository";
import trashRepository from "../repositories/trash.repository";
import dataHistoryRepository from "../repositories/dataHistory.repository";
import connectionHistoryRepository from "../repositories/connectionHistory.repository";
import categoryRepository from "../repositories/category.repository";
import departmentRepository from "../repositories/department.repository";
import shareRepository from "../repositories/share.repository";
import userRepository from "../repositories/user.repository";

type Role = string;

export type DashboardRequester = {
  id: string;
  role: Role;
};

class DashboardService {
  private classify(niveauGlobal: number) {
    if (niveauGlobal <= 2) return "low";
    if (niveauGlobal <= 4) return "medium";
    return "high";
  }

  async getDashboardForMe(requester: DashboardRequester) {
    const isAdmin = requester.role === ROLES.ADMIN;

    // --- Core counts (data + trash) ---
    const allActiveData = isAdmin
      ? await dataRepository.findAllActive()
      : await dataRepository.findByOwner(requester.id);

    const activeCount = allActiveData.length;

    const trashCount = isAdmin
      ? await trashRepository.countAll()
      : await trashRepository.countByOwner(requester.id);

    // --- CIA distribution (low/medium/high based on niveauGlobal) ---
    const ciaBuckets = { low: 0, medium: 0, high: 0 } as Record<
      "low" | "medium" | "high",
      number
    >;

    // --- Import workflow status counts ---
    const statusCounts = {
      imported: 0,
      ciaAssigned: 0,
      classified: 0,
    };

    let classifiedGlobalSum = 0;
    let classifiedGlobalCount = 0;
    let highestGlobalClassification = 0;

    for (const d of allActiveData as any[]) {
      if (d?.statut === "Imported") statusCounts.imported += 1;
      else if (d?.statut === "CIA Assigned") statusCounts.ciaAssigned += 1;
      else if (d?.statut === "Classified") statusCounts.classified += 1;

      const niveauGlobal = d?.niveauCIA?.niveauGlobal;
      if (typeof niveauGlobal !== "number") continue;
      const bucket = this.classify(niveauGlobal);
      ciaBuckets[bucket] += 1;
      classifiedGlobalSum += niveauGlobal;
      classifiedGlobalCount += 1;
      if (niveauGlobal > highestGlobalClassification) {
        highestGlobalClassification = niveauGlobal;
      }
    }

    const globalClassification = {
      highest: highestGlobalClassification,
      average:
        classifiedGlobalCount > 0
          ? Number((classifiedGlobalSum / classifiedGlobalCount).toFixed(2))
          : 0,
      classifiedCount: classifiedGlobalCount,
    };

    // --- Category + department distribution ---
    const categoryDist: Record<string, number> = {};
    const departmentDist: Record<string, number> = {};

    for (const d of allActiveData as any[]) {
      const catId = d?.categorie?.toString();
      const deptId = d?.departement?.toString();
      if (catId) categoryDist[catId] = (categoryDist[catId] || 0) + 1;
      if (deptId)
        departmentDist[deptId] = (departmentDist[deptId] || 0) + 1;
    }

    const categories = await categoryRepository.findAll();
    const departments = await departmentRepository.findAll();

    const categoryMap = new Map(
      (categories as any[]).map((c) => [
        c._id.toString(),
        c.name || c.libelle || c.code || c._id.toString(),
      ])
    );
    const departmentMap = new Map(
      (departments as any[]).map((d) => [
        d._id.toString(),
        d.name || d.libelle || d.code || d._id.toString(),
      ])
    );

    const categoryDistribution = Object.entries(categoryDist).map(
      ([id, count]) => ({
        categoryId: id,
        categoryName: categoryMap.get(id) || id,
        count,
      })
    );

    const departmentDistribution = Object.entries(departmentDist).map(
      ([id, count]) => ({
        departmentId: id,
        departmentName: departmentMap.get(id) || id,
        count,
      })
    );

    // --- Activity (connections + data actions) ---
    const connections = isAdmin
      ? await connectionHistoryRepository.findAll()
      : await connectionHistoryRepository.findByUserId(requester.id);

    const dataHistory = isAdmin
      ? await dataHistoryRepository.findAll()
      : await dataHistoryRepository.findAll();

    const filteredDataHistory = isAdmin
      ? dataHistory
      : dataHistory.filter(
          (h: any) => h.performedBy?.toString() === requester.id
        );

    const recentConnections = (connections as any[]).slice(0, 10);
    const recentActions = (filteredDataHistory as any[]).slice(0, 10);

    // --- Monthly uploads (dynamic) ---
    const monthly = isAdmin
      ? await dataRepository.monthlyUploads()
      : await dataRepository.monthlyUploads(requester.id);

    // --- Share stats dynamically ---
    let totalSharedCount = 0;
    let sharedWithMeCount = 0;
    let sharedByMeCount = 0;
    try {
      if (isAdmin) {
        const allShares = await shareRepository.findAll();
        totalSharedCount = allShares.length;
      } else {
        const myShares = await shareRepository.findBySender(requester.id);
        sharedByMeCount = myShares.length;
        const receivedShares = await shareRepository.findByReceiver(requester.id);
        sharedWithMeCount = receivedShares.length;
        totalSharedCount = sharedByMeCount + sharedWithMeCount;
      }
    } catch {
      // share repo might not be fully integrated
    }

    const sharedStats = {
      totalShared: totalSharedCount,
      sharedWithMe: sharedWithMeCount,
      sharedByMe: sharedByMeCount,
    };

    // --- Active users (admin only) ---
    let activeUsersCount = 0;
    let allUsersForDept: any[] = [];
    if (isAdmin) {
      try {
        allUsersForDept = await userRepository.findAll();
        activeUsersCount = allUsersForDept.length; // total users, not just active
      } catch (err) {
        console.error("Dashboard: failed to fetch users", err);
      }
    }

    // --- Department distribution: admin sees users per dept (top 3), regular users see data per dept (top 3) ---
    let finalDepartmentDistribution = departmentDistribution;
    if (isAdmin && allUsersForDept.length > 0) {
      const userDeptDist: Record<string, number> = {};
      for (const u of allUsersForDept as any[]) {
        const deptId = u.department?.toString();
        if (deptId) userDeptDist[deptId] = (userDeptDist[deptId] || 0) + 1;
      }

      finalDepartmentDistribution = Object.entries(userDeptDist)
        .map(([id, count]) => ({
          departmentId: id,
          departmentName: departmentMap.get(id) || id,
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
    } else {
      // For non-admin or fallback: show top 3 data-per-department
      finalDepartmentDistribution = departmentDistribution
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 3);
    }

    // --- Category distribution: show top 3 categories with most data ---
    const topCategoryDistribution = categoryDistribution
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 3);

    return {
      success: true,
      role: requester.role,
      data: {
        scope: isAdmin ? "admin" : "user",
        stats: {
          totalData: activeCount,
          trashData: trashCount,
          activeUsers: activeUsersCount,
          importedDatasets: statusCounts.imported,
          datasetsPendingCIA: statusCounts.imported,
          classifiedDatasets: statusCounts.classified,
          datasetStatus: statusCounts,
          globalClassification,
          classification: ciaBuckets,
          distribution: {
            categories: topCategoryDistribution,
            departments: finalDepartmentDistribution,
          },
          shared: sharedStats,
          monthlyUploads: monthly,
        },
        activity: {
          recentConnections,
          recentActions,
        },
      },
    };
  }
}

export default new DashboardService();