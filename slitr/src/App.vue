<template>
  <div id="approot">
    <div class="title">GEO SLITR</div><br>
    <div class="sourcefoldertitle">SOURCE FOLDERS:</div>
    <div class="sourcefolders">
      <button class="addbtn" v-on:click="addsourcefolder" v-bind:disabled="sliting">+</button>
      <div class="folderlistingcontainer">
        <div class="folderlisting" v-for="(folder, index) in sourcefolders" v-bind:key="index">
          <span class="folderpath" v-bind:title="folder.path">
            {{ folder.path.length > 36 ? folder.path.substring(0, 36) + '...' : folder.path }}
          </span>
          <span class="removefolderbtn"><button v-on:click="removefolder" v-bind:id="folder.id">-</button></span>
        </div>
      </div>
    </div>

    <table style="margin: auto;">
      <tr>
        <td><button class="imgsbtn" v-on:click="selectgeojsonsfolder">GeoJSONs Folder</button></td>
        <td>
          <span>{{ geojsons }}</span><br>
          <span class="infomsg">GeoJSONs Total: {{ totalimages }}</span>
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
    <button class="slitbtn" v-on:click="startsliting">XIF</button>
    <button class="xitbtn" v-on:click="exitnow" id="xitbtn">Exit</button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import './App.scss';

import { ipcRenderer } from 'electron';
import { v4 as uuidv4 } from 'uuid';

export default defineComponent({
  setup() {

    // const imagesdir = ref('');
    // const gjpath = ref('');
    // const totalimages = ref(0);
    
    // const imagesdirdisplay = ref('X://folder');
    // const gjpathdisplay = ref('Y://file.csv');

    // const defaultMsg = 'Click XIF to Start';
    // const statusmsg = ref(defaultMsg);

    const sourcefolders: any = ref([
      { id: 'uuid1', path: 'D:/jack' },
      { id: 'uuid2', path: 'E:/mack' },
      { id: 'uuid4', path: 'E:/mack' },
      { id: 'uuid5', path: 'E:/mack' },
      // { id: 'uuid6', path: 'E:/mack' },
      // { id: 'uuid7', path: 'E:/mack' },
      // { id: 'uuid8', path: 'E:/mack' },
    ]);

    const sliting = ref(false);

    const addsourcefolder = () => {
      ipcRenderer.send('open-folder', ['Select Parent Folder', 'sourcefolder']);
    }

    ipcRenderer.on('sourcefolder', (event, arg) => {
      // console.log(arg);

      const foldersArry = [ ...sourcefolders.value, {
        id: uuidv4(),
        path: arg
      }];
      
      const key = 'path';
      const arrayUniqueByKey = [...new Map(foldersArry.map(folderObj => [folderObj[key], folderObj])).values()];
      sourcefolders.value = arrayUniqueByKey;
    });

    const removefolder = (e: any) => {
      let id = e.target.getAttribute('id');

      const filteredFoldersList = sourcefolders.value.filter((sourcefolder : any) => {
        return sourcefolder.id != id;
      });

      sourcefolders.value = filteredFoldersList;
    }

    // const startsliting = () => {

    // }

    return {
      sliting,
      sourcefolders, addsourcefolder, removefolder
    }
  },
})
</script>
