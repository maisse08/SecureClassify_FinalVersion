import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import datatypeService from "../services/datatype.service";

class DataTypeController {
    getAllDataTypes = asyncHandler(async (req: Request, res: Response) => {
        const dataTypes = await datatypeService.getAllDataTypes();
        res.status(200).json({ success: true, data: dataTypes });
    });

    getArchivedDataTypes = asyncHandler(async (req: Request, res: Response) => {
        const dataTypes = await datatypeService.getArchivedDataTypes();
        res.status(200).json({ success: true, data: dataTypes });
    });

    getDataType = asyncHandler(async (req: Request, res: Response) => {
        const dataType = await datatypeService.getDataTypeById(req.params.id as string);
        res.status(200).json({ success: true, data: dataType });
    });

    createDataType = asyncHandler(async (req: Request, res: Response) => {
        const dataType = await datatypeService.createDataType(req.body);
        res.status(201).json({ success: true, message: "Data type created successfully", data: dataType });
    });

    updateDataType = asyncHandler(async (req: Request, res: Response) => {
        const dataType = await datatypeService.updateDataType(req.params.id as string, req.body);
        res.status(200).json({ success: true, message: "Data type updated successfully", data: dataType });
    });

    deactivateDatatype = asyncHandler(async (req: Request, res: Response) => {
        const dataType = await datatypeService.deactivateDataType(req.params.id as string);
        res.status(200).json({ success: true, message: "Data type deactivated successfully", data: dataType });
    });

    activateDatatype = asyncHandler(async (req: Request, res: Response) => {
        const dataType = await datatypeService.activateDataType(req.params.id as string);
        res.status(200).json({ success: true, message: "Data type activated successfully", data: dataType });
    });

    permanentlyDeleteDataType = asyncHandler(async (req: Request, res: Response) => {
        await datatypeService.permanentlyDeleteDataType(req.params.id as string);
        res.status(200).json({ success: true, message: "Data type permanently deleted" });
    });
}

export default new DataTypeController();
