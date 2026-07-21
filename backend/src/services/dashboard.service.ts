import { ROLES } from "../constants/roles";
import dataRepository from "../repositories/data.repository";
import trashRepository from "../repositories/trash.repository";
import dataHistoryRepository from "../repositories/dataHistory.repository";
import connectionHistoryRepository from "../repositories/connectionHistory.repository";
import categoryRepository from "../repositories/category.repository";
import departmentRepository from "../repositories/department.repository";

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
      // Highest global classification level reached across all classified
      // datasets - the organization's overall exposure level (1-5).
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

    // --- Shared stats placeholder (share aggregation not implemented in repo) ---
    const sharedStats = {
      totalShared: null,
      sharedWithMe: null,
      sharedByMe: null,
    };

    return {
      success: true,
      role: requester.role,
      data: {
        scope: isAdmin ? "admin" : "user",
        stats: {
          totalData: activeCount,
          trashData: trashCount,
          importedDatasets: statusCounts.imported,
          // Datasets still waiting for a CIA assessment (status "Imported").
          datasetsPendingCIA: statusCounts.imported,
          classifiedDatasets: statusCounts.classified,
          datasetStatus: statusCounts,
          globalClassification,
          classification: ciaBuckets,
          distribution: {
            categories: categoryDistribution,
            departments: departmentDistribution,
          },
          shared: sharedStats,
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

