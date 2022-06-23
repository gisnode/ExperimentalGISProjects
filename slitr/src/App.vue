<template>
  <div id="approot">
    <div class="title">GEO SLITR</div><br>
    <table style="margin: auto;">
      <tr>
        <td><button class="imgsbtn" v-on:click="selectimagesdir" v-bind:disabled="sliting">Images Folder</button></td>
        <td>
          <span>{{ imagesdirdisplay }}</span><br>
          <span class="infomsg">Images Total: {{ totalimages }}</span>
        </td>
      </tr>
      <tr>
        <td><button class="gjbtn" v-on:click="selectgeojsonfile" v-bind:disabled="sliting">GeoJSON</button></td>
        <td>
          <span>{{ csvpathdisplay }}</span><br>
          <span class="infomsg">Buffer: {{ geoinfo }}</span>
        </td>
      </tr>
      <tr>
        <td><button class="imgsbtn" v-on:click="selectimagesdir" v-bind:disabled="sliting">Target Folder</button></td>
        <td>
          <span>{{ imagesdirdisplay }}</span><br>
          <span class="infomsg">Images Total: {{ totalimages }}</span>
        </td>
      </tr>
    </table>

    <div class="actionmsg">{{ statusmsg }}</div>
    <button class="slitbtn" v-on:click="startsliting" v-bind:disabled="sliting">XIF</button>
    <button class="xitbtn" v-on:click="exitnow">Exit</button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import './App.scss';

export default defineComponent({
  setup() {
    const imagesdir = ref('');
    const gjpath = ref('');
    const totalimages = ref(0);
    
    const imagesdirdisplay = ref('X://folder');
    const gjpathdisplay = ref('Y://file.csv');

    const defaultMsg = 'Click XIF to Start';
    const statusmsg = ref(defaultMsg);

    const startsliting = () => {

    }

    return {

    }
  },
})
</script>
