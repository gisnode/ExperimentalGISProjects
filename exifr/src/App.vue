<template>
  <div id="approot">
    <div style="font-size:20px;">EXIFR</div><br/>
    <button class="inputbtn" v-on:click="selectimagesdir">Select Images Folder</button>
    <div class="clientmsg">{{ imagesdir }}</div>
    <button class="inputbtn" v-on:click="selectcsvfile">Select CSV File</button>
    <div class="clientmsg">{{ csvpath }}</div>
    <input type="checkbox" v-model="hasHeader">
    <br/>
    <span>Has Header</span><br/><br/>

    <span>Image Name: </span>
    <select v-model="imgname">
      <option disabled value="">Select Image</option>
      <option v-for="(col, index) in columnList" v-bind:key="index">{{ col }}</option>
    </select>
    <br/><br/>

    <span>Latitude: </span>
    <select v-model="latitudecolumn">
      <option disabled value="">Select Latitude</option>
      <option v-for="(col, index) in columnList" v-bind:key="index">{{ col }}</option>
    </select>
    <br/><br/>

    <span>Longitude: </span>
    <select v-model="latitudecolumn">
      <option disabled value="">Select Latitude</option>
      <option v-for="(col, index) in columnList" v-bind:key="index">{{ col }}</option>
    </select>
    <br/><br/>

    <span>Altitude: </span>
    <select v-model="latitudecolumn">
      <option disabled value="">Select Latitude</option>
      <option v-for="(col, index) in columnList" v-bind:key="index">{{ col }}</option>
    </select>
    <br/><br/>

    <button class="inputbtn" v-on:click="selectoutdir">Select Output Folder</button>
    <div class="clientmsg">{{ outdir }}</div>
    <button class="inputbtn" v-on:click="startexifing">Start EXIFR</button>
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

    const imgnamecolumn = ref();
    const latitudecolumn = ref();
    const longitudecolumn = ref();
    const altitudeecolumn = ref();

    const columnList = ref(['col1', 'col2', 'col3']);

    const csvParams = {
      hasHeader, 
      imgnamecolumn, latitudecolumn, longitudecolumn, altitudeecolumn, columnList
    };

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

    const startexifing = () => {
      console.log('yes started');
    }

    return {
      imagesdir, csvpath, outdir,
      selectimagesdir, selectcsvfile, selectoutdir,
      ...csvParams,
      startexifing
    }

  },
})
</script>
