<!-- LeftMenu.vue -->
<template>
  <div class="col m2">
      <div class="section" style="width: 80%">
          <h5>MENU</h5>
          <p><a class="waves-effect waves-teal btn-flat custom-button">News</a></p>
          <p><a class="waves-effect waves-teal btn-flat custom-button">Ranking</a></p>
          <p><a class="waves-effect waves-teal btn-flat custom-button">Categories</a></p>
      </div>
      <div class="divider" style="width: 80%"></div>
      <div class="section" style="width: 80%">
          <h5>PROFILE</h5>
          <p><a class="waves-effect waves-teal btn-flat custom-button">Your shelf</a></p>
          <p><a class="waves-effect waves-teal btn-flat custom-button">Friends</a></p>
          <p><a class="waves-effect waves-teal btn-flat custom-button">Your groups</a></p>
      </div>
  </div>
</template>

<script>
export default {
  name: 'LeftMenu',
  
}
</script>

<style scoped>
.col{
  margin-left: 0 !important;
  height: 100vh;
}

.custom-button{
  color: #808191;
  text-transform: capitalize;
  width: 100%;
  box-sizing: border-box;
  transition: background-color 0.3s ease;
  border-radius: 4px;
}

.custom-button:hover{
  background-color: #322f46;
}
</style>