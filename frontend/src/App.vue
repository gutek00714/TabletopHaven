<template>
  <div id="app">
    <MainNavbar />
    <div class="row">
      <LeftMenu />
      <RightContent />
    </div>
  </div>
</template>

<script>
import MainNavbar from '@/components/MainNavbar.vue';
import LeftMenu from '@/components/LeftMenu.vue';
import RightContent from '@/components/RightContent.vue';

export default {
  components: {
    MainNavbar,
    LeftMenu,
    RightContent,
  },
}
</script>

<style>
/* Dostosuj globalny styl tutaj, jeśli to konieczne */
</style>
