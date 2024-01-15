<!-- RightContent.vue -->
<template>
    <div class="col m9 column-background materialize-red main-content">
        <div class="main-site">
            <!-- Main site content here -->
            <div class="divider"></div>
            <div class="section white-text">
                <h5>News</h5>
                <div class="col m6">dupa</div>
                <div class="col m6">dupa1</div>
            </div>
            <div class="divider"></div>
            <div class="section white-text">
                <h5>Top 5</h5>
                <div v-for="item in backendItems" :key="item.id" class="col m2">{{ item.name }}</div>
            </div>
        </div>
    </div>
  </template>
  
  <script>
  export default {
      name: 'RightContent',
      data() {
          return {
              backendItems: [
                  { id: 1, name: 'Placeholder1' },
                  { id: 2, name: 'Placeholder2' },
                  { id: 3, name: 'Placeholder3' },
                  { id: 4, name: 'Placeholder4' },
                  { id: 5, name: 'Placeholder5' }
              ]
              // W rzeczywistości, zamiast używać statycznych danych, pobrałbyś dane z backendu i przypisałbyś je do backendItems
          };
      },
  }
  </script>
  
  <style scoped>
    .column-background.materialize-red.main-content {
        margin-left: 2.5rem;
        margin-top: 3rem;
        border-radius: 5px;
    }
  </style>
  