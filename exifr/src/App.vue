<template>
  <div id="approot">
    <div class="title">EXIFR</div>
    <table style="margin: auto;">
      <tr>
        <td><button class="inputbtn" v-on:click="selectimagesdir">Select Images Folder</button></td>
        <td><button class="inputbtn" v-on:click="selectcsvfile">Select CSV File</button></td>
      </tr>
      <tr>
        <td><span>{{ imagesdir }}</span></td>
        <td><span>{{ csvpath }}</span></td>
      </tr>
    </table>

    <table style="margin: auto;">
      <tr>
        <td>
          <span>Has Header</span>&emsp;<input type="checkbox" v-model="hasHeader" v-bind:disabled="!csvLoaded">
        </td>
      </tr>
    </table>
    <br>
    <table style="margin: auto;" v-show="csvLoaded">
      <tr>
        <td>
          <span>Image Name</span>
        </td><td>
          <select v-model="imgnamecolumn">
            <option disabled value="">Select Column</option>
            <option v-for="(col, index) in columnList" v-bind:key="index">{{ col }}</option>
          </select>
        </td>
        <td>
          <span>Latitude</span>
        </td><td>
          <select v-model="latitudecolumn">
            <option disabled value="">Select Column</option>
            <option v-for="(col, index) in columnList" v-bind:key="index">{{ col }}</option>
          </select>
        </td>
      </tr>
      <tr>
        <td>
          <span>Longitude</span>
        </td><td>
          <select v-model="longitudecolumn">
            <option disabled value="">Select Column</option>
            <option v-for="(col, index) in columnList" v-bind:key="index">{{ col }}</option>
          </select>
        </td>
        <td>
          <span>Altitude</span>
        </td><td>
          <select v-model="altitudeecolumn">
            <option disabled value="">Select Column</option>
            <option v-for="(col, index) in columnList" v-bind:key="index">{{ col }}</option>
          </select>
        </td>
      </tr>
    </table>
    
    <div class="clientmsg">
      
    </div>
    <br>
    <button class="cmdbtn" v-on:click="startexifing">Start EXIFR</button>
    <button class="cmdbtn" v-on:click="exitnow">Exit</button>
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

    const csvLoaded = ref(true);
    const hasHeader = ref(false);

    const imgnamecolumn = ref();
    const latitudecolumn = ref();
    const longitudecolumn = ref();
    const altitudeecolumn = ref();

    const columnList = ref(['col1', 'col2', 'col3']);

    const csvParams = {
      hasHeader, csvLoaded,
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

    const startexifing = () => {
      console.log('yes started');
    }

    return {
      imagesdir, csvpath,
      selectimagesdir, selectcsvfile, selectoutdir,
      ...csvParams,
      startexifing
    }

  },
})
</script>
