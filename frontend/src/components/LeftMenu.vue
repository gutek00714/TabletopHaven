<template>
  <div class="col m2">
      <div class="section" style="width: 80%">
        <h5>MENU</h5>
        <p :class="{ 'active-menu': currentPath === '/ranking' }">
          <router-link to="/ranking" class="waves-effect waves-teal btn-flat menu-button">Ranking</router-link>
        </p>
        <p :class="{ 'active-menu': isCategoryRoute }">           
          <router-link to="/categories" class="waves-effect waves-teal btn-flat menu-button">Categories</router-link>
        </p>
      </div>
      <div class="divider" style="width: 80%"></div>
      <div class="section" style="width: 80%">
        <h5>PROFILE</h5>
        <p :class="{ 'active-menu': currentPath === '/shelf' }">
          <router-link to="/shelf" class="waves-effect waves-teal btn-flat menu-button">Your Shelf</router-link>
        </p>
        <p :class="{ 'active-menu': currentPath === '/friends' }">
          <router-link to="/friends" class="waves-effect waves-teal btn-flat menu-button">Friends</router-link>
        </p>
        <p :class="{ 'active-menu': isGroupRoute }">
          <router-link to="/groups" class="waves-effect waves-teal btn-flat menu-button">Your Groups</router-link>
        </p>
      </div>
  </div>
</template>
  
<script>
export default {
  name: 'LeftMenu',
  computed: {
    currentPath() {
      return this.$route.path;
    },

    isGroupRoute() {
      return this.currentPath === '/groups' || this.currentPath.startsWith('/group/');
    },

    isCategoryRoute() {
      return this.currentPath === '/categories' || this.currentPath.startsWith('/games/category');
    }
  }
}
</script>

<style scoped>
.col{
  margin-left: 0 !important;
  position: fixed;
  top: 64px;
  left: 0;
  z-index: 1000;
}
.section h5 {
  color: #fff;
  text-shadow: 1px 1px 2px #000;
  margin-bottom: 20px;
}

.divider {
  margin: 10px 0;
}

.menu-button{
  color: #808191;
  text-shadow: 1px 1px 2px #000;
  text-transform: capitalize;
  width: 100%;
  box-sizing: border-box;
  transition: all 0.3s ease;
  border-radius: 4px;
  padding: 35px 20px;
  font-size: 18px;
  line-height: 0.1;
}

.menu-button:hover{
  background-color: #322f46;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.3);
  transform: translateY(-2px);
}

.active-menu {
  background-color: #171622;
  border-radius: 4px; 
}
</style>