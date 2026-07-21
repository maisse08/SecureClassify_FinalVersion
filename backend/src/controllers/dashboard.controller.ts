import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import dashboardService from "../services/dashboard.service";


class DashboardController {
  
  getDashboardForMe = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as any;
    const requester = authReq.user as { id: string; role: string } | undefined;

    if (!requester) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const payload = await dashboardService.getDashboardForMe(requester);

    return res.status(200).json(payload);
  });
}

export default new DashboardController();


