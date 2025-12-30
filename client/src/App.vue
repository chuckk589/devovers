<script setup lang="ts">
</script>

<template>
  <v-app>
    <v-main style="padding: 0; margin: 0;">
      <router-view />
    </v-main>
  </v-app>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  overflow: hidden;
}

body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

body::-webkit-scrollbar {
  display: none;
}

#app {
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
}

.v-application {
  background: transparent !important;
  overflow: hidden;
  width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
}

.v-main {
  padding: 0 !important;
  margin: 0 !important;
  overflow: hidden;
  width: 100% !important;
}

*::-webkit-scrollbar {
  display: none;
}

* {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
