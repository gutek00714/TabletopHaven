import { createRouter, createWebHistory } from 'vue-router';
import LoginSuccess from '../views/LoginSuccess.vue';
import LoginFail from '../views/LoginFail.vue';
import UserLogin from '../components/UserLogin.vue';

const routes = [
    {
    path: '/',
    name: 'UserLogin',
    component: UserLogin
    },
    {
    path: '/success',
    name: 'LoginSuccess',
    component: LoginSuccess
    },
    {
    path: '/fail',
    name: 'LoginFail',
    component: LoginFail
    }
  // other routes...
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
