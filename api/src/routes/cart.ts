import { Router } from 'express';
import { store } from '../data/store.js';
import type { CartItem, Product } from '../data/types.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { ConflictError, NotFoundError } from '../lib/errors.js';
import { buildLines, calculateTotals } from '../lib/pricing.js';
import { validate } from '../lib/validate.js';
import { currentUser, requireAuth } from '../middleware/requireAuth.js';
import { AddCartItemBody, CartItemParams, UpdateCartItemBody } from '../schemas.js';

export const cartRouter = Router();

cartRouter.use(requireAuth);

async function cartResponse(userId: string) {
  const items = await store.getCart(userId);
  const products = new Map<string, Product>();
  for (const item of items) {
    const product = await store.getProduct(item.productId);
    if (product) products.set(product.id, product);
  }
  const lines = buildLines(items, products);
  return { cart: { lines, ...calculateTotals(lines) } };
}

async function requireStock(productId: string, quantity: number): Promise<Product> {
  const product = await store.getProduct(productId);
  if (!product) throw new NotFoundError('Product');
  if (product.stock < quantity) {
    throw new ConflictError(`Only ${product.stock} of ${product.name} left in stock`);
  }
  return product;
}

cartRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await cartResponse(currentUser(req).id));
  }),
);

cartRouter.post(
  '/items',
  validate({ body: AddCartItemBody }),
  asyncHandler(async (req, res) => {
    const { productId, quantity } = req.body as AddCartItemBody;
    const userId = currentUser(req).id;
    const items = [...(await store.getCart(userId))];
    const existing = items.find((item) => item.productId === productId);
    const newQuantity = (existing?.quantity ?? 0) + quantity;

    await requireStock(productId, newQuantity);

    const next: CartItem[] = existing
      ? items.map((item) =>
          item.productId === productId ? { ...item, quantity: newQuantity } : item,
        )
      : [...items, { productId, quantity }];
    await store.saveCart(userId, next);
    res.status(201).json(await cartResponse(userId));
  }),
);

cartRouter.patch(
  '/items/:productId',
  validate({ params: CartItemParams, body: UpdateCartItemBody }),
  asyncHandler(async (req, res) => {
    const { productId } = req.params as CartItemParams;
    const { quantity } = req.body as UpdateCartItemBody;
    const userId = currentUser(req).id;
    const items = await store.getCart(userId);
    if (!items.some((item) => item.productId === productId)) {
      throw new NotFoundError('Cart item');
    }

    await requireStock(productId, quantity);

    await store.saveCart(
      userId,
      items.map((item) => (item.productId === productId ? { ...item, quantity } : item)),
    );
    res.json(await cartResponse(userId));
  }),
);

cartRouter.delete(
  '/items/:productId',
  validate({ params: CartItemParams }),
  asyncHandler(async (req, res) => {
    const { productId } = req.params as CartItemParams;
    const userId = currentUser(req).id;
    const items = await store.getCart(userId);
    if (!items.some((item) => item.productId === productId)) {
      throw new NotFoundError('Cart item');
    }
    await store.saveCart(
      userId,
      items.filter((item) => item.productId !== productId),
    );
    res.json(await cartResponse(userId));
  }),
);
