<!-- LeftMenu.vue -->
<template>
    <div class="col m2">
        <div class="divider"></div>
        <div class="section">
            <h5>MENU</h5>
            <p><a class="waves-effect waves-teal btn-flat custom-button">News</a></p>
            <p><a class="waves-effect waves-teal btn-flat custom-button">Ranking</a></p>
            <p><a class="waves-effect waves-teal btn-flat custom-button">Categories</a></p>
        </div>
        <div class="divider"></div>
        <div class="section">
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
    // Możesz dodać właściwości, metody, itp.
  }
  </script>
  
  <style scoped>
  .col{
    margin-left: 0 !important;
  }
  </style>
  