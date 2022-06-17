<template>
  <div id="approot">
    <div>Hello App</div><br>
    <div><button v-on:click="doSomething">DoSomething</button></div><br>
    <div>{{ msg }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

import { ipcRenderer } from 'electron';

export default defineComponent({
  setup() {
    const msg = ref('joojoo');

    const doSomething = () => {
      console.log('Doing Now...');
      ipcRenderer.send('hey-done');
    }

    ipcRenderer.on('msg', (event, arg) => {
      console.log(arg);
      msg.value = arg;
    });

    return {
      doSomething, msg
    }
  },
})
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
