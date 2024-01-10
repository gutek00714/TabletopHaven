import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import 'materialize-css/dist/css/materialize.min.css';
import 'materialize-css/dist/js/materialize.min.js';
import "./styles/main.css"

createApp(App).use(router).mount('#app');
