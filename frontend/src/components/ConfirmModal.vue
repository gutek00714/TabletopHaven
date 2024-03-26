<template>
  <transition name="modal">
    <div class="modal-mask" v-if="isVisible">
      <div class="modal-wrapper">
        <div class="modal" @click.stop>
          <div class="modal-content">
            <slot name="content"></slot>
          </div>
          <div class="modal-footer">
            <button class="modal-close waves-effect waves-green" @click="$emit('confirm')">Yes</button>
            <button class="modal-close waves-effect waves-red" @click="$emit('close')">No</button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  props: {
    isVisible: {
      type: Boolean,
      required: true
    }
  }
};
</script>

<style scoped>
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: table;
  transition: opacity 0.3s ease;
}

.modal-wrapper {
  display: table-cell;
  vertical-align: middle;
}

.modal {
  background-color: #2b2d42;
  border-radius: 8px;
}

.modal-content {
  color: #ffffff;
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
  color: #FFFFFF;
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
