<!-- Navbar.vue -->
<template>
  <nav class="light-blue lighten-1" role="navigation">
    <div class="nav-wrapper">
      <div class="row">
                <!-- Logo on the left -->
                <div class="col m2">
                    <a href="#" class="brand-logo">TabletopHaven</a>
                </div>
                
                <!-- Search bar in the center -->
                <div class="col m7">
                    <form>
                        <div class="input-field center-align search-bar-container">
                            <input id="search" type="search" required>
                            <label class="label-icon" for="search"><i class="material-icons">search</i></label>
                            <i class="material-icons">close</i>
                        </div>
                    </form>
                </div>

                <!-- Login button on the right -->
                <div class="col m3 right-align">
                    <button @click="loginWithGoogle" class="waves-effect waves-light btn">Register/Login</button>
                </div>
            </div>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'MainNavbar',
  // Możesz dodać właściwości, metody, itp.
  methods: {
    loginWithGoogle() {
      window.location.href = 'http://localhost:3000/auth/google';
    }
  }
}
</script>

<style scoped>
.nav-wrapper {
    padding-left: 10px;
    padding-right: 10px;
}
.search-bar-container {
  height: 64px;
  margin-left: 3rem;
}
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');

</style>
