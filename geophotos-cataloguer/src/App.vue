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
      { id: '1', path: 'D:/TESTS/exifrtest' }
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
        showTempMsg('Set Output Folder', 2);
        return;
      }

      imagescameacross.value = 0;
      imagescatalogued.value = 0;

      running.value = true;
      statusmsg.value = defaultMsg;

      startCataloging();
    }

    const dboutref = ref();

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
              resolve(1);
            }

            // console.log(path.basename(imagePath), gpsLon, gpsLat, gpsAlt, imagePath);

            const db = new Database(path.join(outputfolder.value, 'cameras.db'));

            // (camera, lon, lat, alt, path)
            db.prepare('INSERT INTO cameras (camera, lon, lat, alt, path) VALUES (?, ?, ?, ?, ?)')
            .run(path.basename(imagePath), gpsLon, gpsLat, gpsAlt, imagePath).lastInsertRowid;

            imagescatalogued.value = imagescatalogued.value + 1;
            resolve(0);
          } catch (e) { resolve(1) }
        });
      } catch (e) { resolve(1) }
    });

    const setUpDatabase = () => {
      const db = new Database(path.join(outputfolder.value, 'cameras.db'));

      const createTable = `CREATE TABLE IF NOT EXISTS cameras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        camera TEXT,
        lon REAL, lat REAL, alt REAL,
        path TEXT
      )`;

      db.exec(createTable);
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