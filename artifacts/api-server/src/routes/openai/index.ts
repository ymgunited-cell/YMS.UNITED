import { Router } from "express";
import conversationsRouter from "./conversations";
import animeRouter from "./anime";
import generateImageRouter from "./generate-image";

const router = Router();

router.use("/openai", conversationsRouter);
router.use("/openai", animeRouter);
router.use("/openai", generateImageRouter);

export default router;
