import { createRouter, createWebHistory } from 'vue-router';
import GameDetails from '../components/GameDetails.vue';
import RightContent from '../components/RightContent.vue';

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
  }
  // other routes...
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
