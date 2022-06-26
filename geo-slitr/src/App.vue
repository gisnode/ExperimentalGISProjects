<template>
  <div id="approot">
    <div class="movable">
      <svg xmlns="http://www.w3.org/2000/svg" height="48" width="48"><path d="m24 44-8.15-8.15 2.2-2.2 4.45 4.45v-9.45h3v9.45l4.45-4.45 2.2 2.2ZM11.9 31.9 4 24l7.95-7.95 2.2 2.2L9.9 22.5h9.45v3H9.9l4.2 4.2Zm24.2 0-2.2-2.2 4.2-4.2h-9.4v-3h9.4l-4.2-4.2 2.2-2.2L44 24ZM22.5 19.3V9.9l-4.2 4.2-2.2-2.2L24 4l7.9 7.9-2.2 2.2-4.2-4.2v9.4Z"/></svg>
    </div>
    <div class="title">GEO SLITR</div><br>
    <table style="margin:auto;">
      <tr>
        <td rowspan="2">
          <div class="systeminfo">
            <div>{{ systeminfo1 }}</div>
            <div>{{ systeminfo2 }}</div>
            <div>{{ systeminfo3 }}</div>
          </div>
        </td>
        <td>
          <button class="outfolderbtn" v-on:click="selectoutfolder" v-bind:disabled="running">Output Folder</button>
        </td>
        <td>
          <div>
            <span class="secondarymsg" v-bind:title="outputfolder">
              {{ outputfolder.length > 36 ? outputfolder.substring(0, 20) + '...' : outputfolder }}
            </span>
          </div>
        </td>
      </tr>
      <tr>
        <td>
          <button class="gjsfldrbtn" v-on:click="selectgeojsonsfolder">GeoJSONs Folder</button>
        </td>
        <td>
          <span class="infomsg" v-bind:title="geojsonsfolder">{{ gjfolderdisplay }}</span><br>
          <span class="countmsg">GeoJSONs Total: {{ totalgjs }}</span>
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

    <div class="secondarymsg">Images Came Across: {{ imagescameacross }}</div>
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

import { exec } from 'child_process';

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
      // { id: '1', path: 'D:/TESTS/exifrtest' }
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

    // const outputfolder = ref('D:/TESTS/exifrtest');
    const outputfolder = ref('');

    const selectoutfolder = () => {
      ipcRenderer.send('open-folder', ['Select Output Folder', 'outputfolder']);
    }

    ipcRenderer.on('outputfolder', (event, arg) => {
      // console.log(arg);
      outputfolder.value = arg;
    });

    const defaultMsg = 'Click on Start';
    const statusmsg = ref(defaultMsg);

    const imagescameacross = ref(0);
    const imagescatalogued = ref(0);

    const showTempMsg = (msg: any, seconds: any) => {
      statusmsg.value = msg;
      setTimeout(() => {
        statusmsg.value = defaultMsg;
      }, seconds * 1000);
    }

    const execPath = ref('');

    ipcRenderer.on('binary-path', (event, arg) => {
      // console.log(arg);
      execPath.value = path.resolve(path.join(arg, './exiv2.exe'));
    });

    const getBinaryPath = () => {
      ipcRenderer.send('binary-path');
    }

    onMounted(() => {
      getBinaryPath();
    });

    const startrunning = () => {
      if(sourcefolders.value.length == 0){
        showTempMsg('Add Source Folders', 2);
        return;
      }

      if(outputfolder.value == ''){
        showTempMsg('Set Out DB Path', 2);
        return;
      }

      imagescameacross.value = 0;
      imagescatalogued.value = 0;

      running.value = true;
      statusmsg.value = defaultMsg;

      startCataloging();
    }

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

          await addGNSSEntryForCamera(imagePath);
          imagescameacross.value = imagescameacross.value + 1;
        }
      }

      statusmsg.value = 'Completed';
      running.value = false;
      // const db = new Database(path.join(outputfolder.value, 'cameras.db'));
      // db.close();
    }

    const addGNSSEntryForCamera = (imagePath: any) => new Promise(resolve => {
      try {
        let cmdCLI = `"${execPath.value}" -K Exif.GPSInfo.GPSLongitude -K Exif.GPSInfo.GPSLatitude -K Exif.GPSInfo.GPSAltitude`;
        cmdCLI += ` -Pv "${imagePath}"`;

        exec(cmdCLI, (error, stdout, stderr) => { 
          // console.log(stdout); console.log(stderr);

          try {
            let gnssInfoParts = stdout.toString().split('\r\n');
            // console.log(gnssInfoParts);
            const gpsLonParts = gnssInfoParts[1].replace(/\s\s+/g, ' ').trim().split(' ');
            let gpsLonD = parseInt(gpsLonParts[0].split('/')[0]) / parseInt(gpsLonParts[0].split('/')[1]);
            let gpsLonM = parseInt(gpsLonParts[1].split('/')[0]) / parseInt(gpsLonParts[1].split('/')[1]);
            let gpsLonS = parseInt(gpsLonParts[2].split('/')[0]) / parseInt(gpsLonParts[2].split('/')[1]);
            let gpsLon = gpsLonD + gpsLonM / 60 + gpsLonS / 3600;
            // console.log(gpsLonParts, gpsLonD, gpsLonM, gpsLonS);
            const gpsLatParts = gnssInfoParts[0].replace(/\s\s+/g, ' ').trim().split(' ');
            let gpsLatD = parseInt(gpsLatParts[0].split('/')[0]) / parseInt(gpsLatParts[0].split('/')[1]);
            let gpsLatM = parseInt(gpsLatParts[1].split('/')[0]) / parseInt(gpsLatParts[1].split('/')[1]);
            let gpsLatS = parseInt(gpsLatParts[2].split('/')[0]) / parseInt(gpsLatParts[2].split('/')[1]);
            let gpsLat = gpsLatD + gpsLatM / 60 + gpsLatS / 3600;
            // console.log(gpsLatParts, gpsLatD, gpsLatM, gpsLatS);
            const gpsAltParts = gnssInfoParts[2].trim().split('/');
            let gpsAlt = parseInt(gpsAltParts[0]) / parseInt(gpsAltParts[1]);
            // console.log(gpsAltParts);
            
            if(isNaN(gpsLon) || isNaN(gpsLat) || isNaN(gpsAlt)) {
              insertRawCamera(imagePath);
              resolve(1);
            }

            // console.log(path.basename(imagePath), gpsLon, gpsLat, gpsAlt, imagePath);

            const db = new Database(path.join(outputfolder.value, 'cameras.db'));
            db.prepare('INSERT INTO gnsscameras (camera, lon, lat, alt, path) VALUES (?, ?, ?, ?, ?)')
            .run(path.basename(imagePath), gpsLon, gpsLat, gpsAlt, imagePath).lastInsertRowid;

            imagescatalogued.value = imagescatalogued.value + 1;
            resolve(0);
          } catch (e) {
            insertRawCamera(imagePath);
            resolve(1);
          }
        });
      } catch (e) {
        insertRawCamera(imagePath);
        resolve(1);
      }
    });

    const insertRawCamera = (imagePath: any) => {
      const db = new Database(path.join(outputfolder.value, 'cameras.db'));
      db.prepare('INSERT INTO rawcameras (camera, parentfolder) VALUES (?, ?)')
      .run(path.basename(imagePath), path.dirname(imagePath)).lastInsertRowid;
    }

    const setUpDatabase = () => {
      const db = new Database(path.join(outputfolder.value, 'cameras.db'));

      const createTable1 = `CREATE TABLE IF NOT EXISTS gnsscameras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        camera TEXT,
        lon REAL, lat REAL, alt REAL,
        path TEXT
      )`;

      const createTable2 = `CREATE TABLE IF NOT EXISTS rawcameras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        camera TEXT,
        parentfolder TEXT
      )`;

      db.exec(createTable1);
      db.exec(createTable2);
    }

    const exitnow = () => {
      ipcRenderer.send('exit-now');
    }

    return {
      systeminfo1, systeminfo2, systeminfo3,
      running, imagescameacross, imagescatalogued, 
      outputfolder, selectoutfolder,
      sourcefolders, addsourcefolder, removefolder,
      statusmsg, startrunning, exitnow
    }
  },
})
</script>