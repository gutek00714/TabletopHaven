<template>
  <div id="app">
    <MainNavbar />
    <div class="row">
      <LeftMenu />
      <!-- The router-view component is where routed components will be displayed -->
      <div class="main-content">
        <router-view :key="$route.fullPath" />
      </div>
    </div>
  </div>
</template>

<script>
import MainNavbar from '@/components/MainNavbar.vue';
import LeftMenu from '@/components/LeftMenu.vue';

export default {
  components: {
    MainNavbar,
    LeftMenu,
  },
}
</script>

<style>
.main-content {
  margin-left: 17%;
  margin-top: 5rem;
  color: #e2e2e2;
}
</style>