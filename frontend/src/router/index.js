import { createRouter, createWebHistory } from 'vue-router';
import GameDetails from '../components/GameDetails.vue';
import RightContent from '../components/RightContent.vue';
import Categories from '../components/GameCategories.vue';
import GamesByCategory from '../components/GamesByCategory.vue';
import YourShelf from '../components/YourShelf.vue';
import Ranking from '../components/Ranking.vue';
import UserShelf from '../components/UserShelf.vue';
import FriendList from '../components/FriendList.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: RightContent
  },
  {
    path: '/game/:gameId',
    name: 'GameDetails',
    component: GameDetails,
    props: route => ({ gameId: parseInt(route.params.gameId, 10) })
  },
  {
    path: '/categories',
    name: 'GameCategories',
    component: Categories
  },
  {
    path: '/games/category/:category',
    name: 'GamesByCategory',
    component: GamesByCategory,
    props: route => ({ category: route.params.category })
  },
  {
    path: '/shelf',
    name: 'YourShelf',
    component: YourShelf
  },
  {
    path: '/ranking',
    name: 'Ranking',
    component: Ranking
  },
  {
    path: '/user/:userId',
    name: 'UserShelf',
    component: UserShelf,
    props: route => ({ userId: parseInt(route.params.userId, 10) })
  },
  {
    path: '/friends',
    name: 'FriendList',
    component: FriendList
  },
  
  // other routes...
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
