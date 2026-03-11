import { Router, type IRouter } from "express";
import healthRouter from "./health";
import roadmapRouter from "./roadmap";

const router: IRouter = Router();

router.use(healthRouter);
router.use(roadmapRouter);

export default router;
