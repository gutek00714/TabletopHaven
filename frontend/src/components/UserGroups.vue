<template>
  <div class="col m11 column-background" v-if="isLoggedIn">
    <div class="section">
      <div class="header-section">
        <h4>User Groups</h4>
        <button @click="createGroup" class="btn-create-group">
          Create group
        </button>  
      </div>
      <div id="createGroupModal" class="modal" ref="createModal">
        <div class="modal-content">
          <h4>Create Group</h4>
          <input type="text" v-model="newGroupName" placeholder="Group Name" maxlength="30" style="color:#FAFAFA" />
        </div>
        <div class="modal-footer">
          <a href="#!" class="modal-close waves-effect waves-green btn-flat" @click="confirmCreateGroup">Create</a>
          <a href="#!" class="modal-close waves-effect waves-red btn-flat">Cancel</a>
        </div>
      </div>
      <div class="row group-container">
        <div v-for="group in groups" :key="group.id" @click="goToGroupDetail(group.id)">
          <router-link :to="`/group/${group.id}`" class="group-item">
            <div class="group-name">{{ group.name }}</div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
  <div class="loading-error" v-else>
    <p>User not logged in.</p>
  </div>
</template>


<script>
import axios from 'axios';
import router from '@/router';

export default {
  name: 'UserGroups',
  data() {
    return {
      groups: [],
      loading: false,
      error: null,
      isLoggedIn: false,
      newGroupName: '',
    };
  },
  mounted() {
    this.$nextTick(() => {
      const elems = document.querySelectorAll('.modal');
      // eslint-disable-next-line
      M.Modal.init(elems);
    });
  },
  async created() {
    await this.checkLoginStatus();
    await this.fetchUserGroups();
  },
  methods: {
    async checkLoginStatus() {
      try {
        const response = await axios.get('http://localhost:3000/check-login-status', { withCredentials: true });
        this.isLoggedIn = response.data.isLoggedIn;
      } catch (error) {
        console.error('Error checking login status:', error);
        this.isLoggedIn = false;
      }
    },

    async fetchUserGroups() {
      this.loading = true;
      try {
        const response = await axios.get('http://localhost:3000/user-groups', { withCredentials: true });
        this.groups = response.data;
      } catch (error) {
        this.error = error.response && error.response.data.message ? error.response.data.message : 'An error occurred while fetching groups.';
      } finally {
        this.loading = false;
      }
    },
    async createGroup() {
      const modalElement = this.$refs.createModal;
      // eslint-disable-next-line
      M.Modal.init(modalElement).open();
    },

    async confirmCreateGroup() {
      if (!this.newGroupName.trim()) {
        // eslint-disable-next-line
        M.toast({ html: 'Group name cannot be empty', displayLength: 4000});
        return;
      }

      try {
        await axios.post('http://localhost:3000/create-group', {
          groupName: this.newGroupName
        }, { withCredentials: true });

        this.newGroupName = ''; // Reset the input field
        await this.fetchUserGroups(); // Refresh the list of groups
        // eslint-disable-next-line
        M.toast({ html: 'Group created successfully!', displayLength: 4000});
      } catch (error) {
        console.error('Error creating group:', error.response.data);
        // eslint-disable-next-line
        M.toast({ html: 'Failed to create group', displayLength: 4000});
      }
    },


    goToGroupDetail(groupId) {
      router.push({ name: 'GroupDetail', params: { groupId } });
    }
  }
}
</script>

<style scoped>
.header-section {
  display: flex;
  align-items: center;
}

.group-container {
  display: flex;
  flex-wrap: wrap;
}

.group-container > div {
  margin: 0 50px 30px 0;
  flex: 0 0 230px;
}

.group-item {
  text-decoration: none;
  color: inherit;
  display: block;
  cursor: pointer;
}

.group-name {
  margin: 0.5rem;
  padding: 0.5rem;
  border-radius: 10px;
  background-color: #272538;
  transition: all 0.3s ease;
  box-shadow: 0px 6px 15px rgba(0, 0, 0, 0.5);
  color: #FFF;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  height: 100px;
  width: 100%;
  font-size: 18px;
}

.group-container > div:hover .group-name {
  background-color: #322f46;
  box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.8);
  transform: translateY(-2px);
}

.btn-create-group {
  background-color: #4e6ef2;
  margin-right: 10px;
  padding: 10px 15px;
  color: white;
  border: 2px solid #474747;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  transition: all 0.3s ease-in-out;
  font-size: 16px;
  font-weight: bold;
}

.btn-create-group:hover {
  background-color: #3b56c1;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  transform: translateY(-2px);
}

.btn-create-group {
  margin-left: 20px;
  margin-top: 15px;
}

.loading-error {
  font-size: 1.5rem;
  color: white;
  text-align: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  padding-right: 2rem;
}

.modal {
  background-color: #2b2d42;
  border-radius: 8px;
}

.modal-content {
  color: #FAFAFA;
  padding: 20px;
}

.modal-footer {
  background-color: #212136 !important;
  border-top: 1px solid #42445a !important;
  padding: 12px 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-footer .modal-close:first-child {
  margin-right: 1rem;
}

.modal-close {
  color: #FAFAFA;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 36px;
  line-height: normal;
  padding: 0 1rem;
  margin: 0 10px;
  border-radius: 4px;
  transition: background-color 0.3s ease;
  text-transform: uppercase;
  font-weight: bold;
}

.modal-close.waves-effect {
  display: inline-block;
  padding: 10px 25px;
  margin: 0 5px;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.modal-close.waves-green {
  background-color: #4caf50;
}

.modal-close.waves-red {
  background-color: #e53935;
}

.modal-close:hover {
  transition: all 0.3s ease-in-out;
  background-color: #5c5c5c;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  transform: translateY(-2px);
}
</style>
