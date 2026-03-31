import { Router } from 'express';
import { detail, list } from './product.controller.js';

const productRouter = Router();

productRouter.get('/', list);
productRouter.get('/:id', detail);

export default productRouter;
