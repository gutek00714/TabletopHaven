import { Router } from 'express';
import addGameRouter from './addGame';
import removeGameRouter from './removeGame';
import addWishlistRouter from './addWishlist';
import removeWishlistRouter from './removeFavorites';
import addFavoriteRouter from './addFavorites';
import removeFavoriteRouter from './removeFavorites';
import getUserShelfRouter from './userShelf';


const router = Router();

router.use(addGameRouter);
router.use(removeGameRouter);
router.use(addWishlistRouter);
router.use(removeWishlistRouter);
router.use(addFavoriteRouter);
router.use(removeFavoriteRouter);
router.use(getUserShelfRouter);

export default router;
