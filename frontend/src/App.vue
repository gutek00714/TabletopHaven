<template>
  <div id="app">
    <MainNavbar />
    <div class="row">
      <LeftMenu />
      <GameDetails />
    </div>
  </div>
</template>

<script>
import MainNavbar from '@/components/MainNavbar.vue';
import LeftMenu from '@/components/LeftMenu.vue';
import GameDetails from '@/components/GameDetails.vue';

export default {
  components: {
    MainNavbar,
    LeftMenu,
    GameDetails,
  },
}
</script>

<style>

</style>