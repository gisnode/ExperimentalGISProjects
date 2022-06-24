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
        <td><button class="gjsfldrbtn" v-on:click="selectgeojsonsfolder">GeoJSONs Folder</button></td>
        <td>
          <span class="infomsg">{{ gjfolderdisplay }}</span><br>
          <span class="infomsg">GeoJSONs Total: {{ totalgjs }}</span>
        </td>
      </tr>
      <tr>
        <td><button class="targetfldrbtn" v-on:click="selecttargetfolder" v-bind:disabled="sliting">Target Folder</button></td>
        <td>
          <span class="infomsg">{{ targetfolderdisplay }}</span><br>
        </td>
      </tr>
    </table>

    <div class="actionmsg">{{ statusmsg }}</div>
    <button class="slitbtn" v-on:click="startsliting">Start</button>
    <button class="xitbtn" v-on:click="exitnow" id="xitbtn">Exit</button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import './App.scss';

import path from 'path';
import { ipcRenderer } from 'electron';
import { v4 as uuidv4 } from 'uuid';

export default defineComponent({
  setup() {

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

    const geojsonfolder = ref('');
    const targetfolder = ref('');

    const totalgjs = ref(0);
    
    const gjfolderdisplay = ref('X://folder1');
    const targetfolderdisplay = ref('Y://folder2');

    const defaultMsg = 'Click XIF to Start';
    const statusmsg = ref(defaultMsg);

    const selectgeojsonsfolder = () => {
      ipcRenderer.send('open-folder', ['Select GeoJSONs Folder', 'gjsfolder']);
    }

    const selecttargetfolder = () => {
      ipcRenderer.send('open-folder', ['Select Target Folder', 'targetfolder']);
    }

    ipcRenderer.on('gjsfolder', (event, arg) => {
      geojsonfolder.value = arg;

      let foldername = path.basename(arg);
      gjfolderdisplay.value = foldername.length < 10 ? foldername : foldername.substring(0, 10) + '...';
    });

    ipcRenderer.on('targetfolder', (event, arg) => {
      targetfolder.value = arg;

      let foldername = path.basename(arg);
      targetfolderdisplay.value = foldername.length < 10 ? foldername : foldername.substring(0, 10) + '...';
    });

    const startsliting = () => {
    }

    const exitnow = () => {
      ipcRenderer.send('exit-now');
    }

    return {
      sliting,
      geojsonfolder, totalgjs, gjfolderdisplay, statusmsg,
      targetfolder, targetfolderdisplay,
      sourcefolders, addsourcefolder, removefolder,
      selectgeojsonsfolder, selecttargetfolder,
      startsliting, exitnow
    }
  },
})
</script>
