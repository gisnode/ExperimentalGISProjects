<template>
  <div id="approot">
    <button class="inptbnt" v-on:click="selectimagesdir">Select Images Folder</button>
    <div class="clientmsg">{{ imagesdir }}</div>
    <button class="inptbnt" v-on:click="selectcsvfile">Select CSV File</button>
    <div class="clientmsg">{{ csvpath }}</div>
    <button class="inptbnt" v-on:click="selectoutdir">Select Output Folder</button>
    <div class="clientmsg">{{ outdir }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ref } from '@vue/reactivity';
import './App.scss';

import { ipcRenderer } from 'electron';

export default defineComponent({
  setup() {
    const imagesdir = ref('');
    const csvpath = ref('');
    const outdir = ref('');

    const selectimagesdir = () => {
      ipcRenderer.send('open-folder', ['Select Images Folder', 'imagesfolder']);
    }

    const selectcsvfile = () => {
      ipcRenderer.send('open-file', ['Select CSV File', 'csvfile']);
    }

    const selectoutdir = () => {
      ipcRenderer.send('open-folder', ['Select Output Folder', 'outputfolder']);
    }

    return {
      imagesdir, csvpath, outdir,
      selectimagesdir, selectcsvfile, selectoutdir
    }

  },
})
</script>
