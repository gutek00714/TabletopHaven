<template>
  <div id="app">
    <MainNavbar />
    <div class="row">
      <LeftMenu />
      <!-- The router-view component is where routed components will be displayed -->
      <router-view :key="$route.fullPath" />
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
/* Global style adjustments */
</style>