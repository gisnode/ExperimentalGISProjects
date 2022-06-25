<template>
  <div id="approot">
    <div class="title">GEOPHOTOS CATALOGR</div><br>
    <table style="margin:auto;">
      <tr>
        <td>
          <div class="systeminfo">
            <div>{{ systeminfo1 }}</div>
            <div>{{ systeminfo2 }}</div>
            <div>{{ systeminfo3 }}</div>
          </div>
        </td>
        <td>
          <div class="outfoldercontainer">
            <div><button class="outfolderbtn" v-on:click="selectoutfolder" v-bind:disabled="running">Out DB Path</button></div>
            <div>
              <span class="secondarymsg" v-bind:title="outputfolder">
              {{ outputfolder.length > 36 ? outputfolder.substring(0, 20) + '...' : outputfolder }}
              </span>
            </div>
          </div>
        </td>
      </tr>
    </table>
    <br>

    <div class="sourcefoldertitle">SOURCE FOLDERS:</div>
    <div class="sourcefolders">
      <button class="addbtn" v-on:click="addsourcefolder" v-bind:disabled="running">+</button>
      <div class="folderlistingcontainer">
        <div class="folderlisting" v-for="(folder, index) in sourcefolders" v-bind:key="index">
          <span class="folderpath" v-bind:title="folder.path">
            {{ folder.path.length > 36 ? folder.path.substring(0, 36) + '...' : folder.path }}
          </span>
          <span class="removefolderbtn"><button v-on:click="removefolder" v-bind:id="folder.id" v-bind:disabled="running">-</button></span>
        </div>
      </div>
    </div><br>

    <div class="secondarymsg">Images Catalogued: {{ imagescatalogued }}</div><br>
    <div class="primarymsg">{{ statusmsg }}</div>
    <button class="startbtn" v-on:click="startrunning" v-bind:disabled="running">Start</button>
    <button class="xitbtn" v-on:click="exitnow" id="xitbtn">Exit</button>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import './App.scss';

import os from 'os';
import path from 'path';

import { ipcRenderer } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import fg from 'fast-glob';
import Database from 'better-sqlite3';

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
      { id: '1', path: 'D:/TESTS/exifrtestbig' }
    ]);

    const running = ref(false);

    const addsourcefolder = () => {
      ipcRenderer.send('open-folder', ['Select Parent Folder', 'sourcefolder']);
    }

    ipcRenderer.on('sourcefolder', (event, arg) => {
      // console.log(arg);
      imagescatalogued.value = 0;

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

    const outputfolder = ref('D:/TESTS/exifrtest');

    const selectoutfolder = () => {
      ipcRenderer.send('open-folder', ['Select Output Folder', 'outputfolder']);
    }

    ipcRenderer.on('outputfolder', (event, arg) => {
      // console.log(arg);
      outputfolder.value = arg;
    });

    const defaultMsg = 'Click on Start';
    const statusmsg = ref(defaultMsg);

    const imagescatalogued = ref(0);

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

      if(outputfolder.value == ''){
        showTempMsg('Set Output Folder', 2);
        return;
      }

      imagescatalogued.value = 0;
      running.value = true;
      statusmsg.value = defaultMsg;

      startCataloging();
    }

    const outdbref = ref();

    const startCataloging = async () => {
      setUpDatabase();

      for(let i = 0; i < sourcefolders.value.length; i++){
        // console.log(sourcefolders.value[i].path);

        const stream = fg.stream(['**/*.jpg', '**/*.jpeg'], { 
          cwd: sourcefolders.value[i].path,
          caseSensitiveMatch: false,
          suppressErrors: true
        });

        for await (const entry of stream) {
          let imagePath = path.join(sourcefolders.value[i].path, entry.toString());
          // console.log(imagePath);

          imagescatalogued.value = imagescatalogued.value + 1;
        }
      }

      statusmsg.value = 'Completed';
      running.value = false;
    }

    const addGNSSEntryForCamera = (imagePath: any) => new Promise(resolve => {

    });

    // const getInfo

    const setUpDatabase = () => {
      const dbPath = path.join(outputfolder.value, 'cameras.db'); 
      const db = new Database(dbPath);

      const createTable = `CREATE TABLE IF NOT EXISTS cameras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        camera TEXT,
        lon REAL, lat REAL, alt REAL,
        path TEXT
      )`;

      db.exec(createTable);
      outdbref.value = db;
    }

    const exitnow = () => {
      ipcRenderer.send('exit-now');
    }

    return {
      systeminfo1, systeminfo2, systeminfo3,
      running, imagescatalogued, outputfolder, selectoutfolder,
      sourcefolders, addsourcefolder, removefolder,
      statusmsg, startrunning, exitnow
    }
  },
})
</script>