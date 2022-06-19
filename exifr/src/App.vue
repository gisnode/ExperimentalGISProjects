<template>
  <div id="approot">
    <div class="title">GPS EXIFR</div>
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

    <table style="margin: auto;" v-show="csvLoaded">
      <tr>
        <td>
          <span>Has Header</span>&emsp;<input type="checkbox" v-model="hasHeader" v-bind:disabled="!csvLoaded">
        </td>
      </tr>
    </table>
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
    
    <br>
    <div class="clientmsg">{{ statusmsg }}</div>
    <button class="cmdbtn" v-on:click="startexifing">XIF GPS</button>
    <button class="cmdbtn" v-on:click="exitnow">Exit</button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ref } from '@vue/reactivity';
import './App.scss';

import { ipcRenderer } from 'electron';
import path from 'path';

export default defineComponent({
  setup() {
    const imagesdir = ref('X://folder');
    const csvpath = ref('Y://file.csv');

    const defaultMsg = 'Click XIF to Start';
    const statusmsg = ref(defaultMsg);

    const csvLoaded = ref(false);
    const hasHeader = ref(false);

    const imgnamecolumn = ref();
    const latitudecolumn = ref();
    const longitudecolumn = ref();
    const altitudeecolumn = ref();

    const columnList = ref(['1', '2', '3', '4']);

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

    const showTempMsg = (msg: any, seconds: any) => {
      statusmsg.value = msg;
      setTimeout(() => {
        statusmsg.value = defaultMsg;
      }, seconds * 1000);
    }

    ipcRenderer.on('imagesfolder', (event, arg) => {
      let foldername = path.basename(path.dirname(arg));
      imagesdir.value = foldername.length < 10 ? foldername : foldername.substring(0, 10) + '...';
    });

    ipcRenderer.on('csvfile', (event, arg) => {
      if(path.extname(arg) == '.csv'){
        let filename = path.basename(arg, '.csv');
        csvpath.value = filename.length < 10 ? filename + '.csv' : filename.substring(0, 10) + '.. .csv';

        csvActions();
      } else {
        showTempMsg('Only CSVs', 2);
      }
    });

    const csvActions = () => {
      csvLoaded.value = true;
      hasHeader.value = false;

      imgnamecolumn.value = '1';
      latitudecolumn.value = '2';
      longitudecolumn.value = '3';
      altitudeecolumn.value = '4';
    }

    const startexifing = () => {
      console.log('yes started');

    }

    return {
      statusmsg, imagesdir, csvpath,
      selectimagesdir, selectcsvfile,
      ...csvParams,
      startexifing
    }

  },
})
</script>
