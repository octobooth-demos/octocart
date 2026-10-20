import { Router } from 'express';
import { store } from '../data/store.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { NotFoundError } from '../lib/errors.js';
import { validate } from '../lib/validate.js';
import { ListProductsQuery, ProductIdParams } from '../schemas.js';

export const productsRouter = Router();

productsRouter.get(
  '/',
  validate({ query: ListProductsQuery }),
  asyncHandler(async (req, res) => {
    const query = req.query as ListProductsQuery;
    res.json({ products: await store.listProducts(query) });
  }),
);

productsRouter.get(
  '/:id',
  validate({ params: ProductIdParams }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as ProductIdParams;
    const product = await store.getProduct(id);
    if (!product) throw new NotFoundError('Product');
    res.json({ product });
  }),
);
