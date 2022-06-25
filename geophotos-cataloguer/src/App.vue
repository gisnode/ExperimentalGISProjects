<template>
  <div id="approot">
    <div class="title">GEOPHOTOS CATALOGR</div><br>
    <div class="systeminfo">
      <div>{{ systeminfo1 }}</div>
      <div>{{ systeminfo2 }}</div>
      <div>{{ systeminfo3 }}</div>
    </div><br>

    <div class="sourcefoldertitle">SOURCE FOLDERS:</div>
    <div class="sourcefolders">
      <button class="addbtn" v-on:click="addsourcefolder" v-bind:disabled="running">+</button>
      <div class="folderlistingcontainer">
        <div class="folderlisting" v-for="(folder, index) in sourcefolders" v-bind:key="index">
          <span class="folderpath" v-bind:title="folder.path">
            {{ folder.path.length > 36 ? folder.path.substring(0, 36) + '...' : folder.path }}
          </span>
          <span class="removefolderbtn"><button v-on:click="removefolder" v-bind:id="folder.id">-</button></span>
        </div>
      </div>
    </div><br>

    <div class="countmsg">Total Images: {{ totalimages }}</div>
    <div class="countmsg">Total Folders: {{ totalfolders }}</div><br>
    <div class="actionmsg">{{ statusmsg }}</div>
    <button class="startbtn" v-on:click="startrunning">Start</button>
    <button class="xitbtn" v-on:click="exitnow" id="xitbtn">Exit</button>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import './App.scss';

import os from 'os';
import path from 'path';
import fs from 'fs';

import { ipcRenderer } from 'electron';
import { v4 as uuidv4 } from 'uuid';

export default defineComponent({
  setup() {
    const systeminfo1 = ref('');
    const systeminfo2 = ref('');
    const systeminfo3 = ref('');

    onMounted(() => {
      systeminfo1.value = `HostName: ${os.hostname()} `;
      systeminfo2.value = `User: ${os.userInfo().username}`;
      systeminfo3.value = `Machine: ${os.arch()} ${os.platform()} ${os.endianness()}`;
    });

    const sourcefolders: any = ref([
      // { id: 'uuid1', path: 'D:/jack' },
      // { id: 'uuid2', path: 'E:/mack' },
      // { id: 'uuid2', path: 'E:/mack' },
      // { id: 'uuid2', path: 'E:/mack' },
      // { id: 'uuid2', path: 'E:/mack' },
      { id: '1', path: 'D:/44P395421-44P396421/Geotagged/FLY_0086_17_03_22_05_27_08_039/Geotagged/UMC-R10C (PPK)' }
    ]);

    const running = ref(false);

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

    const defaultMsg = 'Click on Start';
    const statusmsg = ref(defaultMsg);

    const totalimages = ref(0);
    const totalfolders = ref(0);

    const showTempMsg = (msg: any, seconds: any) => {
      statusmsg.value = msg;
      setTimeout(() => {
        statusmsg.value = defaultMsg;
      }, seconds * 1000);
    }

    const startrunning = () => {
      if(sourcefolders.value.length == 0){
        showTempMsg('Add Source Folders', 2);
        return;
      }

      console.log('started...');
      // console.log(os.systeminfo1());
    }

    const exitnow = () => {
      ipcRenderer.send('exit-now');
    }

    return {
      systeminfo1, systeminfo2, systeminfo3,
      running, totalimages, totalfolders,
      sourcefolders, addsourcefolder, removefolder,
      statusmsg, startrunning, exitnow
    }
  },
})
</script>