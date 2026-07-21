import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middlewares/auth.middleware";

const router = Router();


router.get(
    "/protected",
    authMiddleware,
    (req: AuthRequest, res) => {

        res.json({

            success:true,

            message:"You accessed a protected route",

            user:req.user

        });

    }
);


export default router;