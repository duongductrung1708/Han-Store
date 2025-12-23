import express from "express";
import { listCategories } from "../controllers/category.controller.js";

const router = express.Router();

// Public
router.get("/", listCategories);

export default router;

