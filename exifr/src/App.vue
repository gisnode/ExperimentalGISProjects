<template>
  <div id="approot">
    <div style="font-size:20px;">EXIFR</div><br/>
    <button class="inputbtn" v-on:click="selectimagesdir">Select Images Folder</button>
    <div class="clientmsg">{{ imagesdir }}</div>
    <button class="inputbtn" v-on:click="selectcsvfile">Select CSV File</button>
    <div class="clientmsg">{{ csvpath }}</div>
    <input type="checkbox" v-model="hasHeader">
    <span>Has Header</span><br/>
    <button class="inputbtn" v-on:click="selectoutdir">Select Output Folder</button>
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
    const imagesdir = ref('X://folder');
    const csvpath = ref('X://folder/csvfile');
    const outdir = ref('Y://folde21');

    const hasHeader = ref(true);

    const selectimagesdir = () => {
      ipcRenderer.send('open-folder', ['Select Images Folder', 'imagesfolder']);
    }

    const selectcsvfile = () => {
      ipcRenderer.send('open-file', ['Select CSV File', 'csvfile']);
    }

    const selectoutdir = () => {
      ipcRenderer.send('open-folder', ['Select Output Folder', 'outputfolder']);
    }

    ipcRenderer.on('imagesfolder', (event, arg) => {
      imagesdir.value = arg;
    });

    ipcRenderer.on('csvfile', (event, arg) => {
      csvpath.value = arg;
    });

    ipcRenderer.on('outputfolder', (event, arg) => {
      outdir.value = arg;
    });

    return {
      imagesdir, csvpath, outdir,
      selectimagesdir, selectcsvfile, selectoutdir,
      hasHeader
    }

  },
})
</script>
