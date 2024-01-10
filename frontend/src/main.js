import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import 'materialize-css/dist/css/materialize.min.css';
import "./styles/main.css"

createApp(App).use(router).mount('#app');
