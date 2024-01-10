<template>
  <div>
    <h2>Login with Google</h2>
    <a class="waves-effect waves-light btn"><button @click="loginWithGoogle">Login with Google</button></a>
  </div>
</template>

<script>
export default {
  name: "UserLogin",
  methods: {
    loginWithGoogle() {
      window.location.href = 'http://localhost:3000/auth/google';
    }
  }
}
</script>
