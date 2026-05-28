import { Router, type IRouter } from "express";
import healthRouter from "./health";
import categoriesRouter from "./categories";
import labelsRouter from "./labels";
import incomeSourcesRouter from "./income-sources";
import transactionsRouter from "./transactions";
import dashboardRouter from "./dashboard";
import insightsRouter from "./insights";

const router: IRouter = Router();

router.use(healthRouter);
router.use(categoriesRouter);
router.use(labelsRouter);
router.use(incomeSourcesRouter);
router.use(transactionsRouter);
router.use(dashboardRouter);
router.use(insightsRouter);

export default router;
